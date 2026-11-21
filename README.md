# Portfólio — Adriano Veloso

Portfólio em **HTML5, CSS3 e JavaScript puro**, sem frameworks, com três projetos próprios e demonstrações interativas.

## Contato
adrianoabc786@gmail.com · [LinkedIn](https://www.linkedin.com/in/adriano-veloso-46aa7324b) · [GitHub](https://github.com/adrianoabc786-prog)

## Projetos
| Projeto | Linguagem | Descrição | Testes |
|---|---|---|---|
| `projects/text2qr` | C | Gera QR Codes reais em PNG/SVG pelo terminal | `make test` |
| `projects/linkshort` | Python, Flask, SQLite | Encurtador de links com dashboard | `python -m unittest discover -s tests` |
| `projects/taskflow` | Java, Swing | Gerenciador de tarefas com Kanban | `./build.sh test` |

Cada pasta tem seu próprio README com instalação e execução. Os projetos ainda **não foram publicados no GitHub**: ao publicar, preencha o campo `repo` de cada item no array `PROJECTS` em `js/script.js` e os botões passam a funcionar.

## Estrutura
```
portfolio-adriano/
├── index.html
├── css/style.css
├── js/ script.js (site) · demos.js (demonstrações) · vendor/qrcode.js (qrcode-generator, MIT)
├── assets/ images/ · icons/ · documents/ curriculo.pdf, fotografia-adriano.jpg
├── projects/ text2qr/ · linkshort/ · taskflow/
└── README.md
```

## Como executar o site
Abra `index.html` no navegador, ou rode `python3 -m http.server 8000` na pasta e acesse `http://localhost:8000`.

## Demonstrações (seção "Demos")
- **Text2QR:** gera QR Codes reais no navegador (JavaScript), com download em SVG e PNG. Não executa o programa em C.
- **LinkShort:** simulação local, **não é um serviço online**. O link curto só funciona com o app Flask rodando.
- **TaskFlow:** Kanban em JavaScript com dados no `localStorage`, independente da persistência em arquivo do app Java.

## Tecnologias
HTML5, CSS3, JavaScript, C (libqrencode, libpng), Python (Flask, SQLite), Java (Swing).
