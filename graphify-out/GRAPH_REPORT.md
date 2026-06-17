> Deterministic no-LLM build: code AST + extracted doc headings/links. LLM semantic enrichment deferred; Ollama not used.

# Graph Report - /home/pato/projects/personal/forgeflow  (2026-06-17)

## Corpus Check
- Corpus is ~5,259 words - fits in a single context window. You may not need a graph.

## Summary
- 75 nodes · 70 edges · 14 communities (10 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f29dea03`
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

## God Nodes (most connected - your core abstractions)
1. `ForgeFlow — Demo / Presentation Video — Spec` - 9 edges
2. `ForgeFlow CNC Production Job Tracker` - 8 edges
3. `ForgeFlow — CNC Production Job Tracker (n8n + Claude) — Design` - 7 edges
4. `gate.sh script` - 3 edges
5. `fail()` - 3 edges
6. `check_cat()` - 3 edges
7. `gate-video.sh script` - 2 edges
8. `fail()` - 2 edges
9. `scripts` - 2 edges
10. `ForgeFlowDemo()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (14 total, 4 thin omitted)

### Community 0 - "Video"
Cohesion: 0.16
Nodes (4): clamp, ForgeFlowDemo(), scenes, RemotionRoot()

### Community 1 - "Scripts"
Cohesion: 0.22
Nodes (8): alertJobs, expectedAlerts, inputLine, inputMatch, lines, payload, raw, rows

### Community 2 - "Tests"
Cohesion: 0.29
Nodes (8): ForgeFlow — Demo / Presentation Video — Spec, Important honesty constraint, Tool choice — builder decides, Storyboard target 60s, Deliverables Codex builds, Gate, Out of scope, Goal

### Community 3 - "n8n Workflow"
Cohesion: 0.25
Nodes (8): ForgeFlow — CNC Production Job Tracker (n8n + Claude) — Design, Solution — one n8n workflow, ForgeFlow — CNC Production Job Tracker n8n + Claude — Design, Components / deliverables Codex builds, Mock-run contract so the gate is meaningful, Deterministic gate, Out of scope YAGNI, Problem the story we sell

### Community 4 - "Build Config"
Cohesion: 0.25
Nodes (7): devDependencies, name, private, scripts, render, type, version

### Community 5 - "Project Docs"
Cohesion: 0.33
Nodes (7): ForgeFlow CNC Production Job Tracker, Architecture, Quickstart / Run, Problem, Stack, Demo Data, Screenshot Placeholders

### Community 6 - "Build Config"
Cohesion: 0.33
Nodes (6): dependencies, react, react-dom, remotion, @remotion/cli, @remotion/compositor-linux-x64-gnu

### Community 7 - "Scripts"
Cohesion: 1.00
Nodes (3): gate.sh script, check_cat(), fail()

## Knowledge Gaps
- **44 isolated node(s):** `mock-run.sh script`, `render-video.sh script`, `validate.sh script`, `name`, `version` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Build Config` to `Build Config`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `mock-run.sh script`, `render-video.sh script`, `validate.sh script` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._