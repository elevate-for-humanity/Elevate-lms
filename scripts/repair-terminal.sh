#!/usr/bin/env bash
set -euo pipefail

backup() { [ -e "$1" ] && cp -p "$1" "$1.bak.$(date -u +%Y%m%d%H%M%S)"; }

echo "🔧 Backing up shell dotfiles..."
backup "$HOME/.bashrc"
backup "$HOME/.profile"
backup "$HOME/.bash_profile"
backup "$HOME/.bash_login"

cat > "$HOME/.bashrc" <<"EOF"
# Minimal safe Bash init
[[ $- != *i* ]] && return

export PS1="\u@\h:\w$ "
export HISTCONTROL=ignoredups:erasedups
export HISTSIZE=5000

[ -d "$HOME/.local/bin" ] && PATH="$HOME/.local/bin:$PATH"
[ -f "$HOME/.bash_aliases" ] && . "$HOME/.bash_aliases"

# Guarded toolchains
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
[ -s "$HOME/.asdf/asdf.sh" ] && . "$HOME/.asdf/asdf.sh"
EOF

cat > "$HOME/.profile" <<"EOF"
# ~/.profile for login shells
[ -d "$HOME/.local/bin" ] && PATH="$HOME/.local/bin:$PATH"
if [ -n "$BASH_VERSION" ] && [ -f "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi
EOF

touch "$HOME/.bash_aliases"

echo "✅ Testing shell..."
/bin/bash --noprofile --norc -c 'echo [OK] bare bash' >/dev/null
/bin/bash -lc 'echo [OK] login bash' >/dev/null
echo "Done. Open a new terminal."