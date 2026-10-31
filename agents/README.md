# Research agent and orchestrator source copies

These three files were moved unchanged from the `terminal/` project root into this transfer bundle. They are snapshots, not automatically activated resources.

| File | Original installed source | Target usage |
|---|---|---|
| `gentle-ai-research.md` | Both `~/.pi/agent/agents/gentle-ai-research.md` and `~/.gentle-shell/agent/agents/gentle-ai-research.md` matched exactly | Copy to the selected launcher's `agents/` directory after backing up any existing definition and checking provider/model support |
| `orchestrator-system.md` | Installed Gentle Pi package `assets/orchestrator.md` | Reference snapshot of the main orchestrator, not a standalone extension or replacement for installing Gentle Pi |
| `research-skill-system.md` | `~/.agents/skills/research/SKILL.md` | Install as `~/.agents/skills/research/SKILL.md` after reviewing/backing up an existing skill |

The research skill explicitly routes external research to `gentle-ai-research`; the main orchestrator does not name that agent directly. This verifies configured instructions, not a runtime invocation on Ubuntu.

## Ubuntu setup notes

- Choose the active agent home: ordinary Pi normally uses `~/.pi/agent`; this Gentle Shell launcher uses `~/.gentle-shell/agent`. Place the agent definition in that home's `agents/` directory. Do not assume a copy in this bundle is auto-discovered.
- The saved researcher selects `cliproxyapi/gemini-3.8-flash-high`. That provider/model must be configured and available on Ubuntu, or the definition must be deliberately changed to an available model. No credentials or provider configuration are included.
- The researcher's web tools come from host tooling/extensions; copying Markdown does not install those tools. Verify the required `web_enable`, search, fetch and source-check capabilities on the target.
- The orchestrator snapshot contains package asset placeholders and references additional lazy-loaded documents. It requires the matching Gentle Pi package/runtime; copying or renaming this file into an agent directory does not install the orchestrator. Do not overwrite installed package assets blindly.
- Preserve existing target settings and install the matching package separately, as described in the parent README. Ubuntu runtime activation has not been verified.
