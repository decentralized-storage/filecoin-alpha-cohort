# Testing Patterns

**FilOzone/synapse-sdk Documentation**

---

## Overview

This document describes the testing patterns, strategies, and utilities used throughout the Synapse SDK. It covers mock infrastructure, service-layer testing approaches, error handling validation, and test organization patterns. For information about the build process and CI/CD pipeline, see Build Process and CI/CD.

## Mock Infrastructure Pattern

The SDK uses a comprehensive mocking strategy to test blockchain interactions without requiring real network connections. The core mock infrastructure centers around `createMockProvider()` and `createMockSigner()` functions that simulate Ethereum provider and signer behavior.

The mock provider intercepts contract calls by analyzing function selectors and returns appropriate encoded responses. For example, the `getServicePrice` function (selector `0x5482bdf9`) returns mock pricing data with 2 USDFC per TiB per month.

### Mock Infrastructure Architecture

```
Test Infrastructure
├── test-utils.ts
│   ├── Mock Factories
│   │   ├── createMockProvider() - Simulates blockchain calls
│   │   └── createMockSigner() - Simulates wallet operations
│   └── Mock Responses
│       ├── Contract Call Mocks - provider.call()
│       ├── Transaction Mocks - sendTransaction()
│       └── Balance Mocks - getBalance()
└── Test Suites
    ├── synapse.test.ts - Main class tests
    ├── storage.test.ts - Storage service tests
    └── payments.test.ts - Payment service tests
```

## Service Layer Testing Architecture

Each major service class follows a consistent testing pattern using dependency injection and mock services. The tests isolate individual services while mocking their dependencies.

The `StorageService` tests demonstrate this pattern extensively, using mock `PandoraService` instances that return controlled data for provider selection and proof set management.

### Service Testing Pattern

```
Service Under Test
├── StorageService
├── PaymentsService
└── Synapse
    │
    └── Mock Dependencies
        ├── Mock PandoraService - Contract interactions
        ├── Mock PDPServer - Upload/download operations
        ├── Mock Provider - Blockchain calls
        └── Mock Signer - Transaction signing

Test Scenarios
├── Success Path Tests - Normal operations
├── Error Path Tests - Exception handling
├── Edge Case Tests - Boundary conditions
└── Callback Tests - Progress notifications
```

## Provider Selection Testing Patterns

The storage service implements complex provider selection logic that requires comprehensive testing of different selection strategies and edge cases.

### Selection Strategies

| Strategy | Method | Test Scenarios |
|----------|--------|----------------|
| **Random Provider** | `getAllApprovedProviders()` | Multiple Available Providers - Random selection logic |
| **Provider ID** | `getApprovedProvider(id)` | No Approved Providers - Error handling |
| **Provider Address** | `getProviderIdByAddress()` | Provider Not Found - Error validation |
| **Proof Set ID** | `getClientProofSetsWithDetails()` | Conflicting Parameters - Validation logic |

### Mock Data Components

- **Mock Proof Sets**: `railId`, `payee`, `isLive`
- **Mock Provider Info**: `owner`, `pdpUrl`, `registeredAt`
- **Mock /ping Endpoint**: Provider health check

The tests validate provider selection by creating controlled mock scenarios with known provider and proof set configurations, then asserting the correct selection behavior.

## Error Handling and Validation Testing

The SDK implements comprehensive error handling that requires systematic validation of error conditions and error message content.

### Size Validation Testing

Both `preflightUpload()` and `upload()` methods enforce strict size limits that are tested at boundary conditions:

```javascript
// Tests validate 65-byte minimum and 200 MiB maximum
await service.preflightUpload(64) // Should throw "below minimum"
await service.upload(210 * 1024 * 1024) // Should throw "exceeds maximum"
```

### Network Validation Testing

The `Synapse` class validates supported networks and rejects unsupported chain IDs with descriptive error messages.

### Contract Call Error Testing

Mock providers can be configured to throw errors, simulating network failures and contract execution failures for comprehensive error path testing.

## Skip Pattern for Integration Tests

