#!/bin/zsh
# usage: gen.sh <name> <aspect> <object description>
# Makes one transparent cutout with codex's built-in image tool. Only the text prompt is sent out.
cd "$(dirname "$0")"
name="$1"; aspect="$2"; obj="$3"
[ -f "$name.png" ] && { echo "skip $name"; exit 0; }
codex exec -m gpt-6-luna -c model_reasoning_effort='"low"' -s workspace-write --skip-git-repo-check -C "$PWD" "Use your built-in image generation tool to make exactly ONE image with transparent_background=true, aspect $aspect. Prompt: $(cat STYLE.txt) OBJECT: $obj After it is generated, copy the PNG file into the current directory as $name.png (keep the alpha channel, do not convert or resize). Then stop. Do not generate anything else and do not edit any other file." < /dev/null > "log-$name.txt" 2>&1
[ -f "$name.png" ] && echo "ok $name" || echo "FAIL $name"
