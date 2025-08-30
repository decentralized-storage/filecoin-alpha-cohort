# StorageService

## Relevant Source Files

The StorageService class provides high-level storage operations for uploading, downloading, and managing data pieces on Filecoin storage providers through the Synapse SDK. It handles provider selection, proof set management, and coordinates with the PDP (Proof of Data Possession) system for data integrity verification.

For payment operations and service approvals, see **PaymentsService**.  
For Pandora contract interactions and provider management, see **Pandora Service**.  
For PDP system details, see **PDP (Proof of Data Possession)**.

## Class Architecture

The StorageService class acts as the primary interface between client applications and Filecoin storage providers, orchestrating multiple internal services to provide a seamless storage experience.

### Provider Selection Architecture

**Client Layer:**
- Client Application

**Storage Operations:**
- **StorageService Class**
  - `create()` Factory Method
  - `upload()` Method
  - `providerDownload()` Method
  - `preflightUpload()` Method
  - `pieceStatus()` Method

**Provider Selection:**
- `resolveProviderAndProofSet()`
- `smartSelectProvider()`
- `selectProviderWithPing()`
- `selectRandomProvider()`

**Internal Services:**
- **PDPServer Instance** - `uploadPiece()`, `findPiece()`
- **PDPAuthHelper Instance** - Authentication
- **PandoraService Instance** - `addRoots()`, `getProofSet()`
- **Synapse Instance** - Coordination

**Sources:** `src/storage/service.ts` 1-1161

### Provider Selection System

The StorageService uses a sophisticated provider selection system that supports explicit selection by various criteria or intelligent automatic selection with ping validation.

The provider selection follows a priority hierarchy:

1. **Explicit proof set ID** - Highest priority, validates ownership and consistency
2. **Explicit provider ID** - Selects provider and finds/creates compatible proof set
3. **Explicit provider address** - Resolves to provider ID then follows provider ID logic
4. **Smart selection** - Uses existing proof sets with preference for those containing roots, falls back to random provider selection with ping validation

**Selection Process:**

**Selection Options:**
- `options.proofSetId` → `resolveByProofSetId()`
- `options.providerId` → `resolveByProviderId()`
- `options.providerAddress` → `resolveByProviderAddress()`
- Smart Selection (no options) → `smartSelectProvider()`

**Smart Selection Logic:**
1. `getClientProofSetsWithDetails()`
2. Filter: `isLive && isManaged && withCDN`
3. Sort by `currentRootCount > 0`
4. If no suitable proof sets: `getAllApprovedProviders()`
5. Generate Provider Sequence → `selectProviderWithPing()`
6. `PDPServer.ping()` → Select First Responding Provider

**Sources:** `src/storage/service.ts` 331-653, `src/storage/service.ts` 714-746

## Upload Workflow

The upload process consists of multiple phases with comprehensive validation and transaction tracking for both legacy and modern PDP servers.

### Upload Process Phases

**Upload Phase:**
1. Client → StorageService: `upload(data, callbacks?)`
2. StorageService: `validateRawSize(65-200MB)`
3. StorageService → PDPServer: `uploadPiece(dataBytes)`
4. PDPServer → StorageService: `{commP, size}`
5. StorageService: `onUploadComplete(commP)`

**Piece Parking Phase:**
6. **Loop [Polling until ready]:**
   - StorageService → PDPServer: `findPiece(commP, size)`
   - PDPServer → StorageService: piece status
   - Continue until piece is ready

**Add Roots Phase:**
7. StorageService → PandoraService: `getAddRootsInfo(proofSetId)`
8. PandoraService → StorageService: `{nextRootId, clientDataSetId}`
9. StorageService → PDPServer: `addRoots(proofSetId, clientDataSetId, nextRootId, rootDataArray)`
10. PDPServer → StorageService: `{txHash, statusUrl}`

**Transaction Verification:**
11. **New Server (with txHash):**
    - **Loop [Transaction propagation]:**
      - StorageService → Ethereum Provider: `getTransaction(txHash)`
      - Ethereum Provider → StorageService: transaction
      - StorageService: `onRootAdded(transaction)`
      - StorageService → Ethereum Provider: `transaction.wait()`
      - Ethereum Provider → StorageService: receipt
    - **Loop [Verification polling]:**
      - StorageService → PDPServer: `getRootAdditionStatus(proofSetId, txHash)`
      - PDPServer → StorageService: `{confirmedRootIds, addMessageOk}`
      - StorageService: `onRootConfirmed(confirmedRootIds)`

12. **Legacy Server (no txHash):**
    - StorageService: `onRootAdded()`
    - StorageService → Client: `{commp, size, rootId}`

### Key Validation and Error Handling

- **Size limits:** 65 bytes minimum (CommP calculation requirement), 200 MiB maximum (Curio PDP server limitation)
- **Piece parking timeout:** Configurable polling until piece is ready on provider
- **Transaction tracking:** New servers provide transaction hash for on-chain verification
- **Callback system:** Progress callbacks for upload completion, root addition, and confirmation

**Sources:** `src/storage/service.ts` 781-992, `src/storage/service.ts` 53-76

