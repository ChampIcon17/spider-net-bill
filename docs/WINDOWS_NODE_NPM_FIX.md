# Fix: `npm run …` fails with `SyntaxError` on `node.exe` / “Could not determine Node.js install directory”

## Cursor / VS Code: `npm` is not recognized but `node -v` works

If `where.exe node` points under **Cursor** or **VS Code** (for example `…\Cursor\…\node.exe`) and **`npm` is not found**, you do **not** have a full Node.js install on your PATH. **Install Node.js LTS** (Fix A). This repo also includes **`.vscode/settings.json`**, which prepends `C:\Program Files\Git\bin` and `C:\Program Files\nodejs` to the integrated terminal `Path` so a normal install is found first—**open a new terminal tab** after pulling that file.

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

Then run `npm run lint` again.

## After PATH is sane

From the project root:

```powershell
cd C:\Users\USER\OneDrive\Desktop\spider-net-bill-main
npm ci
npm run lint
```

For the backend:

```powershell
cd backend
npm ci
npm run lint
```
