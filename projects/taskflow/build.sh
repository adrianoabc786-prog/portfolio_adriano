#!/bin/sh
# Uso: ./build.sh        compila e executa a interface gráfica
#      ./build.sh test   compila e executa os testes
set -e
mkdir -p out && javac -encoding UTF-8 -d out src/taskflow/*.java
if [ "$1" = "test" ]; then javac -encoding UTF-8 -cp out -d out test/TaskServiceTest.java && java -Dstdout.encoding=UTF-8 -cp out TaskServiceTest
else java -cp out taskflow.KanbanApp; fi
