// Pure rules shared by the CLI and generated n8n Code nodes. No provider calls.
export const referenceToday = '2026-06-11';

function text(value, field, optional = false) {
  if (typeof value !== 'string' || value.length > 4000 || (!optional && !value.trim())) {
    throw new Error(`Invalid ${field}: expected ${optional ? 'a' : 'a nonempty'} string (max 4000 characters)`);
  }
  return value.trim();
}

function calendarDate(value, field) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid ${field}: expected a real YYYY-MM-DD date`);
  }
  return value;
}

function quantity(value) {
  if (!['number', 'string'].includes(typeof value) ||
      (typeof value === 'string' && !/^[1-9]\d*$/.test(value.trim()))) {
    throw new Error('Invalid qty: expected a positive safe integer');
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) throw new Error('Invalid qty: expected a positive safe integer');
  return result;
}

function normalize(input, options) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid job: expected an object');
  const job = {};
  for (const field of ['job_id', 'part_name', 'material', 'customer', 'requested_machine']) {
    job[field] = text(input[field], field);
  }
  job.qty = quantity(input.qty);
  job.due_date = calendarDate(input.due_date, 'due_date');
  job.notes = text(input.notes ?? '', 'notes', true);
  const received = options.receivedAt ?? input.received_at ?? new Date().toISOString();
  if (typeof received !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(received) ||
      !Number.isFinite(Date.parse(received))) throw new Error('Invalid received_at: expected an ISO timestamp with timezone');
  calendarDate(received.slice(0, 10), 'received_at');
  job.received_at = new Date(received).toISOString();
  return job;
}

export function processJob(input, options = {}) {
  const today = calendarDate(options.today, 'today');
  const job = normalize(input, options);
  const machine_type = job.requested_machine.toLowerCase();
  const routes = {milling: 'MILL', turning: 'LATHE', laser: 'LASER', edm: 'EDM'};
  const route = Object.hasOwn(routes, machine_type) ? routes[machine_type] : 'REVIEW';
  const notes = job.notes.toLowerCase();
  const eta_risk = job.due_date < today ? 'late' :
    job.due_date === today || /at-risk|at risk|capacity/.test(notes) ? 'at_risk' : 'on_track';
  const priority = /high priority|line stoppage|escalated|overdue/.test(notes) ? 'high' :
    /low priority/.test(notes) ? 'low' : 'medium';
  const alert_required = eta_risk === 'late' || priority === 'high';
  const review_required = route === 'REVIEW';
  return {...job, machine_type, route, eta_risk, priority, alert_required, review_required,
    action: alert_required ? 'ALERT' : review_required ? 'REVIEW' : 'BOARD',
    classification_reason: `${job.material} for ${job.customer}; due ${job.due_date}; ${job.notes}`};
}

export function processJobs(inputs, options = {}) {
  if (!Array.isArray(inputs) || !inputs.length || inputs.length > 10000) {
    throw new Error('Invalid jobs: expected an array of 1–10000 jobs');
  }
  const jobs = inputs.map(input => processJob(input, options));
  const ids = new Set();
  for (const job of jobs) {
    if (ids.has(job.job_id)) throw new Error('Duplicate job_id in batch');
    ids.add(job.job_id);
  }
  return jobs;
}
