#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");
const { spawnSync } = require("node:child_process");

const home = os.homedir();
const settingsDir = process.env.CLINE_SETTINGS_DIR || path.join(home, ".cline", "data", "settings");
const providersFile = path.join(settingsDir, "providers.json");
const backupPrefix = "providers.json.backup.";
const isWindows = process.platform === "win32";
let promptInterface;

function ask(question) {
  if (!promptInterface) promptInterface = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => promptInterface.question(question, resolve));
}

function info(message = "") { console.log(message); }
function error(message) { console.error(`Error: ${message}`); }
function timestamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function fileStamp(file) { return fs.statSync(file).mtime.toLocaleString(); }
function accountLabel(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const user = data?.providers?.cline?.settings?.auth?.metadata?.userInfo || {};
    const details = [...new Set([user.email, user.name].filter((value) => typeof value === "string" && value.trim()))];
    return details.length ? details.join(" — ") : "Cline account (details unavailable)";
  } catch { return "Cline account (details unavailable)"; }
}
function backupFiles() {
  if (!fs.existsSync(settingsDir)) return [];
  return fs.readdirSync(settingsDir)
    .filter((name) => name.startsWith(backupPrefix) && name.length > backupPrefix.length)
    .sort()
    .map((name) => path.join(settingsDir, name));
}
function accountFiles() {
  const files = [];
  if (fs.existsSync(providersFile)) files.push(providersFile);
  return files.concat(backupFiles());
}
function listAccounts() {
  const files = accountFiles();
  info("\nAvailable Cline accounts:");
  info("------------------------------------------------------------");
  if (!files.length) info("No saved Cline accounts were found.");
  files.forEach((file) => {
    const active = file === providersFile;
    info(`${active ? "[*]" : "[ ]"} ${accountLabel(file)}`);
    info(`     ${active ? "active now" : "saved"} | ${fileStamp(file)}`);
  });
  info("------------------------------------------------------------");
}
function listBackupsForSwitch() {
  const files = backupFiles();
  if (!files.length) return files;
  info("\nSaved accounts:");
  files.forEach((file, index) => info(`${index + 1}) ${accountLabel(file)}`));
  return files;
}
async function yesNo(prompt) {
  const answer = await ask(`${prompt} [y/N]: `);
  return /^y(es)?$/i.test(answer.trim());
}
function executableExists(command) {
  if (!command) return false;
  if (path.isAbsolute(command)) return fs.existsSync(command);
  const pathValue = process.env.PATH || "";
  const extensions = isWindows ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";") : [""];
  return pathValue.split(isWindows ? ";" : ":").some((directory) => {
    if (!directory) return false;
    return extensions.some((extension) => fs.existsSync(path.join(directory, `${command}${extension}`)));
  });
}
function findCline() {
  if (process.env.CLINE_BIN) return executableExists(process.env.CLINE_BIN) ? process.env.CLINE_BIN : null;
  const candidates = isWindows ? ["cline.cmd", "cline.exe", "cline"] : ["cline"];
  return candidates.find(executableExists) || null;
}
function findNpm() {
  return executableExists(isWindows ? "npm.cmd" : "npm") ? (isWindows ? "npm.cmd" : "npm") : null;
}
function run(command, args = []) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: isWindows });
  if (result.error) { error(`Could not run ${command}: ${result.error.message}`); process.exit(1); }
  process.exit(result.status ?? 1);
}
async function ensureCline() {
  const existing = findCline();
  if (existing) return existing;
  info("Cline CLI is not installed or is not available in PATH.");
  if (!await yesNo("Install Cline CLI now?")) {
    info("Cline CLI was not installed. Install it later with: npm install -g cline");
    return null;
  }
  const npm = findNpm();
  if (!npm) { error("Node.js/npm was not found. Install Node.js, then run cline1 again."); return null; }
  run(npm, ["install", "-g", "cline"]);
}

