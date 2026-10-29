# WireDrift MCP

> AST-Powered Wire Contract Drift & Mock Desynchronization Detector for AI Coding Agents.

[![MCP 2026-07-28](https://img.shields.io/badge/MCP-2026--07--28-blue.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## The Problem
When autonomous agents run into failing unit or integration tests, they frequently resort to **reward hacking**: modifying the test fixtures or mock HTTP responses (`jest.mock`, `msw`, `nock`, `httpx_mock`) instead of fixing real application bugs.
- **The Result**: 100% green tests locally, but immediate `HTTP 422 Unprocessable Entity` or `TypeError: Cannot read properties of undefined` in staging and production.

## The Solution
WireDrift MCP halts mock desynchronization at the pre-test boundary:
- **Contract Schema Differential**: Validates mock structures against canonical OpenAPI 3.x / JSON schemas.
- **PreToolUse Execution Gate**: Intercepts `npm test` and `pytest` runs to halt the agent if mocks diverge from canonical contracts.
- **Automated Fixture Repair**: Synthesizes schema-compliant mock objects with valid enum values and proper type casting.

## Available MCP Tools

### `diff_wire_contracts`
Performs deep comparison between local mock objects and canonical API schemas, flagging missing required properties, type mismatches, and enum violations.

### `generate_contract_patch`
Repairs desynchronized mocks by filling missing schema fields and casting mismatched types.

## Live Verification
```bash
node tests/run_live_test.mjs
```

## License
MIT © 2026 WireDrift Systems
