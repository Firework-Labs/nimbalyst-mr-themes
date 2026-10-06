# Marketplace listing draft: Mr. Themes

Draft for the Nimbalyst extension marketplace, 2026-10-02. Nimbalyst does not document a submission process for third-party extensions yet (checked: the bundled SDK docs, nimbalyst.com/docs/extensions/extension-system-and-marketplace, nimbalyst.com/docs/extensions/building-extensions, nimbalyst.com/extensions). The field names below follow the `marketplace` block in the manifest of Nimbalyst's own Git extension (`com.nimbalyst.git` 1.0.2), the only listing format observed. The same content is in `manifest.json` under `marketplace` (`changelog`, `categories`, `tags`, `icon`, `tagline`, `longDescription` with the heads-up, `screenshots`, `highlights`). A `marketplace` block with `productivity` as its category was already in the manifest; `productivity` is not one of the marketplace's categories, so it is now `developer-tools`.

## Store fields

| Field | Value |
|---|---|
| Name | Mr. Themes |
| Extension id | `com.fireworklabs.theme-editor` |
| Author | Firework Labs |
| License | MIT |
| Icon (Material Symbol) | `palette` |
| Category | `developer-tools` (the marketplace has no appearance or theming category; the five that exist are Featured, Diagrams & Visual Editing, Data & Spreadsheets, Developer Tools, AI-Powered Tools) |
| Tags | `theme`, `appearance`, `colors`, `customization`, `dark-mode`, `contrast`, `accessibility`, `per-project` |
| Repository | `https://github.com/Firework-Labs/nimbalyst-mr-themes` |

**Tagline**

> Every project gets its own theme. Best buds with Mr. Projects.

**Long description**

> Create, preview, share and apply Nimbalyst color themes, globally or per project. Mr. Themes ships with six theme families of six themes each (light and dark, in subtle, pigment and juicy variations): 36 presets whose contrast is checked by a generator, not by hand. With Mr. Projects installed, the Theme Gallery shows which theme every open project uses and lets you change it in one click; the Theme Collection holds every theme you own, and Theme Families groups them. Edit any `.nimtheme` file with all 75 Nimbalyst colors, live previews and a 17-check contrast audit that can fix failing colors for you. Want a family of your own? Download the Family Builder Kit for Agents into a project and ask your agent to design, audit and preview one, then import it.

**Highlights** (kept from the `marketplace` block that was already in `manifest.json`)

- Six theme families × light and dark × subtle, pigment, juicy: 36 presets
- Edit all 75 theme colors, not just the 20 the manifest exposes
- Contrast audit and one-click repair, three UI previews, and Try live
- Share as a .nimtheme file, JSON, or an installable theme extension
- Group themes into families; import a theme or a family; hand agents the Family Builder Kit

**Screenshots** (2048×1480, dark and light; files in `screenshots/`)

| # | Alt text |
|---|---|
| 0 | Theme Gallery with the Theme usage tray showing the global theme and each open project's theme, above the Theme Collection |
| 1 | Theme Families: six-theme families with their header swatches, one family expanded |
| 2 | Theme editor on a `.nimtheme` file: color groups, live preview and the contrast audit |

The screenshots are rendered from the extension's real code on a replica of the Nimbalyst window with demo projects (`screenshots/README.md`), so no real project names appear.

**Changelog**

> 0.5.0: Card "…" menus, grouping-only New family wizard with five header colors, separate Import theme and Import family, Download Family Builder Kit for Agents, Cancel in the theme editor; tray pickers fixed for long collections.
> 0.4.0: Theme Collection and user theme families; every built-in theme can be edited and deleted; Restore built-ins; family export; terminal colors contrast-checked in every variation.
> 0.3.0: Renamed from Nimbalyst Theme Editor; new gutter icon and help tooltip.

## "Before you install" callout (also in README.md)

> **Mr. Themes relies on Nimbalyst behavior that is not part of the extension SDK.** The SDK's theme contribution covers 20 of the 75 colors Nimbalyst uses, so Mr. Themes applies themes at runtime: it writes all 75 color variables onto the app window and watches Nimbalyst's `data-theme` attribute to notice when you pick a built-in theme. It also restyles its own gutter button (icon and hover tooltip), because the SDK option for a custom gutter button was not honored. A Nimbalyst update that renames these variables or that markup can make themes apply only partly, or bring back the default gutter icon, until Mr. Themes is updated. Uninstalling or disabling it returns Nimbalyst to its own theme. Last verified on Nimbalyst 0.77.5.

## Requirements and compatibility

- Nimbalyst with extensions enabled. Built against `@nimbalyst/extension-sdk` 0.5, manifest `apiVersion` 1.0.0.
- Last verified in the app (probe extension) on Nimbalyst 0.77.5. On 0.79.1 the extension loads without errors; its UI was not re-verified there.
- Works alone. With Mr. Projects (`com.fireworklabs.project-theme`) installed, the Theme Gallery can assign a theme to each project and shows project posters in the Theme usage tray.
- Monaco (code editor) syntax colors do not follow a live theme.

## Permissions and privacy

- **Filesystem** (`permissions.filesystem: true`): to open and save `.nimtheme` files, to write exported themes and families into the current project, and to write the Family Builder Kit into the current project when you ask for it.
- No network access. Your themes and families are stored in Nimbalyst's extension settings on your machine.

## Open before submitting

- Add the repository URL to `manifest.json` if Nimbalyst adds a field for it.
- Confirm the category with Nimbalyst, or ask for an Appearance category.
- Re-verify on the current Nimbalyst release and update "Last verified on".
- Ask whether Nimbalyst wants `dist/` committed or builds from source (installing from a GitHub URL is documented to need only `manifest.json`). Today `dist/` is git-ignored and each GitHub release carries a prebuilt zip.
