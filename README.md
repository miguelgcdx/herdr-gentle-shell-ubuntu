# Herdr + Gentle Shell: Ubuntu transfer bundle

This is a **sanitized configuration/source bundle, not an installer or full machine backup**.
Nothing here has been activated on Ubuntu. No installed files or live sessions were changed.
`source-snapshot/` contains separate, nonactive copies of selected saved settings; use
`herdr/` and `pi/` below for the portable subset, not the snapshot as an installation overlay.
**`herdr/config.toml` is also nonactive until target preparation.** Its portable
shell-expression block is not literally equal to Radar's generated block; installing
it unchanged triggers startup repair and erases the customized sidebar.

## What the look actually is

- **Herdr 0.9.5:** built-in `one-dark`, not a separately registered theme. Custom
  panel/sidebar background `#070B12`, gold accent/headings `#E0C15A`, white Pi logo,
  purple working titles, green completed titles, muted idle titles and blue
  `#5F87FE` delegated titles. The complete original sidebar row arrays are retained.
- **Pi 1.4.0 / Gentle Shell:** user theme **`blue-theme-border-trial`**. Despite the
  name, it has a gold accent, near-black `#070A11` background, cyan border accent,
  white text and blue selection. `border` deliberately matches the background.
  Shared tokens affect multiple UI components; this is not per-widget recoloring.
- Radar owns grouping, logos, state glyphs and activity ordering. The custom Pi
  producer supplies delegated-child metadata; the Radar patch alone cannot produce it.
- The Pi session-display extension supplies the below-editor token/cache/TPS and
  starting-directory rows. TPS is an observed response average, not decoding speed.

These are saved-file findings, **not proof of effective loaded settings or screenshot
parity**. Terminal fonts, font fallback, opacity, blur, wallpaper, compositor, personal
Neovim configuration, Float layout and every other Pi extension are not reproduced.

## Files and provenance

| Payload | Origin / purpose |
|---|---|
| `herdr/config.toml` | Nonactive transfer template; prepare the tabbar on the target before activation; rename-popup bindings omitted |
| `herdr/radar.toml` | Saved Radar settings: font variant, no appearance following, no group gap, first logo per workspace |
| `pi/themes/blue-theme-border-trial.json` | Byte-for-byte saved user theme |
| `pi/extensions/herdr-session-display.ts` | Byte-for-byte user-local display extension; only Node and Pi host imports |
| `pi/settings.merge.json` | Minimal appearance/display fragment; **merge**, never replace your settings |
| `patches/radar-customizations.patch` | One consolidated tracked diff plus three custom tests against the exact Radar base below |
| `patches/reconstruction-hashes.json` | SHA256 of original live changed files and expected reconstructed files |
| `references/herdr-subagent-activity/index.ts.in` | Nonactive producer template; original behavior retained, machine-specific import replaced by deliberately unresolved relative placeholder |
| `licenses/` | Upstream MIT notices for all three Herdr plugins and Gentle Pi |
| `SHA256SUMS` | Bundle file hashes, excluding itself and parent-owned `source-snapshot/` |
| `verify.py` | Offline structural/reconstruction verifier; optional isolated Radar/startup tests |
| `prepare-config.cjs` | Read-only target materializer; stdout only, reuses pinned `managed.block()` |
| `patches/preparation-module-hashes.json` | Twelve dependency/package hashes checked before importing the pinned generator |
| `tests/startup-preservation.test.cjs` | Public preparation CLI and actual managed startup predicate regression |
| `agents/` | Parent-provided agent/prompt copies; not auto-activated or a standalone runtime |

No `.git`, old task records, archived native Herdr checkout, backups, logs, session
contents, credentials, model configuration or machine/device identity are bundled.
The Radar README's first diff hunk refers to local `AGENTS.md`/`LOCAL-CUSTOMIZATIONS.md`
and archived work records: those are deliberately **not** shipped or needed at runtime.
Use this guide as the portable customization record instead.

### Plugin source pins (all MIT)

| Plugin / repository | Version | Exact clean base revision |
|---|---|---|
| `ChmaraX/herdr-nvim` | 1.2.0 | `e2ec32e7bbbb1eefd64363414b5806f84eedd6bc` |
| `cloudmanic/herdr-plus` | 0.1.24 | `f38df3570bea8f7ca71dc1ba11bce3b123d14402` |
| `hhdebb/herdr-radar` | 1.4.4 + local changes | `dd42772da4b8b9e18660d653d08149c7da1d2964` |

