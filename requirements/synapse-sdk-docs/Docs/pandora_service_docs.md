# Pandora Service

## Relevant Source Files

The PandoraService provides a unified interface for interacting with Pandora smart contracts, which handle storage marketplace business logic including proof set management, storage provider coordination, cost calculations, and payment flows. This service acts as the primary orchestration layer between clients, storage providers, and the underlying blockchain infrastructure.

For information about proof set creation and data validation, see **PDP (Proof of Data Possession)**.  
For payment operations and allowance management, see **PaymentsService**.  
For storage upload/download workflows, see **StorageService**.

## Core Architecture

The PandoraService class provides a consolidated interface to all Pandora contract operations, organized into five main functional areas: proof set management, cost calculations, provider management, service pricing, and proving period configuration.

**Sources:** `src/pandora/service.ts` 103-136

### External Dependencies

- **PandoraService Class**
  - Provider Operations
  - Cost Operations
  - Proof Set Operations
  - Contract Management
  - Proving Period

**Key Dependencies:**
- `ethers.Provider`
- `Pandora Contract`
- `PDPVerifier`
- `PaymentsService`

### Main Operations

- `getMaxProvingPeriod()`
- `getChallengeWindow()`
- `getProvingPeriodInfo()`
- `_getPandoraContract()`
- `_getPDPVerifier()`
- `registerServiceProvider()`
- `approveServiceProvider()`
- `removeServiceProvider()`
- `getAllApprovedProviders()`
- `calculateStorageCost()`
- `checkAllowanceForStorage()`
- `prepareStorageUpload()`
- `getClientProofSets()`
- `getClientProofSetsWithDetails()`
- `getAddRootsInfo()`
- `verifyProofSetCreation()`

## Proof Set Management

The service provides comprehensive proof set lifecycle management, from creation verification to root addition and status monitoring. Proof sets are the core data structures that track client storage commitments and their associated metadata.

**Sources:** `src/pandora/service.ts` 145-249, `src/test/pandora-service.test.ts` 159-290

### Key Proof Set Operations

| Method | Purpose | Returns |
|--------|---------|---------|
| `getClientProofSets()` | Get basic proof sets for a client | `ProofSetInfo[]` |
| `getClientProofSetsWithDetails()` | Enhanced proof sets with chain data | `EnhancedProofSetInfo[]` |
| `getAddRootsInfo()` | Information for adding roots to existing proof set | `AddRootsInfo` |
| `verifyProofSetCreation()` | Verify proof set creation transaction success | `ProofSetCreationVerification` |
| `getComprehensiveProofSetStatus()` | Combined server and chain status | `ComprehensiveProofSetStatus` |

### Proof Set Information Flow

The service distinguishes between "rail IDs" (Pandora contract identifiers) and "proof set IDs" (PDPVerifier contract identifiers), providing clear mapping between these identification systems.

**Flow sequence:**
1. Client calls `getClientProofSets(clientAddress)`
2. PandoraService calls `getClientProofSets()` on Pandora Contract
3. Returns `ProofSetInfo[]` as formatted proof sets
4. For enhanced details: `getClientProofSetsWithDetails()`
5. Service calls `railToProofSet(railId)` to get `pdpVerifierProofSetId`
6. Checks `proofSetLive(proofSetId)` to get `isLive` status
7. Gets `getNextRootId(proofSetId)` for `nextRootId`
8. Returns `EnhancedProofSetInfo[]`

**Sources:** `src/pandora/service.ts` 39-101, `src/pandora/service.ts` 145-470

## Storage Cost Management

The PandoraService calculates storage costs based on on-chain pricing and provides comprehensive allowance checking to ensure users have sufficient approvals for storage operations.

**Sources:** `src/pandora/service.ts` 478-524, `src/pandora/service.ts` 534-602

### Cost and Allowance Methods

The service provides three levels of cost analysis:

1. **Basic Cost Calculation** (`calculateStorageCost()`): Returns cost per epoch, day, and month for both regular and CDN-enabled storage

2. **Allowance Verification** (`checkAllowanceForStorage()`): Checks if current allowances are sufficient for the storage operation

3. **Upload Preparation** (`prepareStorageUpload()`): Provides actionable steps to prepare for storage including required deposits and approvals

The lockup calculation uses a configurable period (default 10 days) to determine the security deposit required:
```
lockupNeeded = ratePerEpoch * lockupPeriod * epochsPerDay
```

