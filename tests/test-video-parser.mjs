import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const referenceDate = '2026-06-11';

test('video parser preserves actual structured CLI decisions and the fixed reference clock', () => {
  const temp = mkdtempSync(join(tmpdir(), 'forgeflow-video-parser-'));
  try {
    const env = {...process.env, FORGEFLOW_TODAY: referenceDate};
    const run = spawnSync('bash', ['scripts/mock-run.sh', '--json'], {cwd: root, env, encoding: 'utf8'});
    assert.equal(run.status, 0, run.stderr);
    const jobs = JSON.parse(run.stdout);
    // JSON must preserve delimiters and line breaks; presentation text is not a data protocol.
    jobs[0].classification_reason = 'Steel | tolerance\nsecond line';
    const raw = `${JSON.stringify(jobs)}\n`;
    const input = join(temp, 'run.json');
    const output = join(temp, 'video.json');
    writeFileSync(input, raw);
    const parsed = spawnSync(process.execPath, ['video/scripts/parse-mock-run.mjs', input, output], {
      cwd: root, env, encoding: 'utf8',
    });
    assert.equal(parsed.status, 0, parsed.stderr);
    const payload = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(payload.input, 'sample-data/jobs.csv');
    assert.equal(payload.today, referenceDate);
    assert.equal(payload.raw, raw);
    assert.equal(payload.rows.length, 8);
    assert.deepEqual(payload.rows, jobs.map((job) => ({
      job: job.job_id,
      machine: job.machine_type,
      route: job.route,
      etaRisk: job.eta_risk,
      priority: job.priority,
      action: job.action,
      reason: job.classification_reason,
    })));
    assert.deepEqual(payload.rows.filter((row) => row.action === 'ALERT').map((row) => row.job), ['J-1002', 'J-1005']);
  } finally {
    rmSync(temp, {recursive: true, force: true});
  }
});

test('video parser rejects fixture count drift before a video can claim eight jobs', () => {
  const temp = mkdtempSync(join(tmpdir(), 'forgeflow-video-parser-'));
  try {
    const env = {...process.env, FORGEFLOW_TODAY: referenceDate};
    const run = spawnSync('bash', ['scripts/mock-run.sh', '--json'], {cwd: root, env, encoding: 'utf8'});
    assert.equal(run.status, 0, run.stderr);
    const jobs = JSON.parse(run.stdout).slice(1);
    const input = join(temp, 'run.json');
    writeFileSync(input, JSON.stringify(jobs));
    const parsed = spawnSync(process.execPath, ['video/scripts/parse-mock-run.mjs', input, join(temp, 'video.json')], {
      cwd: root, env, encoding: 'utf8',
    });
    assert.notEqual(parsed.status, 0, 'a seven-job fixture must not produce an eight-job proof video');
    assert.match(parsed.stderr, /expected 8 synthetic jobs/);
  } finally {
    rmSync(temp, {recursive: true, force: true});
  }
});