The first two installed trees were clean. Radar's six tracked changed files and
three new tests are preserved in a **single git-applicable patch**, with explicit
`a/` and `b/` prefixes (not machine-configured `i/`/`w/` prefixes). Only one copied
test is adjusted: its personal-home scratch fallback becomes `os.tmpdir()` and
teardown removes that scratch directory. Both source and transfer hashes record
this exception; the six tracked files reconstruct exactly.

## Ubuntu prerequisites — obtain separately

Use a supported Ubuntu release and **Herdr 0.9.5** and **Pi 1.4.0** for the first
comparison. Install them from their official release instructions; this bundle
contains no binaries or package installer. You need Git, a POSIX shell, a truecolor
terminal and a primary Nerd Font for branch glyphs. Radar needs Node >=18; Gentle
Pi declares Node >=22.19.0. The copied tests use modern `node:test` mocks and were
checked with **Node 26.11.1**, not certified against every runtime minimum.

Herdr-nvim requires **Neovim >=0.10**. For Ubuntu-native builds provide Rust/Cargo,
a C/C++ toolchain, CMake/pkg-config as required by the pinned `fff-search` dependency,
and development libraries requested by Cargo. Its normal hook downloads a
versioned prebuilt binary first and only then falls back to Cargo; older Ubuntu
glibc may reject that prebuilt. For an exact local rebuild use `cargo build --release
--locked` in the pinned checkout and copy `target/release/herdr-nvim` into its
`bin/herdr-nvim` before linking. No build was attempted here.

Herdr Plus's pinned `go.mod` requires **Go 1.26.2**. Ensure that toolchain is available
before installing: without Go its hook downloads **latest**, which is NOT an exact
rebuild of the pinned revision. Build with `go build -o bin/herdr-plus .` in its
pinned checkout if using a local link. Do not transfer the old host's executables.

## Install on the target — manual, review first

These commands are **instructions for your Ubuntu machine**, not actions already run.
Back up each existing destination to a unique non-overwriting name first. Keep the
backup until you have visually accepted the result. Merge unrelated settings and
bindings; never blindly replace a customized destination.

1. Put this bundle somewhere persistent. In the following shell, set `BUNDLE` to
   its absolute directory (for example your checkout's `herdr+gentle-shell-ubuntu`).
   Verify `sha256sum -c SHA256SUMS` from that directory before copying anything.
2. In a fresh parent directory for plugin sources, clone and pin Radar **before**
   applying the patch. Do not run the patch in an unpinned/current installed tree:

   ```sh
   git clone https://github.com/hhdebb/herdr-radar.git
   cd herdr-radar
   git switch --detach dd42772da4b8b9e18660d653d08149c7da1d2964
   git apply --check "$BUNDLE/patches/radar-customizations.patch"
   git apply "$BUNDLE/patches/radar-customizations.patch"
   herdr plugin link --disabled "$PWD"
   ```

   `herdr plugin link [--disabled|--enabled] <PATH>` and `herdr plugin install
   [--ref <REF>] <OWNER/REPO[/SUBDIR]>` were observed in **0.9.5's read-only CLI help**.
   Link a persistent checkout, not a temporary directory. Linking/build hooks can
   write configuration/fonts; do this on the target only, after reviewing the hooks.
   The disabled flag controls registration, not a promise that build hooks are inert.
3. Install the clean plugins at their recorded revisions (these may run build hooks):

   ```sh
   herdr plugin install --ref e2ec32e7bbbb1eefd64363414b5806f84eedd6bc ChmaraX/herdr-nvim
   herdr plugin install --ref f38df3570bea8f7ca71dc1ba11bce3b123d14402 cloudmanic/herdr-plus
   ```

   Add this **single spec** to an existing lazy.nvim plugin-spec list if you want
   the annotations half too; do not copy a whole personal Neovim configuration:

   ```lua
   { "ChmaraX/herdr-nvim", commit = "e2ec32e7bbbb1eefd64363414b5806f84eedd6bc", opts = {} }
   ```
4. Merge `herdr/radar.toml` into the target plugin config directory, normally
   `${XDG_CONFIG_HOME:-$HOME/.config}/herdr/plugins/config/hhdebb.herdr-radar/config.toml`.
   Keep Radar disabled/not running until this step and preparation below finish.
   **After** plugin setup, merge `herdr/config.toml` and any existing target settings
   into a separate review file, not the live config. Preserve the complete sidebar
   arrays, including `$title_delegating`. Then prepare that merged file on Ubuntu:

   ```sh
   node "$BUNDLE/prepare-config.cjs" --help
   # Set RADAR to the persistent patched checkout and MERGED to your offline merged TOML.
   # Use exactly the environment the target daemon will inherit (see below).
   (set -C; node "$BUNDLE/prepare-config.cjs" --radar-source "$RADAR" --input "$MERGED" > "$MERGED.prepared")
   ```

   Use a fresh output name; shell `set -C` refuses to overwrite an existing file.
   The command itself never writes files. Check exit status **0** before using its
   output; on failure the shell may leave an empty review file, which is not a config.
   Inspect/parse the prepared TOML, then manually copy/merge the reviewed result
   into the target config with your non-overwriting backup retained. Do not
   regenerate its tabbar afterward. The actual config must be the same one pinned
   Radar finds via `XDG_CONFIG_HOME/herdr/config.toml` (or `~/.config/herdr/config.toml`);
   its path helper does not honor a separate `HERDR_CONFIG_PATH`. Align those paths
   before activation rather than silently preparing a file Radar will not inspect.
   Preparation changes only bytes between tabbar markers, leaving every sidebar
   byte and unrelated setting untouched. Do not run `configure`/`view-native` or
   appearance-changing actions afterward: those intentionally replace managed rows.
5. For the font variant, build/install **Herdr Agent Icons Max** using the pinned
   Radar checkout's font instructions (`tools/build_font.py`, `tools/codepoints.toml`,
   `tools/svg/`, and its
   third-party notices). Its setup/install-font action can edit Ghostty/Kitty
   codepoint maps; inspect first. No font binary or terminal config was copied here.
   Font generation needs Python/fontTools; see the pinned script for its complete
   dependencies (Python >=3.11 and fontTools for the inspected script).
   Map U+E1A0–U+E1BA and U+E1C0–U+E1C5 to that face in the target terminal; a Nerd Font
   alone does not supply Radar's private-use Pi logo. Without that font choose
   `variant = "text"`, accepting different appearance. Font installation is unverified.