## Download Operations

The StorageService provides two download methods with provider-specific optimization and CDN support.

| Method | Purpose | Delegation |
|--------|---------|------------|
| `providerDownload()` | Downloads from this specific storage provider | Direct to `Synapse.download()` with provider hint |
| `download()` | Legacy method (deprecated) | Calls `providerDownload()` for backward compatibility |

### Download System Integration

**StorageService Download:**
- `providerDownload(commp, options?)` / `download()` [DEPRECATED]

**Provider Hint Options:**
- `providerAddress: this._provider.owner`
- `withCDN: this._withCDN`

**Synapse Download System:**
- `Synapse.download()` → **PieceRetriever Chain**
  - **SubgraphService Provider Discovery**
  - **FilCDN Retrieval**
  - **Direct Provider Retrieval**

The download process leverages the broader Synapse ecosystem for provider discovery and data retrieval.

**Sources:** `src/storage/service.ts` 1000-1015, `src/test/storage.test.ts` 1034-1105

## Proof Set Management

The StorageService manages proof sets through integration with the Pandora service and PDP server, handling both creation and querying operations.

### Proof Set Operations

**Root Management:**
- `getAddRootsInfo()` → `PDPServer.addRoots()` → `getRootAdditionStatus()`

**Proof Set Operations:**
- `getProofSetRoots()` → `PDPServer.getProofSet()` → `pieceStatus()`
- Calculate proof timing from `nextChallengeEpoch`

**Proof Set Resolution:**
- `getClientProofSetsWithDetails()` → Filter `isLive && isManaged` → Prefer `currentRootCount > 0`
- `validateProofSetConsistency()`

**Proof Set Creation:**
- `getNextClientDataSetId()` → `PDPServer.createProofSet()` → `waitForProofSetCreationWithTimeout()`
- `onProofSetCreationStarted()`

### Proof Set Lifecycle

1. **Creation:** New proof sets are created when no compatible existing proof set is found
2. **Selection:** Existing proof sets are preferred, with those containing roots prioritized  
3. **Management:** Only proof sets managed by the current Pandora contract are considered
4. **Root Addition:** New pieces are added as roots to the selected proof set

**Sources:** `src/storage/service.ts` 176-329, `src/storage/service.ts` 1029-1032

## Status and Monitoring

The StorageService provides comprehensive status monitoring for pieces, including proof timing and retrieval information.

### Status Calculation Components

**`pieceStatus()` Components:**
- `asCommP()` validation

**Parallel Operations:**
- `PDPServer.findPiece()` → `exists: boolean`, `retrievalUrl: string | null`, `rootId: number | undefined`
- `PDPServer.getProofSet()` → Proof set information
- `payments.getCurrentEpoch()` → Current blockchain state

**Proof Timing Logic:**
- `nextChallengeEpoch` from proof set
- `challengeWindow` from Pandora
- `maxProvingPeriod` from Pandora
- Calculate: `calculateLastProofDate()`, `epochToDate()`, `timeUntilEpoch()`

**Status Fields:**
- `inChallengeWindow: boolean`
- `isProofOverdue: boolean`
- `hoursUntilChallengeWindow: number`
- `proofSetLastProven: Date | null`
- `proofSetNextProofDue: Date | null`

### Status Information Provided

- **Piece existence:** Whether the piece is stored on the provider
- **Retrieval URL:** Direct URL for downloading the piece
- **Root ID:** The piece's identifier within the proof set
- **Proof timing:** Challenge windows, deadlines, and proof status
- **Health indicators:** Whether proofs are current or overdue

**Sources:** `src/storage/service.ts` 1046-1159, `src/test/storage.test.ts` 2375-2670

## Error Handling and Validation

The StorageService implements comprehensive error handling with specific error types and recovery mechanisms.

| Error Category | Validation/Handling | Methods |
|----------------|-------------------|---------|
| **Size Validation** | 65-byte minimum, 200 MiB maximum | `validateRawSize()` |
| **Provider Selection** | Ping validation, approval status | `selectProviderWithPing()` |
| **Upload Failures** | Piece parking timeout, root addition failures | `upload()` |
| **Transaction Tracking** | Propagation timeout, confirmation failures | Transaction retry logic |
| **Proof Set Consistency** | Ownership validation, parameter conflicts | `validateProofSetConsistency()` |

### Timeout Configuration

- **Piece parking:** `TIMING_CONSTANTS.PIECE_PARKING_TIMEOUT_MS`
- **Transaction propagation:** `TIMING_CONSTANTS.TRANSACTION_PROPAGATION_TIMEOUT_MS`
- **Root addition verification:** `TIMING_CONSTANTS.ROOT_ADDITION_TIMEOUT_MS`
- **Proof set creation:** `TIMING_CONSTANTS.PROOF_SET_CREATION_TIMEOUT_MS`

All errors are wrapped using the `createError()` utility function with consistent error message formatting and context preservation.

**Sources:** `src/storage/service.ts` 53-76, `src/storage/service.ts` 220-250, `src/storage/service.ts` 438-468

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/4.1-storageservice*