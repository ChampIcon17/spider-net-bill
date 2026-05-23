# Fix: `npm run …` fails with `SyntaxError` on `node.exe` / “Could not determine Node.js install directory”

## Cursor / VS Code: `npm` is not recognized but `node -v` works

If `where.exe node` points under **Cursor** or **VS Code** (for example `…\Cursor\…\node.exe`) and **`npm` is not found**, you do **not** have a full Node.js install on your PATH. **Install Node.js LTS** (Fix A). This repo also includes **`.vscode/settings.json`**, which prepends `C:\Program Files\Git\bin` and `C:\Program Files\nodejs` to the integrated terminal `Path` so a normal install is found first—**open a new terminal tab** after pulling that file.

## Repo helpers (portable Node + fixed PATH)

This project ships PowerShell helpers under `scripts/`:

| Script | Purpose |
|--------|---------|
| `scripts/session-path.ps1` | Dot-source in your terminal to prepend portable Node v22.14.0 (under `%LOCALAPPDATA%\spider-net-bill-tools\`) plus Git and System32. |
| `scripts/run-dev.ps1` | Session PATH, then `npm run dev` (Vite frontend). |
| `scripts/run-backend-dev.ps1` | Session PATH, then `npm run start:dev` in `backend/` (NestJS API). |

From the repo root:

```powershell
. .\scripts\session-path.ps1
npm ci
npm run dev
```

Or use npm wrappers (same scripts):

```powershell
npm run dev:win
npm run backend:dev:win
```

Install portable Node once (if you do not use Program Files Node):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-portable-node.ps1
```

## What went wrong

If you see output like:

- `C:\New Folder\desktop\node.exe:1` followed by binary garbage (`MZ…`)
- `SyntaxError: Invalid or unexpected token`
- `Could not determine Node.js install directory`

then **npm is not paired with a complete Node.js installation** on your `PATH`, or **`node.exe` is being executed as if it were a JavaScript file** (broken shim, wrong `NODE_OPTIONS`, or a partial copy of Node without npm’s layout).

A **full** Node install puts `node.exe`, `npm.cmd`, and `node_modules\npm\…` in the **same** folder (for example `C:\Program Files\nodejs\`). A lone `node.exe` copied somewhere else often breaks npm.

## Fix A (recommended): install Node.js LTS cleanly

1. Uninstall broken / duplicate Node from **Apps & features** (optional but reduces confusion).
2. Install **Node.js LTS** from [https://nodejs.org](https://nodejs.org) (or use **winget** below).
3. Close **all** terminals and VS Code/Cursor, then reopen.
4. Verify:

   ```powershell
   where.exe node
   where.exe npm
   node -v
   npm -v
   ```

   The first `node` should be under `Program Files\nodejs` (or your nvm symlink), not a random folder.

### winget (optional)

```powershell
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

## Fix B: remove a bad folder from your **user** PATH

If `where.exe node` lists something like `C:\New Folder\desktop\node.exe` **before** a good install, remove that directory from PATH.

From the repo root, run the helper script. It only edits the **User** `Path` variable and removes known-bad segments.

If `powershell` is not recognized, call it by full path (same for the Git PATH script):

```powershell
$ps = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
```

From the repo root:

```powershell
cd C:\Users\USER\OneDrive\Desktop\spider-net-bill-main
& "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -File .\scripts\repair-user-path-node.ps1
```

Non-interactive (skips the confirmation prompt):

```powershell
& "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -File .\scripts\repair-user-path-node.ps1 -Force
```

## Fix C: one-off in this terminal (no permanent change)

Prepend a known-good Node directory **for this session only**:

```powershell
$env:Path = "C:\Program Files\Git\bin;C:\Program Files\nodejs;" + $env:Path
```

Or dot-source `.\scripts\session-path.ps1` for this repo’s portable Node layout.

Then run `npm run lint` again.

## After PATH is sane

From the project root:

```powershell
cd C:\Users\USER\OneDrive\Desktop\spider-net-bill-main
. .\scripts\session-path.ps1
npm ci
npm run lint
```

For the backend:

```powershell
cd backend
npm ci
npm run lint
```

Frontend env: copy `.env.local.example` to `.env.local` and set `VITE_API_URL` (see root `README.md`). Backend: copy `backend/.env.example` to `backend/.env` (never commit `.env`).

## Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)

### Open the correct workspace folder

In Cursor/VS Code use **File → Open Folder** and choose `spider-net-bill-main` (the folder that contains `tailwind.config.ts` and `package.json`), not a parent like `Desktop`. Install the recommended extension from `.vscode/extensions.json` if prompted, then **Developer: Reload Window**.

### Typical log messages

| Message | Meaning |
|--------|---------|
| `No matching project for document` on `backend/src/...` | Normal — the NestJS backend does not use Tailwind. IntelliSense applies under `src/` for the Vite app. |
| `Can't resolve 'tailwindcss/package.json'` | Broken or incomplete `node_modules` (common on **OneDrive** when packages are cloud-only placeholders). |
| `Can't resolve 'tailwindcss-animate'` | Same — plugin folder exists but entry files are missing. |
| `Failed to load workspace modules` / `Using bundled version` | Extension fell back to its bundled Tailwind; your `tailwind.config.ts` plugins may not load until `node_modules` is fixed. |
| `Server was not started. Search for Tailwind CSS-related files was taking too long` | First start on a large tree; usually clears after reload once `node_modules` is healthy. |

### Fix corrupted `node_modules`

From the repo root (after `.\scripts\session-path.ps1` or a working `node`/`npm` on PATH):

```powershell
cd C:\Users\USER\OneDrive\Desktop\spider-net-bill-main
Test-Path .\node_modules\tailwindcss\package.json   # should be True
```

If it is **False**, reinstall dependencies:

```powershell
. .\scripts\session-path.ps1
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
npm ci
```

If `npm ci` fails with `ENOTEMPTY` on OneDrive, pause OneDrive sync for this folder, delete `node_modules` again, retry `npm ci`, or clone the repo outside OneDrive (for example `C:\dev\spider-net-bill-main`). Mark the project folder **Always keep on this device** so `node_modules` is not online-only.

Verify:

```powershell
Test-Path .\node_modules\tailwindcss\package.json
Test-Path .\node_modules\tailwindcss-animate\index.js
```

Then reload the editor window. This repo sets `tailwindCSS.experimental.configFile` in `.vscode/settings.json` so the extension always uses `tailwind.config.ts` at the workspace root.
