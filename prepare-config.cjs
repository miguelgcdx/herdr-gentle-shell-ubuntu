'use strict';
// Read-only target preparation: reuse the pinned Radar generator, never apply().
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const help = 'Usage: node prepare-config.cjs --radar-source PATH --input FILE\n' +
  'Write prepared TOML to stdout only; never overwrite input or activate Herdr.\n';
function fail(message, code = 1) { process.stderr.write(`Error: ${message}\n`); process.exitCode = code; }
function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') { process.stdout.write(help); return; }
  if (args.length !== 4 || args[0] !== '--radar-source' || !args[1] || args[2] !== '--input' || !args[3]) {
    fail('expected --radar-source PATH --input FILE', 2); process.stderr.write(help); return;
  }
  const env = process.env;
  const safePath = value => typeof value === 'string' && path.posix.isAbsolute(value) &&
    !/['"`$\\\x00-\x1f\x7f]/.test(value);
  if (process.platform !== 'linux' || !safePath(os.homedir()) ||
      ['HERDR_RADAR_STATE', 'HERDR_PLUGIN_STATE_DIR', 'XDG_STATE_HOME'].some(key => key in env && !safePath(env[key])) ||
      (env.HERDR_PLUGIN_ID !== undefined && env.HERDR_PLUGIN_ID !== 'hhdebb.herdr-radar') ||
      (env.HERDR_SESSION && (env.HERDR_SESSION === 'default' || !/^[A-Za-z0-9._-]+$/.test(env.HERDR_SESSION)))) {
    fail('unsupported target environment'); return;
  }
  const root = path.resolve(args[1]);
  const hashes = JSON.parse(fs.readFileSync(path.join(__dirname, 'patches/preparation-module-hashes.json'), 'utf8'));
  try {
    for (const [name, hash] of Object.entries(hashes)) {
      const data = fs.readFileSync(path.join(root, name));
      if (createHash('sha256').update(data).digest('hex') !== hash) throw new Error('hash');
    }
  } catch { fail('Radar preparation module hash mismatch'); return; }
  let text;
  try { text = fs.readFileSync(args[3], 'utf8'); }
  catch { fail('cannot read input config'); return; }
  const start = '# >>> herdr-radar tab-bar block';
  const end = '# <<< herdr-radar tab-bar block';
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(start) >= text.indexOf(end)) {
    fail('expected exactly one ordered Radar tab-bar marker pair'); return;
  }
  // config.js initializes while managed-config loads. Do not consult live plugin settings.
  // Its values are irrelevant to block(), which reads only paths/stateRoot.
  env.HERDR_PLUGIN_CONFIG_DIR = path.join(__dirname, '__nonexistent_preparation_settings__');
  const deny = () => { throw new Error('native effects forbidden during preparation'); };
  const net = require('node:net');
  net.connect = deny; net.createConnection = deny;
  const cp = require('node:child_process');
  for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) cp[key] = deny;
  const managed = require(path.join(root, 'lib/managed-config.js'));
  const next = text.slice(0, text.indexOf(start)) + managed.block() + text.slice(text.indexOf(end) + end.length);
  if (managed.tabBarStale(next)) throw new Error('generator mismatch');
  process.stdout.write(next);
}
try { main(); } catch { fail('preparation failed'); }