6. Enable Radar in the target's plugin manager after setup/config review, then use
   the target client's menu **Reload config** when ready. No live activation was
   performed here. Inspect `herdr plugin list` on the target to confirm registrations.
7. Copy the theme into `~/.pi/agent/themes/` and optionally the display extension
   into `~/.pi/agent/extensions/`. Merge `pi/settings.merge.json` into the **selected
   launcher's** agent settings. Ordinary Pi defaults to `~/.pi/agent`; this Gentle
   Shell launcher used `~/.gentle-shell/agent/settings.json` and explicitly listed
   the shared resources in `~/.pi/agent`. Resource paths resolve against the settings
   directory; avoid loading a second copy through both package and extension lists.
   Pi supplies `@earendil-works/pi-coding-agent` and `@earendil-works/pi-tui`; do not
   install duplicate host SDK dependencies for this display extension.
8. Start a fresh target session for package/module changes. For later user-theme
   edits, Pi 1.4.0 hot-reloads `<agent-dir>/themes/<name>.json`; other theme sources
   require `/reload`. Explicitly choose `blue-theme-border-trial` via `/settings`
   if a launch flag or another extension overrides the saved selection.

### Tabbar paths and keys

Preparation uses the **actual pinned `managed.block()`**, not a second implementation
of its formatting or paths. It emits an absolute target root and preserves the exact
suffix **`tabbar${HERDR_SESSION:+-$HERDR_SESSION}.txt`**. Radar compares the complete
literal block at startup, not the path after shell expansion. Equivalent shell text
is therefore insufficient: a mismatch calls `managed.apply()` and replaces the
entire customized sidebar. Prepared output has `tabBarStale === false`.

Run preparation with the daemon's effective environment: `HERDR_RADAR_STATE` wins,
then `HERDR_PLUGIN_STATE_DIR`, then `XDG_STATE_HOME/herdr/plugins/hhdebb.herdr-radar`,
then `$HOME/.local/state/herdr/plugins/hhdebb.herdr-radar`. For a normal external
shell, Herdr may not inject `HERDR_PLUGIN_STATE_DIR`: supply its actual target value
if different from the default. Keep the resulting absolute root stable. If it
changes, disable Radar and reprepare before the next startup. For multiple named
sessions sharing one config, use one common state root as Herdr normally does.

`node prepare-config.cjs --radar-source PATH --input FILE` writes only prepared TOML
to stdout (exit 0, empty stderr). `--help` prints usage, exit 0. Invalid arguments
exit 2 with usage on stderr. Rejected environment, markers, dependency hashes or
unreadable input exit 1 with an error on stderr and empty stdout. It never calls
`inspect`, `apply`, native validation, reload, notifications or sockets; only the
regression simulates inspect/repair inside scratch with mocked validation.
Only the pinned hash-verified trusted checkout is supported. No upstream file changes.