async function newLogin() {
  fs.mkdirSync(settingsDir, { recursive: true });
  backupCurrent();
  fs.rmSync(providersFile, { force: true });
  const cline = await ensureCline();
  if (!cline) return;
  info("\nStarting Cline login. Select a different account when prompted.");
  run(cline, ["auth", "cline"]);
}
async function switchAccount() {
  const cline = await ensureCline();
  if (!cline) return;
  const files = listBackupsForSwitch();
  if (!files.length) { info("No saved accounts are available to switch to."); return; }
  const choiceText = await ask("\nEnter the saved account number: ");
  const choice = Number(choiceText);
  if (!Number.isInteger(choice) || choice < 1 || choice > files.length) {
    error("Invalid selection."); process.exitCode = 1; return;
  }
  const selected = files[choice - 1];
  backupCurrent();
  fs.mkdirSync(settingsDir, { recursive: true });
  const temporary = `${providersFile}.tmp.${process.pid}`;
  fs.copyFileSync(selected, temporary);
  if (!isWindows) fs.chmodSync(temporary, 0o600);
  fs.renameSync(temporary, providersFile);
  info(`Switched to: ${accountLabel(selected)}`);
  info("Starting Cline...");
  run(cline);
}
async function deleteAccount() {
  const cline = await ensureCline();
  if (!cline) return;
  const files = accountFiles();
  if (!files.length) { info("There are no locally saved Cline accounts to delete."); return; }
  info("\nSaved accounts (the active account is marked with *):");
  files.forEach((file, index) => info(`${index + 1}) ${file === providersFile ? "*" : " "} ${accountLabel(file)}`));
  const choiceText = await ask("\nEnter the account number to delete locally: ");
  const choice = Number(choiceText);
  if (!Number.isInteger(choice) || choice < 1 || choice > files.length) {
    error("Invalid selection."); process.exitCode = 1; return;
  }
  const selected = files[choice - 1];
  info(`This removes the local login for: ${accountLabel(selected)}`);
  info("It does not delete the account from Cline servers.");
  if (!await yesNo("Permanently delete this local account?")) {
    info("Cancelled. Nothing was deleted."); return;
  }
  fs.rmSync(selected, { force: true });
  info("Local account deleted.");
}
function printHelp() {
  info(`Usage: cline1 [option]

Cross-platform Cline account manager:
  1. New login
  2. Switch account
  3. Delete account

Options:
  -c, --check   Check whether Cline is installed
  -l, --list    List locally saved Cline accounts
  -h, --help    Show this help

Environment overrides:
  CLINE_SETTINGS_DIR  Use a different Cline settings directory
  CLINE_BIN           Use a specific Cline executable`);
}
async function main() {
  const argument = process.argv[2] || "";
  if (["-h", "--help"].includes(argument)) return printHelp();
  if (["-c", "--check"].includes(argument)) {
    const cline = await ensureCline();
    if (cline) info("Cline CLI is installed and available.");
    return;
  }
  fs.mkdirSync(settingsDir, { recursive: true });
  if (["-l", "--list"].includes(argument)) return listAccounts();
  const cline = await ensureCline();
  if (!cline) return;
  listAccounts();
  info("\nChoose an option:");
  info("  1) New login (save the current account first)");
  info("  2) Switch account");
  info("  3) Delete account");
  info("  4) Exit");
  const choiceText = await ask("Selection: ");
  switch (choiceText.trim()) {
    case "1": return newLogin();
    case "2": return switchAccount();
    case "3": return deleteAccount();
    case "4": case "": return info("Cancelled.");
    default: error("Invalid selection."); process.exitCode = 1;
  }
}
main().catch((errorValue) => {
  error(errorValue?.message || String(errorValue));
  process.exitCode = 1;
});
function backupCurrent() {
  if (!fs.existsSync(providersFile)) return;
  let destination;
  do { destination = path.join(settingsDir, `${backupPrefix}${timestamp()}-${Math.floor(Math.random() * 100000)}`); }
  while (fs.existsSync(destination));
  fs.copyFileSync(providersFile, destination);
  if (!isWindows) fs.chmodSync(destination, 0o600);
  info(`Current account saved as: ${destination}`);
}
