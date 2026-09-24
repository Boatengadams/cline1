#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${CLINE1_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p -- "$INSTALL_DIR"
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js is required but was not found.'
  printf '%s' 'Install Node.js now? [y/N]: '
  read -r reply || reply=""
  if [[ "$reply" =~ ^[Yy]([Ee][Ss])?$ ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install node
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update && sudo apt-get install -y nodejs npm
    else
      printf '%s\n' 'Install Node.js from https://nodejs.org/ and run this installer again.' >&2
      exit 1
    fi
  else
    printf '%s\n' 'Node.js is required. Install it from https://nodejs.org/ and run this installer again.' >&2
    exit 1
  fi
fi
for file in cline1 cline1-app.js; do
  temporary="$INSTALL_DIR/$file.tmp.$$"
  cp -- "$SCRIPT_DIR/$file" "$temporary"
  chmod 755 -- "$temporary"
  mv -f -- "$temporary" "$INSTALL_DIR/$file"
done
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    config_file="$HOME/.bashrc"
    [[ "${SHELL:-}" == */zsh ]] && config_file="$HOME/.zshrc"
    path_line='export PATH="$HOME/.local/bin:$PATH"'
    touch "$config_file"
    if ! grep -Fqx "$path_line" "$config_file" 2>/dev/null; then
      printf '\n# Added by cline1 installer\n%s\n' "$path_line" >> "$config_file"
    fi
    printf 'Added %s to PATH in %s\n' "$INSTALL_DIR" "$config_file"
    printf 'Open a new terminal, then run: cline1\n'
    ;;
esac
printf '\nInstallation complete. Start Cline1 with:\n  cline1\n'
printf 'The command checks for Cline CLI and offers to install it when missing.\n'

