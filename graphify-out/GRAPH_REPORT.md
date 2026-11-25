# Graph Report - proof-review  (2026-11-25)

## Corpus Check
- 27 files · ~12,362 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 130 nodes · 137 edges · 21 communities (14 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08bc7f00`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Video|Video]]
- [[_COMMUNITY_Scripts|Scripts]]
- [[_COMMUNITY_Tests|Tests]]
- [[_COMMUNITY_n8n Workflow|n8n Workflow]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Project Docs|Project Docs]]
- [[_COMMUNITY_Build Config|Build Config]]
- [[_COMMUNITY_Scripts|Scripts]]
- [[_COMMUNITY_Scripts|Scripts]]
- [[_COMMUNITY_Scripts|Scripts]]
- [[_COMMUNITY_Scripts|Scripts]]
- [[_COMMUNITY_Scripts|Scripts]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `ForgeFlow — Demo / Presentation Video — Spec` - 12 edges
2. `ForgeFlow — CNC Production Job Tracker (n8n + Claude) — Design` - 12 edges
3. `ForgeFlow CNC Production Job Tracker` - 8 edges
4. `run_case()` - 6 edges
5. `ForgeFlow — CNC Job Triage Demo` - 6 edges
6. `main()` - 5 edges
7. `normalize()` - 5 edges
8. `output_items()` - 4 edges
9. `processJob()` - 4 edges
10. `gate.sh script` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (21 total, 7 thin omitted)

### Community 0 - "Video"
Cohesion: 0.16
Nodes (4): clamp, ForgeFlowDemo(), scenes, RemotionRoot()

### Community 1 - "Scripts"
Cohesion: 0.29
Nodes (6): alertJobs, expectedAlerts, jobs, payload, raw, rows

### Community 2 - "Tests"
Cohesion: 0.20
Nodes (10): Storyboard target 60s, Deliverables Codex builds, Deliverables (Codex builds), ForgeFlow — Demo / Presentation Video — Spec, Gate, Goal, Important honesty constraint, Out of scope (+2 more)

### Community 3 - "n8n Workflow"
Cohesion: 0.15
Nodes (12): ForgeFlow — CNC Production Job Tracker n8n + Claude — Design, Components / deliverables Codex builds, Mock-run contract so the gate is meaningful, Out of scope YAGNI, Problem the story we sell, Components / deliverables (Codex builds), Deterministic gate, ForgeFlow — CNC Production Job Tracker (n8n + Claude) — Design (+4 more)

### Community 4 - "Build Config"
Cohesion: 0.14
Nodes (13): dependencies, react, react-dom, remotion, @remotion/cli, @remotion/compositor-linux-x64-gnu, devDependencies, name (+5 more)

### Community 5 - "Project Docs"
Cohesion: 0.21
Nodes (11): ForgeFlow CNC Production Job Tracker, Stack, Demo Data, Screenshot Placeholders, Architecture, ForgeFlow — CNC Job Triage Demo, Problem, Quickstart / Run (+3 more)

### Community 6 - "Build Config"
Cohesion: 0.33
Nodes (8): calendarDate(), normalize(), processJob(), processJobs(), quantity(), text(), base, clock

### Community 7 - "Scripts"
Cohesion: 1.00
Nodes (3): gate.sh script, check_cat(), fail()

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (8): assert_results(), command(), decode_execution(), expected_jobs(), main(), output_items(), provider_boundary(), run_case()

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (5): artifacts, engine, parsed, root, samples

## Knowledge Gaps
- **61 isolated node(s):** `root`, `engine`, `parsed`, `samples`, `artifacts` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `root`, `engine`, `parsed` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._