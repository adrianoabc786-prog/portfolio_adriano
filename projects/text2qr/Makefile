CC      ?= gcc
CFLAGS  ?= -O2 -Wall -Wextra -std=c11
LDLIBS  = -lqrencode -lpng

text2qr: src/main.c
	$(CC) $(CFLAGS) -o $@ $< $(LDLIBS)

test: text2qr
	sh tests/run_tests.sh

clean:
	rm -rf text2qr output test_out
.PHONY: test clean
