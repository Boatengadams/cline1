# cline1

`cline1` is a cross-platform account manager for the [Cline CLI](https://www.npmjs.com/package/cline). It supports:

1. New login
2. Switch account
3. Delete a locally saved account

The account logic is written in Node.js and runs on Linux, macOS, and Windows. Node.js is required because the Cline CLI is distributed through npm.

> **Security notice:** Cline CLI may save access and refresh tokens in `~/.cline/data/settings/providers.json`. `cline1` never prints those tokens, but its backups contain the same sensitive authentication data. Never publish account files or commit them to Git.

## Install on Linux or macOS

Run this single command:

```bash
git clone https://github.com/Boatengadams/cline1.git cline1 && cd cline1 && chmod +x cline1 install.sh && ./install.sh
```

The installer checks for Node.js, copies the standalone `cline1` command into `~/.local/bin`, and adds that directory to your Bash/Zsh configuration automatically if needed. Open a new terminal afterward, then run:

```bash
cline1
```

You do not need to manually copy files, edit `PATH`, or run the application from the repository folder.

## Install on Windows

Open PowerShell and run this single command:

```powershell
git clone https://github.com/Boatengadams/cline1.git cline1; Set-ExecutionPolicy -Scope Process Bypass; cd cline1; .\install.ps1
```

The installer checks for Node.js, copies the command to `%LOCALAPPDATA%\cline1\bin`, and adds that directory to your user `PATH` automatically. Close and reopen PowerShell or Command Prompt, then run:

```powershell
cline1
```

## Startup order

Every run follows this order:

1. Check that Node.js is installed. If missing, ask before installing it.
2. Check that Cline CLI is installed. If missing, ask before installing it with npm.
3. Open the `cline1` account manager.

Linux/macOS can install Node.js with Homebrew or `apt`. Windows uses `winget` when available. If automatic installation is declined or unavailable, install Node.js from <https://nodejs.org/> and run `cline1` again.

## Usage

Run this from any directory:

```bash
cline1
```

The menu is:

```text
Choose an option:
  1) New login (save the current account first)
  2) Switch account
  3) Delete account
  4) Exit
```

### New login

The current account is backed up, the active local login is removed, and Cline starts its login flow:

```bash
cline auth cline
```

### Switch account

Saved accounts are displayed with numbers. Selecting one backs up the active account, restores the selected account, and starts Cline.

### Delete account

Select an account and confirm the deletion. This deletes only the local saved login. It does not delete the account from Cline's servers. Deleting the active account means the next Cline start will ask you to log in.

## Commands

```text
cline1             Open the account manager
cline1 --check     Check whether Cline is installed
cline1 --list      List locally saved accounts
cline1 --help      Show help
```

## Account storage

Cline normally stores the active account at:

```text
~/.cline/data/settings/providers.json
```

On Windows, `~` corresponds to your user home directory, so the path is typically:

```text
C:\Users\<your-user>\.cline\data\settings\providers.json
```

Backups use names such as:

```text
providers.json.backup.YYYYMMDD-HHMMSS-12345
```

On Linux and macOS, backups are created with user-only permissions (`600`). Windows uses the permissions provided by the user's home directory.

## Manual installation

### Linux/macOS

```bash
mkdir -p ~/.local/bin
cp cline1 cline1-app.js ~/.local/bin/
chmod 755 ~/.local/bin/cline1 ~/.local/bin/cline1-app.js
```

### Windows PowerShell

```powershell
$bin = Join-Path $env:LOCALAPPDATA "cline1\bin"
New-Item -ItemType Directory -Force $bin | Out-Null
Copy-Item .\cline1-app.js, .\cline1.cmd $bin
```

Add `$bin` to your user `PATH` if needed.

## Troubleshooting

### `cline1` is not recognized

Open a new terminal. Confirm the installation directory is in `PATH`, then run `cline1 --help`.

### Cline is not recognized

Install Node.js, then run:

```bash
npm install -g cline
```

### A restored account asks for login again

The saved session may have expired or been revoked. Run:

```bash
cline auth cline
```

## Security before publishing

The `.gitignore` excludes common Cline account files and temporary files. Review staged content before publishing:

```bash
git status --short
git diff --cached
```

Never publish `providers.json` or `providers.json.backup.*` files.

