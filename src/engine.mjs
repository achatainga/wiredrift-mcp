/**
 * WireDrift Engine (Stateless MCP 2026-07-28 Spec)
 * AST-Powered Wire Contract Drift & Mock Desynchronization Detector
 */

export class WireDriftEngine {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Evaluates mock objects or payload shapes against a canonical schema (OpenAPI/JSON-Schema-like).
   */
  diffWireContracts(mockPayload, canonicalSchema) {
    const issues = [];
    const schemaProps = canonicalSchema.properties || {};
    const requiredProps = canonicalSchema.required || [];

    // 1. Check for missing required properties
    for (const req of requiredProps) {
      if (!(req in mockPayload)) {
        issues.push({
          type: 'MISSING_REQUIRED_PROPERTY',
          property: req,
          expectedType: schemaProps[req]?.type || 'unknown',
          severity: 'BLOCKING',
          message: `Required property '${req}' is missing in the mock fixture.`
        });
      }
    }

    // 2. Check property types
    for (const [key, value] of Object.entries(mockPayload)) {
      if (schemaProps[key]) {
        const expectedType = schemaProps[key].type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;

        if (expectedType && actualType !== expectedType) {
          // Allow integer as number
          if (!(expectedType === 'integer' && actualType === 'number' && Number.isInteger(value))) {
            issues.push({
              type: 'TYPE_MISMATCH',
              property: key,
              expectedType,
              actualType,
              severity: 'CRITICAL',
              message: `Property '${key}' has type '${actualType}', but canonical schema requires '${expectedType}'.`
            });
          }
        }

        // Enum check
        if (schemaProps[key].enum && !schemaProps[key].enum.includes(value)) {
          issues.push({
            type: 'ENUM_VIOLATION',
            property: key,
            allowedValues: schemaProps[key].enum,
            actualValue: value,
            severity: 'CRITICAL',
            message: `Property '${key}' value '${value}' is not among allowed enum values: [${schemaProps[key].enum.join(', ')}].`
          });
        }
      } else if (!canonicalSchema.additionalProperties && canonicalSchema.additionalProperties !== undefined) {
        issues.push({
          type: 'UNEXPECTED_PROPERTY',
          property: key,
          severity: 'WARNING',
          message: `Property '${key}' is not defined in the canonical schema and additionalProperties is false.`
        });
      }
    }

    const hasBlocking = issues.some(i => i.severity === 'BLOCKING' || i.severity === 'CRITICAL');

    return {
      endpoint: canonicalSchema.title || 'unnamed_contract',
      isValid: issues.length === 0,
      hasBlockingIssues: hasBlocking,
      issueCount: issues.length,
      issues
    };
  }

  /**
   * Generates a patched mock fixture that adheres strictly to the canonical schema.
   */
  generateContractPatch(mockPayload, canonicalSchema) {
    const patched = { ...mockPayload };
    const schemaProps = canonicalSchema.properties || {};
    const requiredProps = canonicalSchema.required || [];

    // Inject missing required fields with synthetic schema defaults
    for (const req of requiredProps) {
      if (!(req in patched)) {
        const propDef = schemaProps[req] || {};
        switch (propDef.type) {
          case 'string':
            patched[req] = propDef.enum ? propDef.enum[0] : 'synthetic_string_val';
            break;
          case 'number':
          case 'integer':
            patched[req] = 100;
            break;
          case 'boolean':
            patched[req] = true;
            break;
          case 'array':
            patched[req] = [];
            break;
          case 'object':
            patched[req] = {};
            break;
          default:
            patched[req] = null;
        }
      }
    }

    // Fix type mismatches if simple cast is possible
    for (const [key, value] of Object.entries(patched)) {
      if (schemaProps[key]) {
        const expectedType = schemaProps[key].type;
        if (expectedType === 'string' && typeof value === 'number') {
          patched[key] = String(value);
        } else if ((expectedType === 'number' || expectedType === 'integer') && typeof value === 'string' && !isNaN(Number(value))) {
          patched[key] = Number(value);
        }
      }
    }

    return {
      original: mockPayload,
      patched,
      diffSummary: `Patched ${Object.keys(patched).length - Object.keys(mockPayload).length} missing required fields and aligned types.`
    };
  }
}

// Standalone CLI test
if (process.argv[1]?.endsWith('engine.mjs')) {
  const engine = new WireDriftEngine();
  const schema = {
    title: 'GET /api/v1/users/{id}',
    required: ['id', 'email', 'status'],
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      status: { type: 'string', enum: ['active', 'suspended', 'pending'] }
    }
  };
  const dirtyMock = { id: 12345, email: 'user@example.com' };
  console.log(JSON.stringify(engine.diffWireContracts(dirtyMock, schema), null, 2));
}