This Linux-only command rejects empty/relative state overrides, shell/TOML-sensitive
root characters (quotes, dollar/backtick, backslash or controls), foreign plugin IDs,
invalid session names and an explicitly exported `HERDR_SESSION=default`. Native
Herdr leaves that variable unset for default; named sessions use validated names.
Missing/duplicate/reversed tabbar markers are rejected, not guessed. Unset unwanted
overrides rather than exporting empty strings. Do not expand the suffix during copying.
Keep Radar `variant = "font"` and `follow_appearance = false`: switching glyph variant
or overflowing a row can independently trigger the pinned daemon's repair predicate.
The regression covers all three startup conditions and compares the whole sidebar.

Prefix stays **Ctrl+A**. `prefix+e/o` invoke nvim sidebar/file picker; these custom
bindings take over any built-in actions on those keys. Other deliberate overrides:
`prefix+n` new workspace, `prefix+w` rename workspace, `prefix+Shift+W` picker,
`prefix+d` split below, Ctrl+J/L/K/I pane focus, Alt+1..9 agent focus,
Ctrl+1..9 tab focus, prefix+1..9 workspace focus, prefix+Alt+K/J previous/next agent.
`next_tab` and `remote_image_paste` are disabled. Ctrl+I may be indistinguishable
from Tab in some terminals. The source's Pi Wayland image-paste workaround is not
included; do not interpret that comment as Ubuntu clipboard support.

The two custom `prefix+a` / `prefix+Alt+W` rename-popup helpers were audited: they
require Bash, `gum`, native Herdr CLI and focused-pane/workspace environment values.
They have no explicit redistribution license in the inspected files; **sources and
bindings are omitted**, rather than silently supplying dangling commands. Built-in
`rename_workspace = "prefix+w"` remains; use native menus for agent renaming.

## Pi/Gentle inventory and deliberate gaps

| Saved resource | Needed for this transfer? |
|---|---|
| `pi-web-access` (unversioned) | Optional web tools, not the palette; installed version not pinned here |
| `pi-btw` (unversioned) | Optional side conversation UI; not the palette |
| `gentle-engram@0.2.0` | Optional memory integration; no databases or identity copied |
| `gentle-pi` / Gentle Shell | Needed for Gentle UI and delegated event producers; **not** an npm-latest substitute |
| `+builtin:codemode` (Shell), `+builtin:mcp` (ordinary Pi) | Saved builtin selections; not a requirement for the palette; no MCP config copied |
| ordinary Pi local `custom-ui` | Optional assigned-skills/live-card decorator, manifest selects `assigned-agents.ts`; **not included** |
| `herdr-session-display.ts` | Included, optional runtime display; not needed just to load the theme |
| `herdr-pi-notifications.ts` | **Omitted**, no active settings entry: depends on Omarchy/Hyprland desktop focus/notification helpers, not generic Ubuntu |
| `herdr-subagent-activity/index.ts` | Preserved as a **nonactive template**, not listed in settings; see below |

The saved ordinary Pi package order was `custom-ui`, web-access, btw, Engram,
Gentle Pi. Its local decorator must load before Gentle's widget and imports
`assigned-agents-card.ts`, `widget-decorator.ts`, `live-agents-card.ts` plus Pi host
SDKs; it is version-sensitive, not a standard Gentle theme. The entire personal
UI package is omitted (no explicit license, current host compatibility not proved).
Therefore compact live skill cards and exact Float geometry are **not promised**.

Gentle Shell upstream is https://github.com/Gentleman-Programming/gentle-shell.
The observed launcher build is **`4.5.1-main.9fe14aadc1f6` (MIT)**. The ordinary Pi
package metadata says `4.5.1`; that does not identify the launcher's exact dev build.
Obtain that exact compatible build from its maintainer if you require parity; no
network install, package lock, release availability or binary rebuild was verified.
The bundled settings fragment intentionally does not auto-install an arbitrary
`npm:gentle-pi` or pretend current npm latest reproduces this dev build.

### Delegated blue/role titles: preserved, NOT enabled

The template preserves child silence, parent-session ownership, source-event
validation, monotonic producer/sequence cursors, leases, shutdown clearing and custom
roles **A/R/W/V/RD** (explore/research/worker/verify/background review). Unknown roles
retain an ordinary title; roles come from public background tool results, not prompts.
Radar validates the full session-path SHA256 ownership and positive safe count;
working/blocked states win, with 30s lease/10s renewal and existing heartbeat pickup.

