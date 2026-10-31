# Source notices and redistribution boundary

The three Herdr plugin repositories identify their code as MIT. Copies of their
exact LICENSE texts are in `licenses/`; retain the notices with the Radar patch
and with reconstructed source distributions. The patch includes the installed
user's local modifications and tests as supplied for this transfer; it is not an
upstream release or a claim that those changes have been accepted upstream.

Gentle Pi identifies its package as MIT, with the exact inspected notice retained
in `licenses/gentle-pi.MIT.txt`. No Gentle Pi runtime dependency closure or binary
is bundled. The event-module names/import graph are documentation, not a
replacement implementation. Vendor logo/font assets are not copied; obtain the
pinned Radar source and preserve its `THIRD_PARTY_NOTICES.md` when building fonts.

The user-local theme, configuration and Pi integration source were explicitly
requested for copying by their owner. The inspected files do not carry an
individual license header; this transfer does not invent an MIT grant for them
or for other private/local helpers. The two rename helpers and personal custom-ui
package are not redistributed. Confirm ownership/license before general public
redistribution of user-local customization sources beyond this requested bundle.

Provenance locations (home-relative, not machine identifiers):

- Herdr: `~/.config/herdr/config.toml`.
- Radar settings: `~/.config/herdr/plugins/config/hhdebb.herdr-radar/config.toml`.
- Plugin checkouts: `~/.config/herdr/plugins/github/`, repository/revision pins in README.
- Pi theme: `~/.pi/agent/themes/blue-theme-border-trial.json`.
- Display extension: `~/.pi/agent/extensions/herdr-session-display.ts`.
- Nonactive activity source: `~/.pi/agent/extensions/herdr-subagent-activity/index.ts`;
  only its installation-specific import/comments were replaced by a placeholder.
- MIT Gentle module import audit: ordinary Pi's `npm/node_modules/gentle-pi/lib/`
  and the launcher's selected Gentle package. No package-store path is preserved.

No installation, activation, package fetching, native runtime modification,
credential transfer or publication is implied by inclusion here.
