import fs from 'node:fs';

const [, , inputPath = 'video/data/mock-run-output.json', outputPath = 'video/data/mock-run.json'] = process.argv;
const raw = fs.readFileSync(inputPath, 'utf8');
const jobs = JSON.parse(raw);

if (!Array.isArray(jobs) || jobs.length !== 8) {
  throw new Error('expected 8 synthetic jobs from the bundled fixture');
}

// Presentation only: routing, priority, and alert decisions belong to the shared engine.
const rows = jobs.map((job) => ({
  job: job.job_id,
  machine: job.machine_type,
  route: job.route,
  etaRisk: job.eta_risk,
  priority: job.priority,
  action: job.action,
  reason: job.classification_reason,
}));

const alertJobs = rows.filter((row) => row.action === 'ALERT').map((row) => row.job).sort();
const expectedAlerts = ['J-1002', 'J-1005'];
if (JSON.stringify(alertJobs) !== JSON.stringify(expectedAlerts)) {
  throw new Error(`expected ALERT jobs ${expectedAlerts.join(', ')}, got ${alertJobs.join(', ') || 'none'}`);
}

const payload = {
  title: 'ForgeFlow offline rules demo (no AI or external delivery)',
  input: 'sample-data/jobs.csv',
  today: process.env.FORGEFLOW_TODAY,
  rows,
  raw,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`parsed ${rows.length} mock-run rows -> ${outputPath}`);
