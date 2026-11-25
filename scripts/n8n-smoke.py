#!/usr/bin/env python3
"""Execute real n8n in disposable, network-isolated Docker containers."""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import uuid

ROOT = Path(__file__).resolve().parents[1]
IMAGE = 'docker.n8n.io/n8nio/n8n:2.49.6@sha256:a1a9955a4a9e5dd9fa65a62f59e0751351b45b9e5cd2c17e6e330a8d0026cad8'
PROVIDERS = {'@n8n/n8n-nodes-langchain.anthropic', 'n8n-nodes-base.googleSheets', 'n8n-nodes-base.telegram'}


def command(args, **options):
    return subprocess.run(args, check=True, text=True, capture_output=True, **options)


def decode_execution(output):
    decoder = json.JSONDecoder()
    for index, character in enumerate(output):
        if character != '{':
            continue
        try:
            value, _ = decoder.raw_decode(output[index:])
        except ValueError:
            continue
        if isinstance(value, dict) and isinstance(value.get('data'), dict) and 'resultData' in value['data']:
            return value
    raise AssertionError('n8n produced no execution JSON; inspect container log')


def output_items(execution, node):
    runs = execution['data']['resultData']['runData'].get(node, [])
    return [item['json'] for run in runs for output in run.get('data', {}).get('main', []) for item in output]


def expected_jobs(jobs, today):
    script = "import { processJobs } from './src/job-engine.mjs'; let input=''; for await (const chunk of process.stdin) input+=chunk; console.log(JSON.stringify(processJobs(JSON.parse(input), {today: process.argv[1]})));"
    result = command(['node', '--input-type=module', '-e', script, today], cwd=ROOT, input=json.dumps(jobs))
    return json.loads(result.stdout)


def assert_results(execution, expected):
    result = execution['data']['resultData']
    assert not result.get('error'), result.get('error')
    assert execution.get('finished') is True, 'n8n execution did not finish'
    board = output_items(execution, 'Local Board Rows')
    alerts = output_items(execution, 'Local Alert Messages')
    actual_by_id = {row['job_id']: row for row in board}
    assert len(board) == len(expected) == len(actual_by_id), 'job lost or duplicated in board output'
    fields = ('part_name', 'material', 'qty', 'due_date', 'requested_machine', 'customer', 'notes', 'machine_type', 'route', 'priority', 'eta_risk', 'classification_reason', 'alert_required', 'review_required', 'action')
    for row in expected:
        for field in fields:
            assert actual_by_id[row['job_id']][field] == row[field], f"{row['job_id']}: {field} mismatch"
    expected_alerts = sorted(row['job_id'] for row in expected if row['alert_required'])
    assert sorted(row['job_id'] for row in alerts) == expected_alerts, 'wrong local alert IDs'
    assert all(row['job_id'] in row['alert_text'] for row in alerts), 'alert identity lost'
    review_ids = sorted(row['job_id'] for row in expected if row['review_required'])
    assert sorted(row['job_id'] for row in output_items(execution, 'Planner Review')) == review_ids
    return {'board_rows': len(board), 'alert_ids': expected_alerts, 'review_ids': review_ids, 'routes': {route: sum(row['route'] == route for row in board) for route in sorted({row['route'] for row in board})}}


def run_case(name, workflow, jobs, today, destination, expected_error=None):
    case = Path(tempfile.mkdtemp(prefix=f'forgeflow-n8n-{name}-'))
    # n8n runs as uid 1000. Only this new disposable directory is writable.
    os.chmod(case, 0o777)
    workflow_path = case / 'workflow.json'
    workflow_path.write_text(json.dumps(workflow))
    os.chmod(workflow_path, 0o644)
    state = case / 'state'
    state.mkdir(mode=0o777)
    os.chmod(state, 0o777)
    container = f'forgeflow-proof-{uuid.uuid4().hex[:12]}'
    args = ['docker', 'run', '--rm', '--name', container, '--network', 'none',
            '-e', 'N8N_USER_FOLDER=/proof-state', '-e', 'N8N_DIAGNOSTICS_ENABLED=false',
            '-e', 'N8N_VERSION_NOTIFICATIONS_ENABLED=false', '-e', 'N8N_TEMPLATES_ENABLED=false',
            '-e', 'N8N_BLOCK_ENV_ACCESS_IN_NODE=true', '-e', 'N8N_RUNNERS_TASK_REQUEST_TIMEOUT=30',
            '-v', f'{workflow_path}:/workflow.json:ro', '-v', f'{state}:/proof-state',
            '--entrypoint', '/bin/sh', IMAGE, '-c',
            f'n8n import:workflow --input=/workflow.json && n8n execute --id={workflow["id"]} --rawOutput']
    try:
        result = subprocess.run(args, text=True, capture_output=True, timeout=180)
        log = result.stdout + result.stderr
        (destination / f'{name}.log').write_text(log)
        expected_codes = (0, 1) if expected_error else (0,)
        assert result.returncode in expected_codes, f'{name}: Docker exited {result.returncode}; inspect log'
        execution = decode_execution(log)
        (destination / f'{name}-execution.json').write_text(json.dumps(execution, indent=2) + '\n')
        if expected_error:
            error = execution['data']['resultData'].get('error')
            assert error and expected_error in json.dumps(error), f'expected rejected batch: {expected_error}'
            assert not output_items(execution, 'Local Board Rows'), 'invalid batch reached board output'
            assert not output_items(execution, 'Local Alert Messages'), 'invalid batch reached alert output'
            summary = {'rejected': True, 'error_contains': expected_error, 'board_rows': 0, 'alert_ids': []}
        else:
            summary = assert_results(execution, expected_jobs(jobs, today))
        print(f'n8n {name}: PASS {json.dumps(summary, sort_keys=True)}')
        return summary
    finally:
        # Exact unique name created above; never touches an existing user container.
        subprocess.run(['docker', 'rm', '-f', container], text=True, capture_output=True)
        shutil.rmtree(case)


