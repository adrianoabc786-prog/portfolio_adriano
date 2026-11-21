/* Text2QR - gerador de QR Code em C (libqrencode + libpng). */
#include <errno.h>
#include <png.h>
#include <qrencode.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#define MAX_TEXT 2000          /* limite seguro para nível M */
#define QUIET 4                /* margem (módulos) exigida pela especificação */

typedef enum { FMT_PNG = 1, FMT_SVG = 2, FMT_BOTH = 3 } Format;

/* Retorna 0 se o texto é válido; imprime o motivo em caso de erro. */
static int validate_input(const char *t) {
    if (!t) return -1;
    size_t n = strlen(t), i = 0;
    while (i < n && (t[i] == ' ' || t[i] == '\t' || t[i] == '\n' || t[i] == '\r')) i++;
    if (i == n) { fprintf(stderr, "Erro: o texto está vazio.\n"); return -1; }
    if (n > MAX_TEXT) { fprintf(stderr, "Erro: texto maior que %d bytes.\n", MAX_TEXT); return -1; }
    return 0;
}

static void chomp(char *s) { s[strcspn(s, "\r\n")] = '\0'; }

/* Os bytes do texto (UTF-8, inclusive acentos) são codificados no modo 8 bits. */
static QRcode *build_qr(const char *text) {
    QRcode *qr = QRcode_encodeString(text, 0, QR_ECLEVEL_M, QR_MODE_8, 1);
    if (!qr) fprintf(stderr, "Erro ao gerar o QR Code: %s\n", strerror(errno));
    return qr;
}

static int write_svg(const QRcode *qr, const char *path, int scale) {
    FILE *f = fopen(path, "w");
    if (!f) { fprintf(stderr, "Erro ao criar '%s': %s\n", path, strerror(errno)); return -1; }
    int size = (qr->width + 2 * QUIET) * scale;
    fprintf(f, "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\" viewBox=\"0 0 %d %d\" shape-rendering=\"crispEdges\">\n"
               "<rect width=\"100%%\" height=\"100%%\" fill=\"#fff\"/>\n<path fill=\"#000\" d=\"",
            size, size, qr->width + 2 * QUIET, qr->width + 2 * QUIET);
    for (int y = 0; y < qr->width; y++)
        for (int x = 0; x < qr->width; x++)
            if (qr->data[y * qr->width + x] & 1) fprintf(f, "M%d %dh1v1h-1z", x + QUIET, y + QUIET);
    fprintf(f, "\"/></svg>\n");
    return fclose(f) == 0 ? 0 : -1;
}

static int write_png(const QRcode *qr, const char *path, int scale) {
    FILE *f = fopen(path, "wb");
    if (!f) { fprintf(stderr, "Erro ao criar '%s': %s\n", path, strerror(errno)); return -1; }
    png_structp png = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    png_infop info = png ? png_create_info_struct(png) : NULL;
    int size = (qr->width + 2 * QUIET) * scale, rc = -1;
    png_bytep row = malloc(size);
    if (!png || !info || !row) goto done;
    if (setjmp(png_jmpbuf(png))) goto done;
    png_init_io(png, f);
    png_set_IHDR(png, info, size, size, 8, PNG_COLOR_TYPE_GRAY, PNG_INTERLACE_NONE,
                 PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);
    png_write_info(png, info);
    for (int py = 0; py < size; py++) {
        int y = py / scale - QUIET;
        for (int px = 0; px < size; px++) {
            int x = px / scale - QUIET;
            int dark = x >= 0 && y >= 0 && x < qr->width && y < qr->width && (qr->data[y * qr->width + x] & 1);
            row[px] = dark ? 0 : 255;
        }
        png_write_row(png, row);
    }
    png_write_end(png, NULL);
    rc = 0;
done:
    if (rc) fprintf(stderr, "Erro ao escrever o PNG '%s'.\n", path);
    if (png) png_destroy_write_struct(&png, info ? &info : NULL);
    free(row);
    if (fclose(f) != 0) rc = -1;
    return rc;
}

