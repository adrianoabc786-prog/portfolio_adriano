# Text2QR — Text to QR Code Generator

Aplicação de terminal em **C** que transforma texto, frases ou URLs em QR Codes reais, salvos em **PNG** e/ou **SVG**.

## Funcionalidades
- Aceita qualquer texto, inclusive acentos e caracteres especiais (UTF-8, modo 8 bits).
- Gera PNG e SVG, à escolha, e informa o caminho dos arquivos criados.
- Valida entrada vazia ou só com espaços e limita o tamanho (2000 bytes).
- Pré-visualização do QR Code no terminal.
- Exibe o conteúdo original ao final, para copiar.
- Modo interativo (sem argumentos) e modo por linha de comando.

## Dependências
- `gcc`, `make`, `libqrencode` e `libpng` (com cabeçalhos de desenvolvimento).

Ubuntu/Debian: `sudo apt install build-essential libqrencode-dev libpng-dev`
macOS (Homebrew): `brew install qrencode libpng`

## Compilar e executar
```
make
./text2qr "https://exemplo.com"            # PNG + SVG na pasta output/
./text2qr -f svg -o saida -n meu "Olá!"    # só SVG em saida/meu.svg
./text2qr                                  # modo interativo
```
Opções: `-f png|svg|both`, `-o pasta`, `-n nome`, `-s escala` (1 a 40).

## Testes
`make test` executa `tests/run_tests.sh` (entrada vazia, acentos, validade de PNG/SVG, erros de pasta e de escala).
A decodificação do PNG gerado foi conferida com o leitor de QR do OpenCV.

## Organização
`src/main.c` reúne funções independentes: `validate_input`, `build_qr`, `write_png`, `write_svg`, `preview`, `ensure_dir`, `generate`.

## Demonstração web
O portfólio tem uma demonstração no navegador feita em JavaScript (biblioteca `qrcode-generator`). Ela **não executa** este programa em C; é uma versão paralela para testar o conceito.
