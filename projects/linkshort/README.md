# LinkShort — Smart URL Shortener

Encurtador de links em **Python + Flask + SQLite**, com dashboard responsivo.

## Funcionalidades
- Encurta URLs com código aleatório único (6 caracteres) ou código personalizado.
- Redireciona (HTTP 302) e conta os acessos.
- Histórico, pesquisa, ordenação (recentes / mais acessados), copiar link e exclusão com confirmação.
- Dashboard: total de links, total de acessos, último acesso, mais acessados, acessos por dia e data de criação.
- Persistência em SQLite.

## Segurança
- Só aceita URLs `http`/`https` com host válido (bloqueia `javascript:`, `ftp:` etc.).
- Todas as consultas SQL são parametrizadas.
- A interface escapa o conteúdo antes de exibi-lo (proteção contra XSS).
- Não salva IP, user-agent nem cookies: cada acesso guarda apenas a data e hora.

## Instalação e execução
```
cd projects/linkshort
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py        # http://127.0.0.1:5000
```
Banco em `linkshort.db` (mude com a variável `LINKSHORT_DB`).

## Testes
`python -m unittest discover -s tests` cobre validação de URL, criação, redirecionamento, códigos duplicados e inválidos, busca, estatísticas, exclusão, persistência e entrada maliciosa.

## API
`POST /api/links`, `GET /api/links?q=&sort=`, `DELETE /api/links/<id>`, `GET /api/stats`, `GET /<code>`.

## Observação
O backend **não está publicado online**. No portfólio, a demonstração não é um serviço real: ela valida a URL e mostra como o link ficaria, mas o redirecionamento de verdade só existe com este app rodando.
