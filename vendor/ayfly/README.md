# AY module replay for R&R

Adapted PT2 and STP replay routines from Ayfly (Copyright 2008 Deryabin Andrew),
https://github.com/l29ah/ayfly at c1ff6d559edc24ec43c7df0bf23a4531b976133d,
GPL-2.0-or-later. R&R distributes these modifications under GPL-3.0.
The tone tables originate in PT1Play.h and STCPlay.h. Changes: isolated static
single-track state, bounded pattern command loops, first-loop end notification,
PT2 relative-offset module validation, freestanding AY register bridge.
Ayumi synthesizer is reused from vendor/pt3 (MIT).

Build: clang and clang++ with wasm-ld, ./vendor/ayfly/build.sh.
No songs are distributed. The browser runs each decoder in a separate worker.
