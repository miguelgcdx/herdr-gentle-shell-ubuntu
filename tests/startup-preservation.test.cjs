'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const bundle = path.resolve(__dirname, '..');
const radar = process.env.RADAR_TEST_SOURCE;
assert.ok(radar, 'run through verify.py --run-startup-tests');
const prepare = path.join(bundle, 'prepare-config.cjs');
const template = fs.readFileSync(path.join(bundle, 'herdr/config.toml'), 'utf8');
const help = 'Usage: node prepare-config.cjs --radar-source PATH --input FILE\n' +
  'Write prepared TOML to stdout only; never overwrite input or activate Herdr.\n';
const sidebar = text => text.match(/# >>> herdr-radar sidebar block[\s\S]*?# <<< herdr-radar sidebar block/)[0];
const start = '# >>> herdr-radar tab-bar block';
const end = '# <<< herdr-radar tab-bar block';
const stripTabbar = text => text.slice(0, text.indexOf(start)) + text.slice(text.indexOf(end) + end.length);
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const input = path.join(root, 'existing.toml');
  fs.writeFileSync(input, template + '\n# existing target sentinel\n');
  const config = path.join(root, 'plugin-config');
  fs.mkdirSync(config);
  fs.writeFileSync(path.join(config, 'config.toml'), 'variant = "font"\nfollow_appearance = false\n');
  const env = { PATH: process.env.PATH, HOME: root, TMPDIR: root,
    XDG_CONFIG_HOME: path.join(root, 'xdg-config'), XDG_CACHE_HOME: path.join(root, 'cache'),
    HERDR_PLUGIN_CONFIG_DIR: config, HERDR_BIN_PATH: path.join(root, 'nonexistent'),
    HERDR_SOCKET_PATH: path.join(root, 'mock.sock') };
  return { root, input, env };
}
function invoke(env, args) {
  return spawnSync(process.execPath, [prepare, ...args], { env, encoding: 'utf8' });
}
function inspectStartup(t, f, text) {
  const target = path.join(f.env.XDG_CONFIG_HOME, 'herdr/config.toml');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  const prior = { ...process.env };
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, f.env);
  for (const key of Object.keys(require.cache)) if (key.startsWith(radar + path.sep)) delete require.cache[key];
  const deny = () => assert.fail('native socket/process/reload/notification forbidden');
  const net = require('node:net');
  const cp = require('node:child_process');
  const mocks = [];
  function mock(obj, key, fn) { const saved = obj[key]; obj[key] = fn; mocks.push(() => { obj[key] = saved; }); }
  mock(net, 'connect', deny); mock(net, 'createConnection', deny);
  for (const key of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) mock(cp, key, deny);
  try {
    const managed = require(path.join(radar, 'lib/managed-config.js'));
    const herdr = require(path.join(radar, 'lib/herdr.js'));
    const logos = require(path.join(radar, 'lib/logos.js'));
    mock(herdr, 'configCheck', () => ({ parses: true, ok: true, output: '' }));
    mock(herdr, 'reloadConfig', deny); mock(herdr, 'notify', deny);
    const report = managed.inspect();
    assert.equal(report.state, 'installed');
    const tabBarStale = managed.tabBarStale(report.text);
    const installed = report.text.includes(managed.SIDEBAR_START);
    const stale = installed && managed.blockVariant(report.text) !== logos.resolveVariant();
    let applied = false;
    // Exact repair predicate from pinned daemon.start; no daemon/socket/timer starts.
    if (stale || (installed && tabBarStale) || (installed && managed.blockOverLimit(report.text))) {
      assert.equal(managed.apply().ok, true); applied = true;
    }
    return { tabBarStale, applied, text: fs.readFileSync(target, 'utf8'), block: managed.block(),
      cache: require(path.join(radar, 'lib/paths.js')).tabbarCache() };
  } finally {
    for (const undo of mocks.reverse()) undo();
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, prior);
  }
}
test('nonactive generic template reproduces stale-block startup repair', t => {
  const f = fixture(t);
  const startup = inspectStartup(t, f, template);
  assert.equal(startup.tabBarStale, true);
  assert.equal(startup.applied, true, 'exercise actual managed.apply with mocked native validation');
  assert.notEqual(sidebar(startup.text), sidebar(template), 'unprepared template must never be activated');
});
for (const session of ['', 'work.2']) {
  for (const rootCase of ['home', 'xdg', 'plugin', 'radar']) {
    test(`prepared startup preserves complete sidebar: ${session || 'default'} / ${rootCase}`, t => {
      const f = fixture(t);
      if (session) f.env.HERDR_SESSION = session;
      if (rootCase !== 'home') f.env.XDG_STATE_HOME = path.join(f.root, 'xdg-state');
      if (['plugin', 'radar'].includes(rootCase)) f.env.HERDR_PLUGIN_STATE_DIR = path.join(f.root, 'plugin-state');
      if (rootCase === 'radar') f.env.HERDR_RADAR_STATE = path.join(f.root, 'radar state');
      const before = fs.readFileSync(f.input, 'utf8');
      const result = invoke(f.env, ['--radar-source', radar, '--input', f.input]);
      assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
      assert.equal(fs.readFileSync(f.input, 'utf8'), before, 'input/target must never be written');
      assert.equal(stripTabbar(result.stdout), stripTabbar(before), 'only the tabbar block may change');
      const startup = inspectStartup(t, f, result.stdout);
      assert.equal(sidebar(startup.text), sidebar(before), 'startup repair must not erase any sidebar bytes');
      assert.equal(startup.tabBarStale, false); assert.equal(startup.applied, false);
      assert.equal(startup.text, result.stdout, 'startup leaves the complete prepared config unchanged');
      assert.ok(result.stdout.includes(startup.block), 'stdout contains the exact pinned generator block');
      const root = f.env.HERDR_RADAR_STATE ?? f.env.HERDR_PLUGIN_STATE_DIR ??
        path.join(f.env.XDG_STATE_HOME ?? path.join(f.root, '.local/state'), 'herdr/plugins/hhdebb.herdr-radar');
      assert.equal(startup.cache, path.join(root, `tabbar${session ? '-' + session : ''}.txt`));
      const again = path.join(f.root, 'prepared.toml'); fs.writeFileSync(again, result.stdout);
      const repeat = invoke(f.env, ['--radar-source', radar, '--input', again]);
      assert.deepEqual([repeat.status, repeat.stdout, repeat.stderr], [0, result.stdout, ''], 'idempotent preparation');
    });
  }
}
test('public help and invalid arguments are read-only with exact output', t => {
  const f = fixture(t); const before = fs.readFileSync(f.input, 'utf8');
  const shown = invoke(f.env, ['--help']);
  assert.deepEqual([shown.status, shown.stdout, shown.stderr], [0, help, '']);
  const rejected = invoke(f.env, ['--unknown']);
  assert.deepEqual([rejected.status, rejected.stdout, rejected.stderr], [2, '', 'Error: expected --radar-source PATH --input FILE\n' + help]);
  assert.equal(fs.readFileSync(f.input, 'utf8'), before);
});
for (const [label, changes] of [
  ['empty root', { HERDR_RADAR_STATE: '' }], ['relative root', { HERDR_PLUGIN_STATE_DIR: 'relative' }],
  ['shell root', { XDG_STATE_HOME: '/tmp/$(unsafe)' }], ['default session export', { HERDR_SESSION: 'default' }],
  ['invalid session', { HERDR_SESSION: 'bad/session' }], ['foreign plugin id', { HERDR_PLUGIN_ID: 'other.plugin' }],
]) {
  test(`reject ${label} without changing existing target`, t => {
    const f = fixture(t); Object.assign(f.env, changes);
    const before = fs.readFileSync(f.input, 'utf8');
    const result = invoke(f.env, ['--radar-source', radar, '--input', f.input]);
    assert.deepEqual([result.status, result.stdout, result.stderr], [1, '', 'Error: unsupported target environment\n']);
    assert.equal(fs.readFileSync(f.input, 'utf8'), before);
  });
}
test('reject missing/duplicate markers and modified generator without writing input', t => {
  const f = fixture(t);
  for (const text of [template.replace(start, '# removed'), template + '\n' + start,
    template.replace(start, '# SWAP').replace(end, start).replace('# SWAP', end), template + '\n' + end]) {
    fs.writeFileSync(f.input, text);
    const result = invoke(f.env, ['--radar-source', radar, '--input', f.input]);
    assert.deepEqual([result.status, result.stdout, result.stderr], [1, '', 'Error: expected exactly one ordered Radar tab-bar marker pair\n']);
    assert.equal(fs.readFileSync(f.input, 'utf8'), text);
  }
  fs.writeFileSync(f.input, template);
  const missing = invoke(f.env, ['--radar-source', radar, '--input', path.join(f.root, 'absent.toml')]);
  assert.deepEqual([missing.status, missing.stdout, missing.stderr], [1, '', 'Error: cannot read input config\n']);
  const wrong = path.join(f.root, 'wrong'); fs.mkdirSync(wrong);
  const hashes = JSON.parse(fs.readFileSync(path.join(bundle, 'patches/preparation-module-hashes.json')));
  for (const name of Object.keys(hashes)) {
    const target = path.join(wrong, name); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(radar, name), target);
  }
  fs.appendFileSync(path.join(wrong, 'lib/managed-config.js'), '\nthrow new Error("must reject before import");\n');
  const result = invoke(f.env, ['--radar-source', wrong, '--input', f.input]);
  assert.deepEqual([result.status, result.stdout, result.stderr], [1, '', 'Error: Radar preparation module hash mismatch\n']);
  assert.equal(fs.readFileSync(f.input, 'utf8'), template);
});
