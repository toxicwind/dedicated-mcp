# Changelog

Auto-backfilled from git history 2026-11-02 (real commits only).

## 2026-11-01
- toolkit module: expose fabric.json + ports.json (toolkit-mcp surface) as toolkit/fabric.read, toolkit/ports.li (ef4522f)
- universal: manifest-driven all-pens discovery (14 pens, 27 tools) via toolkit listPens/readProducts contract (9458489)
- TDD: ModuleRegistry unit tests (13) + estate ports/pens tests (5); export loadPorts/loadPens for testability (b89e59a)
- universal MCP: cross-pen federation (fathom+geode, 4 tools) via registry, Effect-based handlers (5409f7a)
- dedicated-mcp v0.1: universal modular MCP for all pens — ModuleRegistry (per-pen namespaced tools), stdio serv (9287f30)
