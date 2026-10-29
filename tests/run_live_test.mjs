import assert from 'node:assert';
import { WireDriftEngine } from '../src/engine.mjs';

async function runAllTests() {
  console.log('🧪 Starting WireDrift MCP Live Test Gauntlet...');
  const engine = new WireDriftEngine();

  const canonicalUserSchema = {
    title: 'GET /api/v2/users/{id}',
    required: ['id', 'email', 'status', 'tier'],
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
      tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
      loginCount: { type: 'number' }
    }
  };

  // Test 1: Flag Missing Required Property
  console.log('\n[Test 1] Detecting missing required properties in mock...');
  const incompleteMock = {
    id: 'usr_abc_123',
    email: 'test@dt24.internal',
    status: 'active'
    // missing 'tier'
  };
  const diffResult1 = engine.diffWireContracts(incompleteMock, canonicalUserSchema);
  assert.strictEqual(diffResult1.isValid, false);
  assert.ok(diffResult1.issues.some(i => i.type === 'MISSING_REQUIRED_PROPERTY' && i.property === 'tier'));
  console.log('  ✅ Successfully caught missing required property: tier');

  // Test 2: Flag Type Mismatch
  console.log('\n[Test 2] Detecting property type mismatches (number instead of string)...');
  const typeMismatchMock = {
    id: 998877, // Invalid type! Should be string
    email: 'test@dt24.internal',
    status: 'active',
    tier: 'pro'
  };
  const diffResult2 = engine.diffWireContracts(typeMismatchMock, canonicalUserSchema);
  assert.strictEqual(diffResult2.isValid, false);
  assert.ok(diffResult2.issues.some(i => i.type === 'TYPE_MISMATCH' && i.property === 'id'));
  console.log('  ✅ Successfully detected type mismatch on id (number vs string)');

  // Test 3: Flag Enum Violation
  console.log('\n[Test 3] Detecting unapproved enum value...');
  const enumViolationMock = {
    id: 'usr_99',
    email: 'test@dt24.internal',
    status: 'god_mode', // Invalid enum!
    tier: 'pro'
  };
  const diffResult3 = engine.diffWireContracts(enumViolationMock, canonicalUserSchema);
  assert.strictEqual(diffResult3.isValid, false);
  assert.ok(diffResult3.issues.some(i => i.type === 'ENUM_VIOLATION' && i.property === 'status'));
  console.log('  ✅ Successfully detected enum violation: god_mode');

  // Test 4: Automatic Patch Generation & Re-validation
  console.log('\n[Test 4] Generating automatic contract patch and re-validating...');
  const dirtyMock = {
    id: 12345, // will be cast to string
    email: 'auto@dt24.internal'
    // missing status and tier
  };
  const patchResult = engine.generateContractPatch(dirtyMock, canonicalUserSchema);
  assert.strictEqual(typeof patchResult.patched.id, 'string', 'id must be cast to string');
  assert.ok(patchResult.patched.status, 'status must be populated with default enum');
  assert.ok(patchResult.patched.tier, 'tier must be populated with default enum');

  const recheckDiff = engine.diffWireContracts(patchResult.patched, canonicalUserSchema);
  assert.strictEqual(recheckDiff.isValid, true, 'Patched mock must be 100% valid');
  assert.strictEqual(recheckDiff.issues.length, 0, 'No remaining issues');
  console.log('  ✅ Successfully synthesized valid mock fixture conforming to OpenAPI schema.');

  console.log('\n🎉 ALL 4 GAUNTLET TESTS PASSED WITH 100% SUCCESS RATE!');
}

runAllTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
