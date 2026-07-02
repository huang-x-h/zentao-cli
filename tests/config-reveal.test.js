#!/usr/bin/env node
// Regression test for: config list/get must reveal actual stored host & cookie.
//
// Bug: client.js's default export had setters but no getters for _host / _cookie,
// so `client.host` and `client.cookie` were always `undefined`.
// bin/zentao.js's `config list/get` commands then printed "undefined".
//
// Run: node tests/config-reveal.test.js
// (Uses Node's built-in assert + child_process. No test framework needed.)

import { spawnSync } from 'child_process';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CLI = path.resolve('bin/zentao.js');
const CONFIG_FILE = path.join(os.homedir(), '.zentao-cli', 'config.json');
const HOST = 'http://example.test';
const COOKIE = 'sid=abc; theme=classic';

function run(args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf-8' });
  if (r.status !== 0) {
    throw new Error(`CLI exited ${r.status}\nstderr: ${r.stderr}\nstdout: ${r.stdout}`);
  }
  return r.stdout;
}

// 1. Clean slate.
fs.rmSync(CONFIG_FILE, { force: true });

// 2. Set host & cookie.
run(['config', 'set', 'host', HOST]);
run(['config', 'set', 'cookie', COOKIE]);

// 3. config list must show the real host, NOT 'undefined'.
const listOut = run(['config', 'list']);
assert.match(listOut, /Host: http:\/\/example\.test/, `config list did not reveal host. Got:\n${listOut}`);
assert.doesNotMatch(listOut, /Host: undefined/, `config list still prints 'undefined'. Got:\n${listOut}`);
assert.match(listOut, /Cookie: \*\*\*/, `config list did not reveal cookie. Got:\n${listOut}`);
assert.doesNotMatch(listOut, /Cookie: not set/, `config list says cookie is not set. Got:\n${listOut}`);

// 4. config get host must return the real host.
const hostOut = run(['config', 'get', 'host']).trim();
assert.equal(hostOut, HOST, `config get host mismatch. Got: ${hostOut}`);

// 5. config get cookie must be masked, not empty.
const cookieOut = run(['config', 'get', 'cookie']).trim();
assert.equal(cookieOut, '***', `config get cookie should be masked. Got: ${cookieOut}`);

// 6. config get (no key) must include the real host and hasCookie=true.
const allOut = run(['config', 'get']).trim();
// Note: `console.log({...})` uses util.inspect (single quotes, spaces),
// not strict JSON. Match loosely.
assert.match(allOut, /host:\s*'http:\/\/example\.test'/, `config get did not include host. Got:\n${allOut}`);
assert.match(allOut, /hasCookie:\s*true/, `config get did not flag hasCookie. Got:\n${allOut}`);

// 7. Module-level getter sanity check.
const mod = await import('../src/client.js');
assert.equal(mod.default.host, HOST, 'module getter .host mismatch');
assert.equal(mod.default.cookie, COOKIE, 'module getter .cookie mismatch');

console.log('OK — config list/get reveals stored host & cookie.');