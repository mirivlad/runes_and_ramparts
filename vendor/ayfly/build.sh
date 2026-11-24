#!/bin/sh
set -eu
cd "$(dirname "$0")"
: "${CC:=clang}"
: "${CXX:=clang++}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for file in ayumi runtime; do "$CC" --target=wasm32 -O2 -ffreestanding -fno-builtin -nostdlib -I../pt3/include -c ../pt3/$file.c -o "$tmp/$file.o"; done
"$CXX" --target=wasm32 -O2 -fsigned-char -fno-exceptions -fno-rtti -fno-builtin -ffreestanding -nostdlib -I../pt3/include -Wl,--no-entry -Wl,--export=rr_input -Wl,--export=rr_output -Wl,--export=rr_init -Wl,--export=rr_render -Wl,--export=rr_ended -Wl,--export-memory -Wl,--initial-memory=1048576 -Wl,--max-memory=1048576 -Wl,--strip-all bridge.cpp "$tmp/ayumi.o" "$tmp/runtime.o" -o ../../public/audio/ayfly.wasm
