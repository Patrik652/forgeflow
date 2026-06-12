import fs from 'node:fs';

const [, , inputPath = 'video/data/mock-run.txt', outputPath = 'video/data/mock-run.json'] = process.argv;
const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split(/\r?\n/);
const inputLine = lines.find((line) => line.startsWith('Input: '));

if (!inputLine) {
  throw new Error('mock-run output is missing the Input/Today line');
}

const inputMatch = inputLine.match(/^Input:\s*(.*?)\s*\|\s*Today:\s*(.*)$/);
if (!inputMatch) {
  throw new Error(`could not parse mock-run input line: ${inputLine}`);
}

const rows = lines
  .filter((line) => /^J-\d+\s+\|/.test(line))
  .map((line) => {
    const parts = line.split('|').map((part) => part.trim());
    return {
      job: parts[0],
      machine: parts[1],
      route: parts[2],
      etaRisk: parts[3],
      priority: parts[4],
      action: parts[5],
      reason: parts.slice(6).join('|').trim(),
    };
  });

if (rows.length === 0) {
  throw new Error('mock-run output contained no job rows');
}

const alertJobs = rows.filter((row) => row.action === 'ALERT').map((row) => row.job).sort();
const expectedAlerts = ['J-1002', 'J-1005'];
if (JSON.stringify(alertJobs) !== JSON.stringify(expectedAlerts)) {
  throw new Error(`expected ALERT jobs ${expectedAlerts.join(', ')}, got ${alertJobs.join(', ') || 'none'}`);
}

const payload = {
  title: lines[0],
  input: inputMatch[1],
  today: inputMatch[2],
  rows,
  raw,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`parsed ${rows.length} mock-run rows -> ${outputPath}`);
