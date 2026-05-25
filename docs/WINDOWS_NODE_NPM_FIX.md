# Windows: Node / npm / PATH

## Quick fix

```powershell
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

Close and reopen the terminal, then:

```powershell
where.exe node
where.exe npm
node -v
npm -v
```

First `node` should be under `Program Files\nodejs`, not Cursor/VS Code.

## Repo scripts

| Script | Use |
|--------|-----|
| `scripts/session-path.ps1` | Dot-source for portable Node + Git on PATH |
| `scripts/run-dev.ps1` | Frontend dev server |
| `scripts/run-backend-dev.ps1` | Backend dev server |
| `scripts/install-portable-node.ps1` | One-time portable Node install |
| `scripts/repair-user-path-node.ps1` | Remove bad PATH entries |

```powershell
. .\scripts\session-path.ps1
npm ci
npm run dev
```

Or: `npm run dev:win`, `npm run backend:dev:win`.

## Symptoms

- `npm` not found while `node -v` works → Cursor’s bundled Node only; install Node LTS (above).
- `SyntaxError` on `node.exe` / `Could not determine Node.js install directory` → broken PATH or incomplete Node copy.
- `where.exe node` shows `C:\New Folder\...` before a real install → run `scripts/repair-user-path-node.ps1` (add `-Force` to skip prompt).

## Session-only PATH

```powershell
$env:Path = "C:\Program Files\Git\bin;C:\Program Files\nodejs;" + $env:Path
```

Or: `. .\scripts\session-path.ps1`

## Tailwind IntelliSense

Open the repo root (folder with `tailwind.config.ts`), not a parent directory.

If logs show missing `tailwindcss` / `tailwindcss-animate`:

```powershell
. .\scripts\session-path.ps1
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
npm ci
```

On OneDrive: keep the folder **Always on this device** or clone outside OneDrive if `npm ci` fails with `ENOTEMPTY`.

Reload the editor after `node_modules` is restored.
