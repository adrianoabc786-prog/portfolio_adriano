# TaskFlow — Task Management System

Sistema de gerenciamento de tarefas em **Java 17+** com interface gráfica **Swing** (já incluída no JDK, sem dependências) no estilo Kanban.

## Funcionalidades
- Criar, editar e excluir tarefas (com confirmação para excluir).
- Prioridade (baixa, média, alta), categoria e status (pendente, em andamento, concluída).
- Quadro Kanban com três colunas; mover tarefas com os botões ◀ ▶.
- Busca por título, filtro por prioridade, contadores por coluna e percentual concluído.
- Persistência em `data/tasks.tsv`, com gravação atômica; linhas corrompidas são ignoradas.

## Arquitetura
| Classe | Responsabilidade |
|---|---|
| `Task`, `Status`, `Priority` | Modelo |
| `TaskRepository` | Leitura e gravação em arquivo |
| `TaskService` | Regras de negócio, filtros e indicadores (Collections e Streams) |
| `KanbanApp` | Interface Swing |

## Executar
Requer JDK 17 ou superior (`javac -version`).
```
cd projects/taskflow
./build.sh          # compila e abre o app
./build.sh test     # roda os testes
```
No Windows, use os mesmos comandos `javac`/`java` presentes em `build.sh`.

## Testes
`test/TaskServiceTest.java` cobre título vazio, criação, edição, exclusão, mudança de status, busca, filtro, indicadores, persistência, ids após reiniciar e arquivo corrompido. A interface gráfica não tem teste automatizado e precisa ser conferida manualmente.

## Demonstração web
O portfólio traz uma versão em JavaScript que guarda os dados no `localStorage` do navegador. Ela é independente deste programa Java e não usa o mesmo armazenamento.