def provider_boundary(workflow):
    boundary = json.loads(json.dumps(workflow))
    boundary['id'] = 'forgeflowProviderBoundary'
    for node in boundary['nodes']:
        if node['type'] == '@n8n/n8n-nodes-langchain.anthropic':
            node.update(type='n8n-nodes-base.code', typeVersion=2, disabled=False, parameters={'jsCode': "return $input.all().map((item,index) => ({ json: { content: [{ type: 'text', text: '{\"priority\":\"high\",\"route\":\"EDM\",\"due_date\":\"1990-01-01\"}' }] }, pairedItem: { item: index } }));"})
        elif node['type'] == 'n8n-nodes-base.googleSheets':
            node.update(type='n8n-nodes-base.code', typeVersion=2, disabled=False, parameters={'jsCode': "return $input.all().map((item,index) => ({ json: { job_id: 'WRONG', route: 'WRONG', priority: 'WRONG', sheet_result: 'offline boundary' }, pairedItem: { item: index } }));"})
    return boundary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, help='Preserve logs and execution evidence here, outside repository')
    args = parser.parse_args()
    destination = args.output_dir or Path(tempfile.mkdtemp(prefix='forgeflow-n8n-evidence-'))
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    try:
        command(['docker', 'image', 'inspect', IMAGE])
    except (subprocess.CalledProcessError, FileNotFoundError):
        raise SystemExit(f'Pinned image unavailable. Run: docker pull {IMAGE}')
    version = command(['docker', 'run', '--rm', '--network', 'none', IMAGE, '--version']).stdout.strip()
    assert version == '2.49.6', f'unexpected n8n runtime {version}'
    jobs = json.loads(command(['python3', 'scripts/read-csv.py', 'sample-data/jobs.csv'], cwd=ROOT).stdout)
    demo = json.loads((ROOT / 'workflows/forgeflow-demo.json').read_text())
    assert demo['active'] is False
    assert all(node['type'] not in PROVIDERS and not node.get('credentials') for node in demo['nodes'])
    results = {'image': IMAGE, 'version': version, 'network': 'none', 'cases': {}}
    results['cases']['demo'] = run_case('demo', demo, jobs, '2026-06-11', destination)
    unknown = dict(jobs[0], job_id='J-REVIEW', requested_machine='waterjet', due_date='2026-06-20', notes='Unknown machine; planner review required')
    review = json.loads(json.dumps(demo))
    review['id'] = 'forgeflowReviewProof'
    review_jobs = jobs + [unknown]
    next(node for node in review['nodes'] if node['name'] == 'Sample CSV Jobs')['parameters']['jsCode'] = f'return {json.dumps(review_jobs)}.map((json) => ({{json}}));'
    results['cases']['unknown-machine'] = run_case('unknown-machine', review, review_jobs, '2026-06-11', destination)
    negative_cases = [('invalid-qty', dict(jobs[0], job_id='J-BAD-QTY', qty=0), 'Invalid qty'),
                      ('invalid-date', dict(jobs[0], job_id='J-BAD-DATE', due_date='2026-02-30'), 'Invalid due_date'),
                      ('duplicate-id', dict(jobs[0]), 'Duplicate job_id')]
    for name, invalid, expected_error in negative_cases:
        rejected = json.loads(json.dumps(demo))
        rejected['id'] = 'forgeflow' + name.replace('-', '')
        batch = jobs + [invalid]
        next(node for node in rejected['nodes'] if node['name'] == 'Sample CSV Jobs')['parameters']['jsCode'] = f'return {json.dumps(batch)}.map((json) => ({{json}}));'
        results['cases'][name] = run_case(name, rejected, batch, '2026-06-11', destination, expected_error)
    integration = json.loads((ROOT / 'workflows/forgeflow-job-tracker.json').read_text())
    providers = [node for node in integration['nodes'] if node['type'] in PROVIDERS]
    assert len(providers) == 3 and all(node.get('disabled') is True for node in providers)
    assert integration['active'] is False
    results['cases']['providers-disabled'] = run_case('providers-disabled', integration, jobs, datetime.datetime.now(datetime.timezone.utc).date().isoformat(), destination)
    boundary = provider_boundary(integration)
    results['cases']['offline-provider-boundary'] = run_case('offline-provider-boundary', boundary, jobs, datetime.datetime.now(datetime.timezone.utc).date().isoformat(), destination)
    boundary_result = json.loads((destination / 'offline-provider-boundary-execution.json').read_text())
    assert all(row.get('provider_explanation') == '{\"priority\":\"high\",\"route\":\"EDM\",\"due_date\":\"1990-01-01\"}' for row in output_items(boundary_result, 'Local Board Rows')), 'provider explanation content was lost'
    (destination / 'summary.json').write_text(json.dumps(results, indent=2) + '\n')
    print(f'n8n smoke: PASS; evidence {destination}')


if __name__ == '__main__':
    try:
        main()
    except (AssertionError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        print(f'n8n smoke: FAIL: {error}', file=sys.stderr)
        sys.exit(1)