The testing suite uses `it.skip()` extensively to disable tests that require real blockchain connections or external service dependencies. This pattern allows maintaining comprehensive test coverage while keeping the test suite runnable in CI/CD environments.

```javascript
it.skip('should create new proof set when none exist', async () => {
    // Skip: Requires real PDPServer for createProofSet
    // This would need mocking of PDPServer which is created internally
})
```

### Common Skip Reasons

- Real contract interactions required
- External HTTP services needed
- Complex internal mocking required
- Browser-specific functionality in Node.js tests

## Callback and Progress Testing

Upload operations support callback functions for progress tracking and status updates. The tests validate that callbacks are invoked with correct parameters at appropriate times.

### Upload Flow Testing Pattern

```
Upload Flow                    Test Validation
├── upload() called           ├── Callback fired flags
├── onUploadComplete          │   └── boolean tracking
├── CommP calculated          ├── Parameter validation
├── onRootAdded               │   └── assert.equal() checks
└── Proof set updated         └── Sequence validation
                                  └── Order verification
```

The callback tests use boolean flags to track callback invocation and validate parameters passed to callback functions.

## Mock Contract Response Patterns

The mock provider implements detailed contract call simulation by analyzing function selectors and returning properly encoded responses. Key patterns include:

### Function Selector Matching

```javascript
if (data?.startsWith('0x5482bdf9') === true) {
    // Mock getServicePrice response
    return ethers.AbiCoder.defaultAbiCoder().encode(...)
}
```

### Multi-Field Response Encoding

```javascript
// Mock account info with 4 fields
return ethers.AbiCoder.defaultAbiCoder().encode(
    ['uint256', 'uint256', 'uint256', 'uint256'],
    [funds, lockupCurrent, lockupRate, lockupLastSettledAt]
)
```

### Contract Address Validation

Some mock responses validate the target contract address to ensure calls are directed to the correct contract instance.

## Assertion and Validation Patterns

The test suite uses Chai assertions with specific patterns for different validation types:

### Existence Validation

```javascript
assert.exists(synapse.payments)
assert.isFunction(storage.upload)
```

### Type Validation

```javascript
assert.isTrue(data instanceof Uint8Array)
assert.typeOf(tx.hash, 'string')
```

### Error Message Validation

```javascript
assert.include(error.message, 'below minimum allowed size')
assert.include(error.message, 'Rate allowance insufficient')
```

### Deep Equality for Data

```javascript
assert.deepEqual(downloaded, testData)
assert.equal(result.commp.toString(), expectedCommP)
```

## Test Organization Structure

The testing suite is organized into focused test files with clear separation of concerns:

| Test File | Focus Area | Key Components |
|-----------|------------|----------------|
| **synapse.test.ts** | Main class tests | Network validation, initialization |
| **storage.test.ts** | Storage service tests | Provider selection, upload/download flows |
| **payments.test.ts** | Payment service tests | Token allowances, service approvals |
| **test-utils.ts** | Mock infrastructure | Provider/signer mocks, response simulation |

## Test Data Management

Tests use consistent mock data patterns:

- **Standardized mock responses** for contract calls
- **Predictable test data** for upload/download operations
- **Controlled provider configurations** for selection testing
- **Consistent error scenarios** for validation testing

## Best Practices

### Mock Strategy

- Use dependency injection for testable service architecture
- Implement comprehensive function selector mapping
- Validate contract addresses in mock responses
- Simulate realistic blockchain behavior

### Test Coverage

- Test both success and error paths
- Validate boundary conditions and edge cases
- Test callback invocation and parameter passing
- Verify error messages for user-facing errors

### Test Organization

- Group related tests in describe blocks
- Use clear, descriptive test names
- Skip integration tests requiring external dependencies
- Maintain consistent assertion patterns

---

**Sources:**
- `src/test/test-utils.ts` (lines 28-225, 88-98, 77-87)
- `src/test/storage.test.ts` (lines 14-37, 102-111, 50-135, 529-601, 1005-1031, 252-255, 1222-1273, 1054-1055)
- `src/test/synapse.test.ts` (lines 102-113, 37-45, 26-28)
- `src/test/payments.test.ts` (lines 183-211, 272-304)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/8.2-testing-patterns