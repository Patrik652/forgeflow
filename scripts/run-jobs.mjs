#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {processJobs} from '../src/job-engine.mjs';

try {
  const rows = processJobs(JSON.parse(readFileSync(0, 'utf8')), {today: process.env.FORGEFLOW_TODAY});
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const display = value => String(value).replace(/[\r\n|]/g, ' ');
    console.log('ForgeFlow offline rules demo (no AI or external delivery)');
    console.log(`Reference clock: ${process.env.FORGEFLOW_TODAY}\n`);
    console.log('JOB      | MACHINE    | ROUTE   | ETA_RISK    | PRIORITY | ACTION    | REASON');
    console.log('---------+------------+---------+-------------+----------+-----------+------------------------------------------');
    for (const row of rows) {
      console.log([row.job_id.padEnd(8), row.machine_type.padEnd(10), row.route.padEnd(7),
        row.eta_risk.padEnd(11), row.priority.padEnd(8), row.action.padEnd(9), row.classification_reason]
        .map(display).join(' | '));
    }
  }
} catch (error) {
  console.error(`mock-run: ${error.message}`);
  process.exitCode = 1;
}
