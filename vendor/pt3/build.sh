#!/bin/sh
set -eu
cd "$(dirname "$0")"
: "${CC:=clang}"
"$CC" --target=wasm32 -O2 -fno-builtin -ffreestanding -nostdlib -Iinclude -Wno-return-type \
 -Wl,--no-entry -Wl,--export=rr_input -Wl,--export=rr_output -Wl,--export=rr_init -Wl,--export=rr_render -Wl,--export=rr_ended -Wl,--export-memory \
 -Wl,--initial-memory=1048576 -Wl,--max-memory=1048576 -Wl,--strip-all \
 pt3player.c ayumi.c runtime.c bridge.c -o ../../public/audio/pt3.wasm
