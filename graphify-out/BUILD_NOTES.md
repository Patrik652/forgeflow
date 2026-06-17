# Graphify Build Notes

Built: 2026-06-17T17:47:53.044168+00:00
Project: ForgeFlow
Mode: deterministic no-LLM extraction

Reason: current Claude CLI semantic extraction is quota-limited in this session; no Gemini/OpenAI/DeepSeek/Kimi API key was set. Ollama was intentionally not used to avoid RAM pressure.

Included:
- Graphify AST extraction for code files
- Deterministic document file nodes
- Deterministic Markdown headings and local Markdown links

Deferred:
- LLM semantic extraction of prose/image meaning after Claude reset or API key setup

Outputs:
- graph.json: generated
- GRAPH_REPORT.md: generated
- graph.html: generated

Corpus:
- total files: 17
- code files: 12
- document files: 5
- skipped sensitive files: 0
- AST nodes: 50
- deterministic doc nodes: 27
- graph nodes: 75
- graph edges: 70
- communities: 14
