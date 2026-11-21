#!/bin/sh
# Testes básicos do Text2QR. Uso: make test
B=./text2qr; O=test_out; rm -rf $O; fail=0
ok(){ echo "OK   $1"; }; ko(){ echo "FALHA $1"; fail=1; }
$B "" -o $O >/dev/null 2>&1 && ko "entrada vazia deveria falhar" || ok "entrada vazia rejeitada"
$B "   " -o $O >/dev/null 2>&1 && ko "só espaços deveria falhar" || ok "texto só com espaços rejeitado"
$B "https://example.com/ação?q=é" -o $O -n url >/dev/null 2>&1 && ok "URL com acentos gerada" || ko "geração com acentos"
[ -f $O/url.svg ] && grep -q "<svg" $O/url.svg && ok "SVG válido criado" || ko "SVG ausente"
head -c 8 $O/url.png | od -An -c | grep -q "P   N   G" && ok "PNG com assinatura correta" || ko "PNG inválido"
$B "x" -f png -o $O -n so_png >/dev/null && [ ! -f $O/so_png.svg ] && ok "formato único respeitado" || ko "formato"
$B "x" -o /proc/naoexiste/x >/dev/null 2>&1 && ko "pasta inválida deveria falhar" || ok "erro de pasta tratado"
$B "x" -s 0 >/dev/null 2>&1 && ko "escala 0 deveria falhar" || ok "escala inválida rejeitada"
exit $fail
