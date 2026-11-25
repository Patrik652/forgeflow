#!/usr/bin/env python3
"""Read bounded UTF-8 CSV into JSON. Domain validation lives in job-engine.mjs."""
import csv
import json
import sys
from pathlib import Path

FIELDS = {'job_id', 'part_name', 'material', 'qty', 'due_date', 'requested_machine', 'customer', 'notes'}


def read_jobs(filename):
    path = Path(filename)
    if path.stat().st_size > 10_000_000:
        raise ValueError('CSV exceeds 10 MB limit')
    csv.field_size_limit(4000)
    with path.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.reader(handle, strict=True)
        header = next(reader, [])
        if len(header) != len(FIELDS) or set(header) != FIELDS:
            raise ValueError('CSV must contain each of the eight documented columns exactly once')
        rows = []
        for values in reader:
            if len(values) != len(header):
                raise ValueError(f'CSV row {reader.line_num} has the wrong number of columns')
            rows.append(dict(zip(header, values)))
            if len(rows) > 10000:
                raise ValueError('CSV exceeds 10000 jobs')
        if not rows:
            raise ValueError('CSV contains no jobs')
        return rows


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('Usage: python3 scripts/read-csv.py PATH')
        print(json.dumps(read_jobs(sys.argv[1]), ensure_ascii=False))
    except (OSError, UnicodeError, csv.Error, ValueError) as error:
        message = str(error) if isinstance(error, (csv.Error, ValueError)) else type(error).__name__
        print(f'CSV error: {message}', file=sys.stderr)
        sys.exit(1)
