"""LinkShort - encurtador de URLs com Flask + SQLite."""
import os, re, secrets, sqlite3, string
from datetime import datetime, timezone
from urllib.parse import urlsplit
from flask import Flask, abort, g, jsonify, redirect, render_template, request

ALPHABET = string.ascii_letters + string.digits
CODE_RE = re.compile(r"^[A-Za-z0-9_-]{3,32}$")
RESERVED = {"api", "static", "dashboard", "health"}
MAX_URL = 2048


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def validate_url(raw):
    """Aceita só http/https com host. Retorna (url, erro)."""
    url = (raw or "").strip()
    if not url:
        return None, "Informe uma URL."
    if len(url) > MAX_URL:
        return None, "URL muito longa."
    if "://" not in url:
        url = "https://" + url
    try:
        parts = urlsplit(url)
        host = parts.hostname
    except ValueError:
        return None, "URL inválida."
    if parts.scheme not in ("http", "https") or not host or "." not in host and host != "localhost":
        return None, "Use uma URL http(s) válida."
    if any(c.isspace() or ord(c) < 32 for c in url):
        return None, "URL contém caracteres inválidos."
    return url, None


def create_app(db_path=None):
    app = Flask(__name__)
    app.config["DB_PATH"] = db_path or os.environ.get("LINKSHORT_DB", "linkshort.db")

    def db():
        if "db" not in g:
            g.db = sqlite3.connect(app.config["DB_PATH"])
            g.db.row_factory = sqlite3.Row
        return g.db

    @app.teardown_appcontext
    def close(_):
        conn = g.pop("db", None)
        if conn:
            conn.close()

    with sqlite3.connect(app.config["DB_PATH"]) as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS links(
            id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL,
            url TEXT NOT NULL, created_at TEXT NOT NULL, last_access TEXT);
        CREATE TABLE IF NOT EXISTS visits(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE, at TEXT NOT NULL);
        PRAGMA journal_mode=WAL;""")

    def new_code():
        for _ in range(10):
            code = "".join(secrets.choice(ALPHABET) for _ in range(6))
            if not db().execute("SELECT 1 FROM links WHERE code=?", (code,)).fetchone():
                return code
        raise RuntimeError("não foi possível gerar código único")

    def row(r):
        d = dict(r)
        d["short_url"] = request.host_url + d["code"]
        return d

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/api/links")
    def create():
        data = request.get_json(silent=True) or {}
        url, err = validate_url(data.get("url"))
        if err:
            return jsonify(error=err), 400
        code = (data.get("code") or "").strip()
        if code:
            if not CODE_RE.match(code) or code.lower() in RESERVED:
                return jsonify(error="Código: 3 a 32 letras, números, - ou _ (palavras reservadas não valem)."), 400
        else:
            code = new_code()
        try:
            cur = db().execute("INSERT INTO links(code,url,created_at) VALUES(?,?,?)", (code, url, now()))
            db().commit()
        except sqlite3.IntegrityError:
            return jsonify(error="Esse código já está em uso."), 409
        r = db().execute("SELECT * FROM links WHERE id=?", (cur.lastrowid,)).fetchone()
        return jsonify(row(r)), 201

    @app.get("/api/links")
    def list_links():
        q = (request.args.get("q") or "").strip()
        sort = request.args.get("sort", "recent")
        order = {"recent": "l.id DESC", "visits": "visits DESC, l.id DESC"}.get(sort, "l.id DESC")
        like = f"%{q}%"
        rows = db().execute(
            "SELECT l.*, COUNT(v.id) AS visits FROM links l LEFT JOIN visits v ON v.link_id=l.id "
            "WHERE l.code LIKE ? OR l.url LIKE ? GROUP BY l.id ORDER BY " + order,  # order vem de whitelist
            (like, like)).fetchall()
        return jsonify([row(r) for r in rows])

    @app.get("/api/stats")
    def stats():
        c = db()
        total = c.execute("SELECT COUNT(*) FROM links").fetchone()[0]
        visits = c.execute("SELECT COUNT(*) FROM visits").fetchone()[0]
        top = c.execute("SELECT l.code, COUNT(v.id) AS visits FROM links l JOIN visits v ON v.link_id=l.id "
                        "GROUP BY l.id ORDER BY visits DESC LIMIT 5").fetchall()
        hist = c.execute("SELECT substr(at,1,10) AS day, COUNT(*) AS n FROM visits GROUP BY day "
                         "ORDER BY day DESC LIMIT 7").fetchall()
        last = c.execute("SELECT MAX(last_access) FROM links").fetchone()[0]
        return jsonify(total_links=total, total_visits=visits, last_access=last,
                       top=[dict(r) for r in top], history=[dict(r) for r in hist])

    @app.delete("/api/links/<int:link_id>")
    def delete(link_id):
        c = db()
        c.execute("PRAGMA foreign_keys=ON")
        cur = c.execute("DELETE FROM links WHERE id=?", (link_id,))
        c.commit()
        return ("", 204) if cur.rowcount else (jsonify(error="Link não encontrado."), 404)

    @app.get("/<code>")
    def go(code):
        r = db().execute("SELECT id,url FROM links WHERE code=?", (code,)).fetchone()
        if not r:
            abort(404)
        t = now()
        db().execute("INSERT INTO visits(link_id,at) VALUES(?,?)", (r["id"], t))  # nenhum IP/UA é salvo
        db().execute("UPDATE links SET last_access=? WHERE id=?", (t, r["id"]))
        db().commit()
        return redirect(r["url"], code=302)  # URL já foi validada (http/https) no cadastro

    @app.errorhandler(404)
    def nf(_):
        return (jsonify(error="Não encontrado."), 404) if request.path.startswith("/api") else ("Link não encontrado.", 404)

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=5000, debug=False)
