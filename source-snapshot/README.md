# Sanitized source configuration snapshots

These are copies of the audited source machine's saved settings, not an installer and not proof of live activation. Original files were not modified.

| Snapshot | Source location |
|---|---|
| `herdr/config.toml` | `~/.config/herdr/config.toml` |
| `herdr/plugins/hhdebb.herdr-radar/config.toml` | `~/.config/herdr/plugins/config/hhdebb.herdr-radar/config.toml` |
| `pi/themes/blue-theme-border-trial.json` | `~/.pi/agent/themes/blue-theme-border-trial.json` |
| `gentle-shell/settings.template.json` | Safe appearance/package/extension subset of `~/.gentle-shell/agent/settings.json` |

## Before using these on Ubuntu

- `${HOME}` in the Herdr snapshot is a **placeholder** replacing the source user's absolute home path. TOML does not expand it automatically. Adapt it for the target host; preserve the Radar command's shell session expansion separately.
- The two custom rename popup commands refer to helpers not contained in this snapshot. Do not enable those bindings until their helpers are provided or the bindings removed.
- Gentle Shell settings retain references to custom Herdr integrations. Those source files and their dependencies must be installed/adapted separately. In particular, Omarchy notification helpers do not work unchanged on ordinary Ubuntu, and the original activity producer has an installation-specific import.
- These files alone do **not** include the locally modified Radar implementation. Use the consolidated customization patch and installation guide in the parent bundle when available. Reinstalling upstream Radar alone loses the custom behavior.
- Do not overwrite existing target settings blindly; back up and merge them. Authenticate separately on the Ubuntu machine.

Device ID, model/provider preferences, compaction overrides, credentials, session history, plugin registry managed paths and runtime state were not copied. `SHA256.json` records the hashes of the four copied configuration/theme files.
