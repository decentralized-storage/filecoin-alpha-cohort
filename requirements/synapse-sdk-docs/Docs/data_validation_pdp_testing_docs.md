# Data Validation and PDP Testing

## Relevant Source Files

This page covers the validation system for PDP (Proof of Data Possession) server responses and the testing infrastructure for PDP authentication signatures. The validation system ensures that responses from untrusted PDP servers conform to expected formats before being used by the SDK, while the testing utilities verify compatibility with smart contract implementations.

For broader PDP system architecture, see **PDP (Proof of Data Possession)**.  
For StorageService integration, see **StorageService**.

## PDP Response Validation System

The SDK implements a comprehensive validation system to ensure responses from PDP servers match expected formats and contain valid data. This system protects against malformed responses and provides type safety throughout the SDK.

### Validation Architecture

**PDP Server Responses:**
- `ProofSetCreationStatusResponse`
- `RootAdditionStatusResponse`
- `FindPieceResponse`
- `ProofSetData`
- `ProofSetRootData`

**Type Guards:**
- `isProofSetCreationStatusResponse()`
- `isRootAdditionStatusResponse()`
- `isFindPieceResponse()`

**Validators:**
- `validateProofSetCreationStatus()`
- `validateRootAdditionStatus()`
- `validateFindPieceResponse()`

**Converters:**
- `asProofSetData()`
- `asProofSetRootData()`

**Validated Types:**
- `ValidatedProofSetCreationStatusResponse`
- `ValidatedRootAdditionStatusResponse`
- `ValidatedFindPieceResponse`
- `ValidatedProofSetData`

**Sources:** `src/pdp/validation.ts` 1-306

### Type Guards and Validation Functions

The validation system uses TypeScript type guards to verify response structure at runtime:

| Function | Purpose | Key Validations |
|----------|---------|-----------------|
| `isProofSetCreationStatusResponse()` | Validates proof set creation status | Required string fields, boolean flags, optional proofSetId |
| `isRootAdditionStatusResponse()` | Validates root addition status | Transaction info, proof set ID, root count, optional confirmed IDs |
| `isFindPieceResponse()` | Validates piece lookup responses | CommP CID validation, supports legacy field names |
| `asProofSetRootData()` | Converts root data objects | CommP CID conversion, numeric field validation |
| `asProofSetData()` | Converts proof set data | Array validation, recursive root validation |

### Compatibility Handling

The validation system handles backward compatibility with different PDP server implementations:

**Normalization Process:**
- **Curio Server Response:** `{ proofsetCreated: true }` (lowercase 's')
- **Standard Response:** `{ proofSetCreated: true }` (uppercase 'S')
- **Validation Process:** `isProofSetCreationStatusResponse()` → `validateProofSetCreationStatus()`
- **Normalized Output:** `{ proofSetCreated: true }`

The validation system normalizes field names for consistency. For example, Curio servers return `proofsetCreated` (lowercase 's') while the SDK uses `proofSetCreated` (uppercase 'S'). The validator accepts both formats and normalizes to the SDK standard.

**Sources:** `src/pdp/validation.ts` 23-57, `src/pdp/validation.ts` 143-167, `src/test/pdp-validation.test.ts` 48-91

## Authentication Signature Testing

The SDK includes comprehensive testing for EIP-712 signatures used in PDP operations to ensure compatibility with smart contracts.

### Test Fixtures and Reference Data

The test suite uses fixed reference signatures generated from Solidity implementations to ensure cross-platform compatibility:

| Operation | Test Data | Purpose |
|-----------|-----------|---------|
| **CreateProofSet** | `clientDataSetId: 12345`, payee address, `withCDN: true` | Verify proof set creation signatures |
| **AddRoots** | `clientDataSetId: 12345`, `firstAdded: 1`, root digests | Verify root addition signatures |
| **ScheduleRemovals** | `clientDataSetId: 12345`, `rootIds: [1,3,5]` | Verify removal scheduling signatures |
| **DeleteProofSet** | `clientDataSetId: 12345` | Verify proof set deletion signatures |

### Signature Generation Flow

**Test Infrastructure:**
- **FIXTURES:** Test Private Key, Contract Address, Chain ID: 31337
- **PDPAuthHelper Operations:** `signCreateProofSet()`, `signAddRoots()`, `signScheduleRemovals()`, `signDeleteProofSet()`
- **Reference Signatures:** Solidity Reference Signatures, Expected Message Digests
- **Validation:** Signature Comparison, Signer Recovery, Consistency Checks

**Flow Sequence:**
1. Test Suite → PDPAuthHelper: `signCreateProofSet(12345, payeeAddr, true)`
2. PDPAuthHelper → ethers.Wallet: `signTypedData(domain, types, value)`
3. ethers.Wallet → PDPAuthHelper: `signature`
4. PDPAuthHelper → Test Suite: `AuthSignature object`
5. Test Suite → Test Validator: "Compare with reference signature"
6. Test Validator: "Assert match"
7. Test Suite → Test Validator: "Recover signer from signature"
8. Test Validator: "Assert signer address matches"
9. Test Suite: "Verify signature consistency"

**Sources:** `src/test/pdp-auth.test.ts` 95-110, `src/test/pdp-auth.test.ts` 160-189

## PDP Response Validation Testing

The SDK includes extensive tests for validating PDP server responses to ensure robustness against malformed or unexpected data.

### Validation Test Categories

**Test Categories:**
- **Valid Response Cases**
  - Valid creation responses
  - Valid addition responses
  - Legacy `piece_cid` field handling
  
- **Invalid Response Cases** 
  - Null `ok` field handling
  - Mixed field scenarios
  - Wrong field types

- **Edge Cases**
  - `confirmedRootIds` array validation
  - Null `addMessageOk` handling
  - CommP CID validation

- **Compatibility Cases**
  - Curio field name compatibility
  - New `pieceCid` field
  - Both fields present scenarios

**Sources:** `src/test/pdp-validation.test.ts` 14-430

### Validation Error Handling

The validation system provides specific error messages for different failure modes:

| Validation Type | Error Conditions | Error Message |
|-----------------|------------------|---------------|
| **ProofSetCreationStatus** | Missing required fields | "Invalid proof set creation status response format" |
| **RootAdditionStatus** | Wrong field types | "Invalid root addition status response format" |
| **FindPieceResponse** | Invalid CommP CID | "Invalid find piece response: pieceCid is not a valid CommP" |
| **ProofSetData** | Invalid structure | "Invalid proof set data response format" |

## Testing Utilities and Patterns

The test suite demonstrates several key patterns for PDP validation testing:

### Positive Test Pattern

1. Create valid test data matching expected format
2. Verify type guard returns true
3. Validate using validation function
4. Assert normalized response matches expectations

### Negative Test Pattern

1. Create invalid test data with specific errors
2. Verify type guard returns false
3. Verify validation function throws appropriate error
4. Check error message specificity

**Testing Components:**
- **Error Testing:** Invalid Test Data → Expect Throw
- **Error Message Check:** Test Pattern
- **Test Data Setup:** Type Guard Check
- **Validation Function:** Assertion Verification

This comprehensive testing approach ensures that the validation system correctly handles both valid responses and various error conditions, providing robust protection against malformed PDP server responses.

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/4.3-data-validation-and-pdp-testing*