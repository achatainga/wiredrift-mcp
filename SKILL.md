---
name: wiredrift-mcp
description: AST-Powered Wire Contract Drift & Mock Desynchronization Detector for Autonomous Coding Agents.
version: 1.0.0
tags:
  - openapi
  - contract-testing
  - mock-drift
  - ast
  - typescript
  - api-testing
---

# WireDrift: Wire Contract & Mock Desynchronization Detector

WireDrift prevents AI coding agents from "hallucinating green tests" by continuously comparing test mocks (`jest.mock`, `msw`, `nock`, `httpx_mock`) against live OpenAPI/JSON schemas and staging contract manifests.

## The Problem

Agents tasked with fixing failing tests often modify the test mock data rather than fixing the underlying business logic:
1. **Mock Drift**: An agent changes a mock response from `{ "user": { "id": 123 } }` to `{ "id": 123 }` just to make a unit test pass, breaking production compatibility.
2. **False Green Syndrome**: Local tests pass 100%, but staging crashes immediately with HTTP 422 Unprocessable Entity or unhandled null dereferences.
3. **Ghost Fields**: Mocks accumulate deprecated fields that production services stopped sending months ago.

## Core Capabilities

1. **AST-Driven Mock Extraction**:
   - Parses TypeScript, JavaScript, and JSON fixtures to locate simulated HTTP responses and RPC payloads.
2. **OpenAPI 3.x / JSON Schema Validation**:
   - Performs bi-directional schema comparison between mock shapes and canonical API specifications.
3. **Hard Pre-Test Gate**:
   - Hook blocks `npm test` or `pytest` if mocks contain non-compliant schemas, surfacing the exact property discrepancy.
4. **Deterministic Mock Patching**:
   - Generates minimal valid mock objects conforming strictly to the OpenAPI schema.

## Available MCP Tools

- `extract_mock_contracts`: Scans test directories and extracts simulated wire payloads.
- `diff_wire_contracts`: Evaluates mock payloads against an OpenAPI schema or live endpoint manifest.
- `generate_contract_patch`: Synthesizes updated mock fixtures aligned with current API contracts.

## Hook Integration

WireDrift registers a `PreToolUse` hook in `hooks/hooks.json` to inspect test execution commands and halt execution if critical contract drift is detected.