The old producer imported an absolute pnpm-store `gentle-pi/lib/notification-events.ts`.
The import was identical to ordinary Pi's installed file at snapshot time, but a
fresh Ubuntu install has no such store path. The recursive import audit found:

```text
notification-events.ts
  agents-protocol.ts -> terminal-theme.ts (Node only)
  notification-policy.ts -> agent-home.ts -> gentle-shell-bundled.ts (Node only)
  notification-scheduler.ts [type-only] -> notification-policy.ts
  Pi SDK imports [type-only]
```

Whole-module vendoring drags in task store, terminal utilities, notification settings
IO and launcher-resolution code merely to validate a bus event. This bundle does
**not** rewrite that protocol or vendor a partial, potentially divergent validator.
No portable adapter was behavior-tested, so the allowed safe fallback is explicit:
`index.ts.in` cannot auto-discover and `./compatible-notification-events.ts` does not
exist. Do **not** rename it to `index.ts` or enable the source-snapshot entry unchanged.

To finish on Ubuntu: obtain the exact compatible Gentle build; locate its actual
installed `lib/notification-events.ts` (not another launcher's npm tree); verify the
above closure and the `gentle-pi:notification:source` producer/schema including all
status vocabulary; resolve the placeholder against that package with a maintained
adapter or a licensed, self-contained dependency closure. Then test public lifecycle,
custom roles, child silence, session switching, ordering, leases and shutdown with
injected socket/time seams **before** listing the resulting extension in settings.
No current verification claims that missing producer works on Ubuntu. Radar grouping,
logo deduplication and ordinary title cleanup do work independently of this producer.
Desktop notifications similarly require a separately scoped Ubuntu integration;
this bundle neither enables the Omarchy helper nor rewrites notification behavior.

## Agent/prompt copies (nonactive)

`agents/` is parent-owned and contains the requested copies of `gentle-ai-research.md`,
`orchestrator-system.md` and `research-skill-system.md` plus its README. They do not
activate by being stored here. The orchestrator references lazy package assets and
is **not** a standalone/full Gentle runtime. The research agent currently selects
`cliproxyapi/gemini-3.8-flash-high`; that provider is not portable. Configure an
available target provider/model deliberately; no provider credentials are included.
These files are included in `SHA256SUMS`, not excluded from bundle verification.

## Verify, accept, undo

From the bundle directory, run `python3 verify.py` and `sha256sum -c SHA256SUMS`.
With a locally available Radar Git checkout containing the pinned base, run:

```sh
python3 verify.py --radar-source /path/to/herdr-radar --run-startup-tests
# Optional separate original custom Radar suite (already passed 42/42):
python3 verify.py --radar-source /path/to/herdr-radar --run-radar-tests
```

The verifier exports only allowlisted text sources from Git into a system temp
directory, checks/applies the patch there, verifies all nine reconstruction hashes,
and optionally runs the **focused preparation/startup tests**, including default/named
sessions, four state-root precedence levels, exact public outputs, read-only/rejection
behavior, idempotence and complete sidebar-byte preservation. The separate original
three custom files passed 42/42 previously; the correction does not repeat that broad
suite. Tests use isolated HOME/XDG/state, a nonexistent Herdr binary, mocked sockets
and blocked native process spawning (the harness alone launches the public preparation
CLI). Native config validation is mocked in simulated `managed.apply()`. The verifier never
links a plugin, launches native Herdr/Pi, accesses sessions or sends notifications.
Original tests beyond those three, native CLI/runtime schema acceptance, builds,
Ubuntu ABI/font support and visual acceptance remain unproved. Structural theme
checks follow the installed 1.4.0 documented contract, not an online schema fetch.

On the target, visually inspect glyphs, gold headings, white Pi logo, grouped/flat
views, title states, tabbar in default/named sessions, modal colors, selection,
thinking/bash borders, narrow widths and reduced-color fallback. Delegated roles
remain pending the producer completion above. Pi colors do not set terminal fonts,
opacity or compositor blur. Keep credentials on the target; authenticate separately.

Rollback: remove only bundle-owned resource declarations; restore backed-up Herdr
sections/theme selection and use the same target-client reload context. Disable the
linked Radar through the target plugin manager before removing its persistent source.
Do not blanket-restore old settings over newer unrelated changes. Updating Radar
can erase local changes: retain the pinned checkout/patch and revalidate rather than
blindly applying the patch to a different base. Delivery/commit/push remain separate.
