# Dev workflow: build, install, verify

What actually works for building, installing and verifying these Nimbalyst extensions from an agent session, learned between 2026-09-10 and 2026-09-28. Shared with the Mr. Projects repository (`docs/dev-workflow.md` there).

## Documentation first

Before designing around how Nimbalyst behaves, read the bundled SDK docs at `/Applications/Nimbalyst.app/Contents/Resources/extension-sdk-docs` (`api-reference.md`, `manifest-reference.md`, `contribution-points.md`, `permissions.md`). If they do not settle the question, settle it with a one-minute probe round (below) before building on an assumption. Do not read inside the rest of `/Applications/Nimbalyst.app` without the user's yes.

## Build and install

```bash
npm install          # once
npm run build        # vite → dist/index.js
npx tsc --noEmit     # type-check
npm test             # offline model tests
```

- Build with `npm run build` via Bash. In unattended sessions the Developer Kit's `extension_build` and `extension_uninstall` MCP tools can raise a permission prompt that times out; `extension_install` and `extension_get_status` go through, and uninstall usually works on retry.
- Install with the Developer Kit's `extension_install` tool, passing this repository's folder, or through Settings › Extensions › Install from folder.
- **Reinstall one extension per message.** On 2026-09-23, calling `extension_install` for Mr. Themes and Mr. Projects back-to-back in one message left every extension host component unmounted (no rail, no dock, no gutter button, no icon swap), although `activate()` ran, status said `loaded`, and no error was logged anywhere. Reinstalling one extension alone restored all of them. Verify with the probe after each install. It cost forty minutes the first time.
- Injected stylesheets must be replaced on reinstall, or a hot reinstall keeps the previous version's CSS. Mr. Themes' `ensureStyles()` overwrites its `<style>` when the text differs. Mr. Projects' `ensureStyles()` still returns early when its `<style id>` exists, a known one-line fix that has not been made.
- `get_renderer_debug_logs` is unavailable in the production build. `get_main_process_logs` (component `EXTENSION`) works.
- Bash and other tool calls sometimes fail with "PreToolUse hook did not respond before its timeout". Re-issuing the same call has always worked.

## Verifying UI

- **The probe** (`probe/`, see `probe/README.md`) is the only way to check injected DOM, fullscreen panels and window bridges. There is no DOM-eval tool for the app.
- `capture_editor_screenshot` renders custom editors (a `.nimtheme` file open in the Mr. Themes editor) and `.mockup.html` files, but not fullscreen panels (the Theme Gallery) or the rail.
- Plain HTML such as the toolkit's `preview/*.html` opens in the browser MCP with `browser_open_local_preview` and can be screenshotted there. The preview pages cache `data/current.js` per browser session, so open a new session after `mrthemes preview` rather than navigating the old one. A screenshot taken right after `navigate` can fail with `UnknownVizError`.
- Verify a click path by clicking it (from the probe), not by confirming that the underlying calls exist. Round 3 of Mr. Projects "verified" a gutter button whose route id was wrong.
- Calling a `window.electronAPI` function from the probe is a cheap one-minute check of a host capability.
- **Marketplace screenshots** come from `screenshots/harness/` (real extension code, replica window, demo data) through the browser MCP: a 1024×740 viewport is captured at 2048×1480, the size Nimbalyst's own listings use. The real window cannot be captured from an agent session: `screencapture` fails without macOS Screen Recording permission, and it would show the user's real projects.

## Where Nimbalyst installs extensions

`~/Library/Application Support/@nimbalyst/electron/extensions/` (observed on 0.79.1). Marketplace installs are copied folders (`manifest.json`, `dist/`, `screenshots/`). Dev installs (`extension_install`, Install from folder) are **symlinks to the source folder**, so moving or deleting the source folder breaks the installed extension: move first, then reinstall from the new place.

## Offline checks

Pure logic lives in modules without DOM access, so it can be bundled with esbuild and run under Node with a fake `window.localStorage`. That is what `npm test` does in each repository (`tests/*.test.ts`, bundled to `/tmp`). When fixing a bug in component code, first try to move the logic into a pure function (the pattern behind `collection.ts` in Mr. Themes and `mergeRailLayout` in Mr. Projects) so it can be tested this way.

## Git

Each extension is its own repository on `main`, with `node_modules/` and `dist/` ignored. Commit at the end of a session with a message that names the version and the feedback round or bug. Never force-push or rewrite published history.