/* Pré-visualização no terminal com meio-blocos Unicode. */
static void preview(const QRcode *qr) {
    for (int y = -QUIET; y < qr->width + QUIET; y += 2) {
        for (int x = -QUIET; x < qr->width + QUIET; x++) {
            int t = x >= 0 && y >= 0 && x < qr->width && y < qr->width && (qr->data[y * qr->width + x] & 1);
            int b = x >= 0 && y + 1 >= 0 && x < qr->width && y + 1 < qr->width && (qr->data[(y + 1) * qr->width + x] & 1);
            fputs(t ? (b ? "█" : "▀") : (b ? "▄" : " "), stdout);
        }
        putchar('\n');
    }
}

static int ensure_dir(const char *dir) {
    if (mkdir(dir, 0755) != 0 && errno != EEXIST) {
        fprintf(stderr, "Erro ao criar a pasta '%s': %s\n", dir, strerror(errno));
        return -1;
    }
    return 0;
}

static int generate(const char *text, Format fmt, const char *dir, const char *name, int scale) {
    if (validate_input(text)) return 1;
    if (ensure_dir(dir)) return 1;
    QRcode *qr = build_qr(text);
    if (!qr) return 1;
    char path[1024];
    int rc = 0;
    preview(qr);
    if (fmt & FMT_PNG) {
        snprintf(path, sizeof path, "%s/%s.png", dir, name);
        if (write_png(qr, path, scale)) rc = 1; else printf("PNG salvo em: %s\n", path);
    }
    if (fmt & FMT_SVG) {
        snprintf(path, sizeof path, "%s/%s.svg", dir, name);
        if (write_svg(qr, path, scale)) rc = 1; else printf("SVG salvo em: %s\n", path);
    }
    printf("Conteúdo original (copie se precisar):\n%s\n", text);
    QRcode_free(qr);
    return rc;
}

static void usage(const char *p) {
    printf("Uso: %s [-f png|svg|both] [-o pasta] [-n nome] [-s escala] [\"texto\"]\n"
           "Sem texto, entra no modo interativo.\n", p);
}

int main(int argc, char **argv) {
    Format fmt = FMT_BOTH; const char *dir = "output", *name = "qrcode", *text = NULL; int scale = 8;
    for (int i = 1; i < argc; i++) {
        if (!strcmp(argv[i], "-h")) { usage(argv[0]); return 0; }
        else if (!strcmp(argv[i], "-f") && i + 1 < argc) {
            const char *v = argv[++i];
            if (!strcmp(v, "png")) fmt = FMT_PNG; else if (!strcmp(v, "svg")) fmt = FMT_SVG;
            else if (!strcmp(v, "both")) fmt = FMT_BOTH; else { usage(argv[0]); return 2; }
        } else if (!strcmp(argv[i], "-o") && i + 1 < argc) dir = argv[++i];
        else if (!strcmp(argv[i], "-n") && i + 1 < argc) name = argv[++i];
        else if (!strcmp(argv[i], "-s") && i + 1 < argc) { scale = atoi(argv[++i]); if (scale < 1 || scale > 40) { fprintf(stderr, "Escala deve estar entre 1 e 40.\n"); return 2; } }
        else if (argv[i][0] == '-' && argv[i][1]) { usage(argv[0]); return 2; }
        else text = argv[i];
    }
    if (text) return generate(text, fmt, dir, name, scale);

    char buf[MAX_TEXT + 8], opt[16];
    printf("Text2QR - digite o texto ou URL: "); fflush(stdout);
    if (!fgets(buf, sizeof buf, stdin)) return 1;
    chomp(buf);
    printf("Formato [png/svg/both] (padrão both): "); fflush(stdout);
    if (fgets(opt, sizeof opt, stdin)) {
        chomp(opt);
        if (!strcmp(opt, "png")) fmt = FMT_PNG; else if (!strcmp(opt, "svg")) fmt = FMT_SVG;
    }
    return generate(buf, fmt, dir, name, scale);
}
