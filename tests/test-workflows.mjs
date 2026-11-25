import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.env.FORGEFLOW_ROOT || path.resolve(import.meta.dirname, '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'workflows', name), 'utf8'));
const integration = read('forgeflow-job-tracker.json');
const providerTypes = new Set(['@n8n/n8n-nodes-langchain.anthropic', 'n8n-nodes-base.googleSheets', 'n8n-nodes-base.telegram']);
const find = (workflow, name) => workflow.nodes.find((node) => node.name === name);

function runCode(node, items, previous = {}) {
  const sandbox = {
    $input: { all: () => structuredClone(items) },
    $: (name) => ({ itemMatching: (index) => structuredClone(previous[name][index]) }),
  };
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(function () { ${node.parameters.jsCode} })()`, sandbox)));
}

test('integration providers require owner activation before any external call', () => {
  assert.equal(integration.active, false);
  const providers = integration.nodes.filter((node) => providerTypes.has(node.type));
  assert.equal(providers.length, 3);
  for (const node of providers) assert.equal(node.disabled, true, node.name);
});

test('Anthropic explanation uses real n8n 2.49.6 input schema', () => {
  const { parameters } = integration.nodes.find((node) => node.type.includes('anthropic'));
  assert.equal(parameters.modelId?.mode, 'id');
  assert.equal(typeof parameters.modelId?.value, 'string');
  assert.equal(parameters.messages?.values?.[0]?.role, 'user');
  assert.match(parameters.messages.values[0].content, /JSON\.stringify/);
  assert.equal(parameters.prompt, undefined);
});

test('Sheets spreadsheet selection uses resource locator', () => {
  const sheet = integration.nodes.find((node) => node.type.endsWith('googleSheets'));
  assert.equal(sheet.parameters.documentId.__rl, true);
  assert.equal(sheet.parameters.documentId.mode, 'id');
});

test('safe manual demo exists without provider credentials or webhook triggers', () => {
  assert.ok(fs.existsSync(path.join(root, 'workflows/forgeflow-demo.json')));
  const demo = read('forgeflow-demo.json');
  assert.equal(demo.active, false);
  assert.equal(demo.nodes.filter((node) => node.type === 'n8n-nodes-base.manualTrigger').length, 1);
  assert.ok(demo.nodes.every((node) => !providerTypes.has(node.type) && !node.credentials));
  assert.ok(demo.nodes.every((node) => node.type !== 'n8n-nodes-base.webhook'));
});

test('unknown machine reaches planner review without dropping board row', () => {
  const demo = read('forgeflow-demo.json');
  const sw = demo.nodes.find((node) => node.type.endsWith('.switch'));
  assert.equal(sw.parameters.options.fallbackOutput, 'extra');
  assert.equal(demo.connections[sw.name].main[4][0].node, 'Planner Review');
  assert.equal(demo.connections['Planner Review'].main[0][0].node, 'Local Board Rows');
});

test('embedded deterministic rules preserve job identity and pair each output', () => {
  const demo = read('forgeflow-demo.json');
  const raw = [
    { json: { job_id: 'A', part_name: 'Plate', material: 'Brass', qty: 1, due_date: '2026-06-12', requested_machine: 'milling', customer: 'Demo', notes: '' } },
    { json: { job_id: 'B', part_name: 'Unknown', material: 'Brass', qty: 1, due_date: '2026-06-12', requested_machine: 'waterjet', customer: 'Demo', notes: '' } },
  ];
  const result = runCode(find(demo, 'Deterministic Triage'), raw);
  assert.deepEqual(result.map((item) => item.json.job_id), ['A', 'B']);
  assert.deepEqual(result.map((item) => item.json.route), ['MILL', 'REVIEW']);
  assert.equal(result[1].json.review_required, true);
  assert.deepEqual(result.map((item) => item.pairedItem), [{ item: 0 }, { item: 1 }]);
});

test('provider content cannot replace authoritative route or discard original job', () => {
  const source = [{ json: { job_id: 'A', priority: 'medium', machine_type: 'milling', route: 'MILL', due_date: '2026-06-12', alert_required: false } }];
  const provider = [{ json: { content: [{ type: 'text', text: '{"priority":"high","route":"EDM"}' }] } }];
  const restored = runCode(find(integration, 'Restore Authoritative Job'), provider, { 'Deterministic Triage': source });
  assert.equal(restored[0].json.job_id, 'A');
  assert.equal(restored[0].json.priority, 'medium');
  assert.equal(restored[0].json.route, 'MILL');
  assert.equal(restored[0].json.alert_required, false);
  assert.equal(restored[0].json.provider_explanation, '{"priority":"high","route":"EDM"}');
});
