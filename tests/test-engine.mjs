import {test} from 'node:test';
import assert from 'node:assert/strict';
import {processJob, processJobs, referenceToday} from '../src/job-engine.mjs';

const base = {job_id: 'J-1', part_name: 'Bracket', material: 'Steel', qty: '12',
  due_date: '2026-06-12', requested_machine: 'milling', customer: 'Demo customer', notes: 'standard'};
const clock = {today: '2026-06-11', receivedAt: '2026-06-11T08:00:00Z'};

test('rules preserve job data and use an explicit clock, not a frozen live prompt', () => {
  const result = processJob(base, clock);
  assert.equal(result.qty, 12);
  assert.equal(result.job_id, base.job_id);
  assert.equal(result.customer, base.customer);
  assert.equal(result.route, 'MILL');
  assert.equal(result.eta_risk, 'on_track');
  assert.equal(result.action, 'BOARD');
  assert.equal(processJob(base, {...clock, today: '2026-06-13'}).action, 'ALERT');
  assert.equal(referenceToday, '2026-06-11');
});

test('due today and capacity notes are at risk; lateness wins', () => {
  assert.equal(processJob({...base, due_date: clock.today}, clock).eta_risk, 'at_risk');
  assert.equal(processJob({...base, notes: 'At-risk on CAPACITY'}, clock).eta_risk, 'at_risk');
  assert.equal(processJob({...base, due_date: '2026-06-10', notes: 'capacity'}, clock).eta_risk, 'late');
});

test('priority rules are case independent and high wins over low', () => {
  for (const notes of ['HIGH PRIORITY', 'line stoppage', 'customer escalated', 'OVERDUE', 'low priority; escalated']) {
    const result = processJob({...base, notes}, clock);
    assert.equal(result.priority, 'high');
    assert.equal(result.alert_required, true);
  }
  assert.equal(processJob({...base, notes: 'LOW PRIORITY'}, clock).priority, 'low');
});

test('unknown machines are retained for human review, including prototype-like values', () => {
  for (const requested_machine of ['grinding', '__proto__', 'constructor']) {
    const result = processJob({...base, requested_machine}, clock);
    assert.equal(result.route, 'REVIEW');
    assert.equal(result.review_required, true);
    assert.equal(result.action, 'REVIEW');
    assert.equal(result.job_id, base.job_id);
  }
  const late = processJob({...base, requested_machine: 'grinding', due_date: '2026-06-01'}, clock);
  assert.equal(late.action, 'ALERT');
  assert.equal(late.review_required, true);
});

test('invalid dates, required fields, quantities and wrong types fail explicitly', () => {
  for (const bad of [{due_date:'2026-02-30'}, {due_date:'2026-6-1'}, {job_id:''}, {customer:''},
    {part_name:null}, {qty:'abc'}, {qty:0}, {qty:-1}, {qty:1.5}, {qty:'1e3'}, {qty:Infinity},
    {qty:true}, {qty:9007199254740992}, {requested_machine:''}, {notes:{text:'late'}}]) {
    assert.throws(() => processJob({...base,...bad}, clock), JSON.stringify(bad));
  }
  assert.throws(() => processJob(base,{today:'2026-02-30'}));
  assert.throws(() => processJob(null,clock));
  assert.equal(processJob({...base,due_date:'2028-02-29'},clock).due_date,'2028-02-29');
});

test('a batch rejects duplicates and never mutates its inputs or trusts supplied decisions', () => {
  const input={...base, priority:'high', alert_required:true, route:'EDM', enable_ai:true};
  const before=structuredClone(input);
  const [result]=processJobs([input],clock);
  assert.deepEqual(input,before);
  assert.equal(result.priority,'medium');
  assert.equal(result.route,'MILL');
  assert.equal(result.alert_required,false);
  assert.equal(Object.hasOwn(result,'enable_ai'),false);
  assert.throws(() => processJobs([base,base],clock), /duplicate/i);
  assert.throws(() => processJobs({},clock));
  assert.throws(() => processJobs([],clock));
});