### Cost Calculation Flow

**Input:** Data Size (bytes) → **Process:** `getServicePrice()` → **Output:** Calculated Costs

**Pricing Components:**
- `pricePerTiBPerMonthNoCDN`
- `pricePerTiBPerMonthWithCDN`
- `epochsPerMonth`

**Cost Breakdown:**
- Per Epoch costs
- With CDN costs
- Per Day costs
- Per Month costs

**Allowance Check:** Current Usage → sufficient: boolean

**Sources:** `src/pandora/service.ts` 472-683, `src/test/pandora-service.test.ts` 806-1295

## Storage Provider Management

The service provides complete lifecycle management for storage providers, from registration through approval and ongoing management. Provider operations are restricted by role-based access control.

**Sources:** `src/pandora/service.ts` 687-861, `src/test/pandora-service.test.ts` 555-803

### Provider Data Structures

| Interface | Purpose | Key Fields |
|-----------|---------|------------|
| `ApprovedProviderInfo` | Information about approved providers | `owner`, `pdpUrl`, `pieceRetrievalUrl`, `registeredAt`, `approvedAt` |
| `PendingProviderInfo` | Information about pending providers | `pdpUrl`, `pieceRetrievalUrl`, `registeredAt` |

Provider IDs are assigned sequentially starting from 1, with 0 indicating "not found" or "not approved". The service provides both address-to-ID mapping and ID-to-info retrieval.

### Provider Management Workflow

**Registration Flow:**
1. `registerServiceProvider()` → Pending Provider Status
2. **Owner Actions:**
   - `approveServiceProvider()` → Approved Provider
   - `addServiceProvider()` → Approved Provider  
   - `rejectServiceProvider()` → Rejected Provider

**Provider Queries:**
- `isProviderApproved()`
- `getProviderIdByAddress()`
- `getApprovedProvider()`
- `getPendingProvider()`
- `getAllApprovedProviders()`

**Sources:** `src/pandora/service.ts` 71-78, `src/types.ts`

## Integration with Payment System

The PandoraService integrates closely with the PaymentsService to manage allowances and ensure users have sufficient funds for storage operations.

### Payment Integration Flow

**Storage Upload Preparation:**
1. `calculateStorageCost()` → Cost calculation
2. `checkAllowanceForStorage()` → Allowance verification
3. `paymentsService.accountInfo()` → Account status

**Required Actions:**
- Deposit USDFC
- Approve Service
- Ready for Upload

The service calculates both rate allowances (ongoing cost per epoch) and lockup allowances (security deposit) required for storage operations. The `prepareStorageUpload()` method returns executable actions that users can perform to satisfy requirements.

**Sources:** `src/pandora/service.ts` 610-682, `src/test/pandora-service.test.ts` 1121-1295

## Proving Period Configuration

The service provides access to timing parameters that control the proof-of-data-possession verification schedule, including maximum proving periods and challenge windows.

### Timing Configuration

| Method | Purpose | Units |
|--------|---------|-------|
| `getMaxProvingPeriod()` | Maximum time between proofs | Epochs |
| `getChallengeWindow()` | Window for proof submission | Epochs |
| `getProvingPeriodInHours()` | Max proving period converted | Hours |
| `getChallengeWindowInMinutes()` | Challenge window converted | Minutes |
| `getProvingPeriodInfo()` | Comprehensive timing information | Multiple |

The service uses the conversion factor of 30 seconds per epoch for time calculations:
```
hours = (epochs * 30) / 3600
```

**Sources:** `src/pandora/service.ts` 883-952, `src/test/pandora-service.test.ts` 1548-1601

## Key Interfaces and Types

The service defines several critical interfaces for managing proof set operations and status tracking:

### Core Interfaces

**ProofSetCreationVerification:**
- `transactionMined: boolean`
- `transactionSuccess: boolean`

**AddRootsInfo:**
- `nextRootId: number`
- `proofSetId?: number`

**PendingProviderInfo:**
- `clientDataSetId: number`
- `proofSetLive: boolean`

**ComprehensiveProofSetStatus:**
- `currentRootCount: number`

**Sources:** `src/pandora/service.ts` 39-101

The service provides both synchronous data retrieval and asynchronous status monitoring capabilities, with comprehensive error handling and graceful degradation when external services are unavailable.

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/6-pandora-service*