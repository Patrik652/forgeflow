import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const header='job_id,part_name,material,qty,due_date,requested_machine,customer,notes\n';
function runCsv(csv, args=[]) {
  const temp=mkdtempSync(join(tmpdir(),'forgeflow-csv-'));
  try {
    const input=join(temp,'jobs.csv'); writeFileSync(input,csv);
    return spawnSync('bash',['scripts/mock-run.sh',input,...args],{encoding:'utf8',env:{...process.env,FORGEFLOW_TODAY:'2026-06-11'}});
  } finally {rmSync(temp,{recursive:true,force:true});}
}

test('malformed quantities, headers, duplicate IDs and malformed CSV return failure', () => {
  for (const csv of [header+'J-1,Part,Steel,abc,2026-06-12,milling,Demo,note\n',
    'job_id,qty\nJ-1,1\n',header+'J-1,Part,Steel,1,2026-06-12,milling,Demo,note\n'.repeat(2),
    header+'J-1,"unterminated,Steel,1,2026-06-12,milling,Demo,note\n']) {
    const result=runCsv(csv);
    assert.notEqual(result.status,0,'Invalid data must never look successful');
  }
});

test('quoted commas, escaped quotes, multiline notes and CRLF survive the real CLI', () => {
  const result=runCsv(header.replace('\n','\r\n')+'J-1,"Bracket, large",Steel,12,2026-06-12,milling,"Demo ""Ltd""","first line\nsecond line"\r\n',['--json']);
  assert.equal(result.status,0,result.stderr);
  const [row]=JSON.parse(result.stdout);
  assert.equal(row.part_name,'Bracket, large');
  assert.equal(row.customer,'Demo "Ltd"');
  assert.equal(row.notes,'first line\nsecond line');
});

test('the reference fixture remains reproducible and custom clock is honored', () => {
  const result=spawnSync('bash',['scripts/mock-run.sh','--json'],{encoding:'utf8',env:{...process.env,FORGEFLOW_TODAY:'2026-06-11'}});
  assert.equal(result.status,0,result.stderr);
  const rows=JSON.parse(result.stdout);
  assert.equal(rows.length,8);
  assert.deepEqual(rows.filter(r=>r.alert_required).map(r=>r.job_id),['J-1002','J-1005']);
});
