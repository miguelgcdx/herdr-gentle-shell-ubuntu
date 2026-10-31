"""Offline bundle checks. No installation, network, native runtime or live state.

Python >=3.11; optional Radar run requires Git and Node with mock.property support.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile
import tomllib

ROOT = Path(__file__).resolve().parent
BASE = "dd42772da4b8b9e18660d653d08149c7da1d2964"
TESTS = ["test/workspace-logo.test.js", "test/delegated-activity.test.js",
         "test/delegated-roles.test.js"]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def structural():
    files = [p for p in ROOT.rglob("*") if p.is_file()]
    for file in files:
        assert not file.is_symlink(), file
        assert not any(part in {".git", "node_modules", "work-history", "__pycache__"}
                       for part in file.relative_to(ROOT).parts), file
        assert file.name not in {".env", "auth.json", "models.json"}, file
        text = file.read_text()
        assert "\x00" not in text, file
        assert not re.search(r"/(?:home|Users)/(?!(?:mock|example)(?:/|\b))[A-Za-z0-9_-]+/", text), file
        assert not re.search(r"(?:pnpm[/]global|[.]pnpm[/]|deviceId\s*\"?\s*:)", text), file
        if file.suffix == ".json":
            json.loads(text)
        if file.suffix == ".toml":
            tomllib.loads(text)
    config = tomllib.loads((ROOT / "herdr/config.toml").read_text())
    assert config["theme"]["name"] == "one-dark"
    assert config["theme"]["custom"]["accent"] == "#E0C15A"
    assert config["keys"]["prefix"] == "ctrl+a"
    commands = config["keys"]["command"]
    assert [(c["key"], c["command"]) for c in commands] == [
        ("prefix+e", "chmarax.herdr-nvim.toggle"),
        ("prefix+o", "chmarax.herdr-nvim.pick-file")]
    tabbar = config["ui"]["tab_bar_right"][0]["command"]
    assert 'tabbar${HERDR_SESSION:+-$HERDR_SESSION}.txt' in tabbar
    assert '${HERDR_RADAR_STATE:-${HERDR_PLUGIN_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/herdr/plugins/hhdebb.herdr-radar}}' in tabbar
    rows = json.dumps(config["ui"]["sidebar"], ensure_ascii=False)
    assert '"$title_delegating", "fg": "#5F87FE"' in rows
    assert '"contains": "", "fg": "#ffffff"' in rows
    assert set(config["ui"]["sidebar"]["agents"]["rows_by_agent"]) == {
        "claude", "gemini", "qwen", "kiro", "cline", "kilo", "kimi", "muse"}
    settings = json.loads((ROOT / "pi/settings.merge.json").read_text())
    assert set(settings) == {"theme", "themes", "extensions"}
    assert settings["extensions"] == ["~/.pi/agent/extensions/herdr-session-display.ts"]
    theme = json.loads((ROOT / "pi/themes/blue-theme-border-trial.json").read_text())
    assert set(theme) <= {"$schema", "name", "vars", "colors", "export", "appearance"}
    assert theme["name"] == settings["theme"] == "blue-theme-border-trial"
    required = set(('accent border borderAccent borderMuted success error warning muted dim text '
                    'thinkingText selectedBg userMessageBg userMessageText customMessageBg '
                    'customMessageText customMessageLabel toolPendingBg toolSuccessBg toolErrorBg '
                    'toolTitle toolOutput mdHeading mdLink mdLinkUrl mdCode mdCodeBlock '
                    'mdCodeBlockBorder mdQuote mdQuoteBorder mdHr mdListBullet toolDiffAdded '
                    'toolDiffRemoved toolDiffContext syntaxComment syntaxKeyword syntaxFunction '
                    'syntaxVariable syntaxString syntaxNumber syntaxType syntaxOperator '
                    'syntaxPunctuation thinkingOff thinkingMinimal thinkingLow thinkingMedium '
                    'thinkingHigh thinkingXhigh bashMode').split())
    optional = set('scrollbarTrack scrollbarThumb searchMatchBg searchMatchText thinkingMax'.split())
    assert required <= set(theme["colors"]) <= required | optional
    assert set(theme.get("export", {})) <= {"pageBg", "cardBg", "infoBg"}

    def color(value, seen=()):
        if isinstance(value, int) and not isinstance(value, bool):
            assert 0 <= value <= 255
            return
        assert isinstance(value, str)
        if value == "" or re.fullmatch(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?", value):
            return
        assert value in theme["vars"] and value not in seen, (value, seen)
        color(theme["vars"][value], (*seen, value))
    for section in ("vars", "colors", "export"):
        for value in theme.get(section, {}).values():
            color(value)
    expected = {}
    for line in (ROOT / "SHA256SUMS").read_text().splitlines():
        sha, name = line.split("  ", 1)
        assert not Path(name).is_absolute() and ".." not in Path(name).parts
        expected[name] = sha
        assert digest((ROOT / name).read_bytes()) == sha, name
    owned = {str(p.relative_to(ROOT)) for p in files
             if p.name != "SHA256SUMS" and "source-snapshot" not in p.relative_to(ROOT).parts}
    assert set(expected) == owned, (set(expected) ^ owned)
    print(f"PASS: JSON/TOML, theme tokens/variables, keys/sidebar, privacy/path scan; {len(expected)} payload hashes", flush=True)


def reconstruct(source, run_tests, run_startup_tests=False):
    with tempfile.TemporaryDirectory(prefix="rd-") as temp:
        scratch = Path(temp)
        checkout = scratch / "radar"
        checkout.mkdir()
        archive = subprocess.check_output([
            "git", "-C", str(source), "archive", BASE,
            "lib", "bin", "test", "package.json", "herdr-plugin.toml", "LICENSE", "README.md"])
        # Materialize text only; no Git metadata, symlinks, binaries or installed state.
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            for member in tar.getmembers():
                path = Path(member.name)
                assert not path.is_absolute() and ".." not in path.parts
                if member.isfile() and (path.suffix in {".js", ".json", ".toml", ".md"} or path.name == "LICENSE"):
                    data = tar.extractfile(member).read()
                    data.decode("utf-8")
                    target = checkout / path
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
        patch = str(ROOT / "patches/radar-customizations.patch")
        for args in (["--check", patch], [patch]):
            subprocess.run(["git", "apply", *args], cwd=checkout, check=True)
        manifest = json.loads((ROOT / "patches/reconstruction-hashes.json").read_text())
        for name, hashes in manifest.items():
            assert digest((checkout / name).read_bytes()) == hashes["reconstructed_sha256"], name
        print(f"PASS: patch applies to pinned base; {len(manifest)} exact reconstruction hashes", flush=True)
        if run_startup_tests:
            import shutil
            node = shutil.which("node")
            assert node, "Node is required"
            subprocess.run([node, "--test", str(ROOT / "tests/startup-preservation.test.cjs")],
                           env={"PATH": os.defpath, "HOME": temp, "TMPDIR": temp,
                                "RADAR_TEST_SOURCE": str(checkout)}, check=True)
            print("PASS: target preparation/startup preservation regressions", flush=True)
        if run_tests:
            config = scratch / "config"
            config.mkdir()
            (config / "config.toml").write_text('variant = "font"\nfollow_appearance = false\n')
            guard = scratch / "guard.cjs"
            guard.write_text('''const net = require('node:net');
const cp = require('node:child_process');
const deny = () => { throw new Error('unexpected real socket/process in offline test'); };
net.connect = deny; net.createConnection = deny;
for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) cp[key] = deny;
''')
            env = {"PATH": os.defpath, "HOME": temp, "TMPDIR": temp,
                   "XDG_CONFIG_HOME": temp, "XDG_STATE_HOME": temp, "XDG_CACHE_HOME": temp,
                   "HERDR_PLUGIN_CONFIG_DIR": str(config), "HERDR_PLUGIN_STATE_DIR": str(scratch / "state"),
                   "HERDR_RADAR_STATE": str(scratch / "state"), "HERDR_BIN_PATH": str(scratch / "nonexistent"),
                   "HERDR_SOCKET_PATH": str(scratch / "mock.sock")}
            import shutil
            node = shutil.which("node")
            assert node, "Node is required"
            subprocess.run([node, "--require", str(guard), "--test", *TESTS],
                           cwd=checkout, env=env, check=True)
            print("PASS: three bundled Radar test files, isolated state and mocked/guarded transport", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--radar-source", type=Path, help="local Git checkout containing the pinned base")
    parser.add_argument("--run-radar-tests", action="store_true", help="run the three copied tests once in isolated scratch")
    parser.add_argument("--run-startup-tests", action="store_true", help="run focused target preparation/startup regressions in isolated scratch")
    options = parser.parse_args()
    if (options.run_radar_tests or options.run_startup_tests) and not options.radar_source:
        parser.error("test flags require --radar-source")
    structural()
    if options.radar_source:
        reconstruct(options.radar_source.resolve(), options.run_radar_tests, options.run_startup_tests)
