# PDP (Proof of Data Possession)

## Relevant Source Files

The PDP (Proof of Data Possession) system provides cryptographic authentication and server communication components for proving data possession in the Synapse storage marketplace. This system enables clients to authenticate with storage providers, manage proof sets, and verify data integrity through smart contract interactions.

For information about the higher-level storage operations that use PDP, see **StorageService**.  
For details about data validation and testing utilities, see **Data Validation and PDP Testing**.

## Core Components

The PDP system consists of three main components that work together to provide authenticated storage provider interactions:

### PDP System Components

**Core Components:**
- **PDPAuthHelper** - EIP-712 Signature Generation
- **PDPServer** - HTTP API Operations  
- **PDPVerifier** - Smart Contract Interactions

**External Systems:**
- **Curio Storage Provider** - PDP Server Implementation
- **Pandora Contract** - Business Logic
- **PDP Verifier Contract** - On-chain Verification

### Retrieval Strategy Hierarchy

**Client Application**
↓
**Retrieval Chain**
- **FilCdnRetriever** (CDN Optimization Layer)
- **ChainRetriever** (Provider Discovery & Fetching)
- **Child PieceRetriever** (Optional Fallback)

**Data Sources:**
- **FilCDN Network**: `filcdn.io` / `calibration.filcdn.io`
- **Storage Providers**: Storage Provider 1-N (Curio Nodes)

**Flow Control:**
- `withCDN=true` → CDN failure → All providers fail

**Sources:** `src/pdp/index.ts` 1-25, `src/pdp/auth.ts` 71-577, `src/pdp/server.ts` 116-631

## PDPAuthHelper

The **PDPAuthHelper** class generates EIP-712 typed signatures for authenticating PDP operations with storage providers. It supports both browser-based signers (MetaMask) and private key signers.

| Method | Purpose | Returns |
|--------|---------|---------|
| `signCreateProofSet()` | Authorize proof set creation | `AuthSignature` |
| `signAddRoots()` | Authorize adding data roots | `AuthSignature` |
| `signScheduleRemovals()` | Authorize root removal scheduling | `AuthSignature` |
| `signDeleteProofSet()` | Authorize proof set deletion | `AuthSignature` |

**Sources:** `src/pdp/auth.ts` 70-577

## PDPServer

The **PDPServer** class provides HTTP API operations for interacting with Curio storage providers. It handles proof set management, piece uploads/downloads, and status checking.

| Method Category | Methods | Purpose |
|----------------|---------|---------|
| **Proof Set Management** | `createProofSet()`, `addRoots()`, `getProofSet()` | Manage proof sets and roots |
| **Piece Operations** | `uploadPiece()`, `downloadPiece()`, `findPiece()` | Handle piece data |
| **Status Operations** | `getProofSetCreationStatus()`, `getRootAdditionStatus()` | Check operation status |
| **Utility** | `ping()` | Test provider connectivity |

**Sources:** `src/pdp/server.ts` 116-631

## Authentication Flow with EIP-712 Signatures

The PDP system uses EIP-712 typed data signatures to authenticate operations with storage providers. This provides better security and user experience compared to raw message signing.

### EIP-712 Type Definitions

The authentication system uses structured EIP-712 types for each operation:

```javascript
// From PDPAuthHelper
const EIP712_TYPES = {
  CreateProofSet: [
    { name: 'clientDataSetId', type: 'uint256' },
    { name: 'withCDN', type: 'bool' },
    { name: 'payee', type: 'address' }
  ],
  AddRoots: [
    { name: 'clientDataSetId', type: 'uint256' },
    { name: 'firstAdded', type: 'uint256' },
    { name: 'rootData', type: 'RootData[]' }
  ],
  RootData: [
    { name: 'root', type: 'Cid' },
    { name: 'rawSize', type: 'uint256' }
  ]
}
```

### Proof Set Creation Flow

**Sequence:**
1. Client → PDPAuthHelper: `signCreateProofSet(clientDataSetId, payee, withCDN)`
2. PDPAuthHelper: `buildEIP712TypedData()`
3. PDPAuthHelper → Wallet/Signer: `signTypedData(domain, types, value)`
4. Wallet/Signer → PDPAuthHelper: `signature`
5. PDPAuthHelper → Client: `AuthSignature{signature, v, r, s, signedData}`
6. Client → PDPServer: `createProofSet(clientDataSetId, payee, withCDN, recordKeeper)`
7. PDPServer: `signCreateProofSet()` → `AuthSignature`
8. PDPServer: `_encodeProofSetCreateData(metadata, payer, withCDN, signature)`
9. PDPServer → Curio Provider: `POST /pdp/proof-sets {recordKeeper, extraData}`
10. Curio Provider: `addRoots(extraData=signature)`
11. Curio Provider → Smart Contract: `validateSignature()`
12. Smart Contract → Curio Provider: callback with validation result
13. Curio Provider → PDPServer: Location header with txHash
14. PDPServer → Client: `{txHash, statusUrl}`

**Sources:** `src/pdp/auth.ts` 235-296, `src/pdp/server.ts` 155-213, `src/pdp/server.ts` 557-580

## Server Operations

### Proof Set Management

Proof sets are collections of data roots that undergo PDP challenges. The system provides comprehensive proof set lifecycle management:

**State Transitions:**
- **Creating** → `createProofSet()` → **Created** (`proofSetCreated=true`)
- **Creating** → **Failed** (`txStatus=failed`)
- **Created** → `addRoots()` → **AddingRoots**
- **AddingRoots** → **RootsAdded** (`addMessageOk=true`)
- **AddingRoots** → **RootsFailed** (`addMessageOk=false`)
- **RootsAdded** → `addRoots()` (more data) → **AddingRoots**
- **Any State** → `signScheduleRemovals()` → **Scheduling** → removals scheduled
- **Any State** → `signDeleteProofSet()` → **Deleting** → proof set deleted

**Sources:** `src/pdp/server.ts` 155-213, `src/pdp/server.ts` 233-321, `src/pdp/server.ts` 328-347

### Proof Set Creation

The `createProofSet()` method initiates a new proof set on the storage provider:

1. Generates EIP-712 signature via `PDPAuthHelper.signCreateProofSet()`
2. Encodes signature and metadata into `extraData` using `_encodeProofSetCreateData()`
3. Sends POST request to `/pdp/proof-sets` endpoint
4. Returns transaction hash and status URL from Location header

**Sources:** `src/pdp/server.ts` 155-213

### Adding Roots

The `addRoots()` method adds data roots to an existing proof set:

1. Validates all CommP CIDs using `asCommP()`
2. Generates EIP-712 signature via `PDPAuthHelper.signAddRoots()`
3. Encodes signature into `extraData` using `_encodeAddRootsExtraData()`
4. Formats roots with subroots (each root is its own subroot)
5. Sends POST request to `/pdp/proof-sets/{id}/roots`

**Sources:** `src/pdp/server.ts` 233-321, `src/pdp/server.ts` 585-602

## Piece Operations

### Upload Process

The piece upload process follows a two-phase protocol:

**Sequence:**
1. Client → PDPServer: `uploadPiece(data)`
2. PDPServer: `calculateCommP(data)`
3. PDPServer: `createCheckData{name, hash, size}`
4. PDPServer → Curio Provider: `POST /pdp/piece {check}`
5. **Decision Point:**
   - **If piece already exists:** Curio Provider → PDPServer: `200 OK` → `{commP, size}`
   - **If create new upload session:** Curio Provider → PDPServer: `201 Created + Location header`
6. **For new upload:**
   - PDPServer: `extractUploadUuid(location)`
   - PDPServer → Curio Provider: `PUT /pdp/piece/upload/{uuid}` (data)
   - Curio Provider → PDPServer: `204 No Content`
   - PDPServer → Client: `{commP, size}`

**Sources:** `src/pdp/server.ts` 417-499

### Download and Validation

The download process includes automatic CommP verification:

**Sequence:**
1. Client → PDPServer: `downloadPiece(commP)`
2. PDPServer: `asCommP(commP)` validation
3. PDPServer → Piece Utils: `constructPieceUrl(retrievalEndpoint, commP)`
4. Piece Utils → PDPServer: `downloadUrl`
5. PDPServer → Storage Provider: `GET downloadUrl`
6. Storage Provider → PDPServer: Response stream
7. PDPServer: `downloadAndValidateCommP(response, expectedCommP)`
8. PDPServer → Client: `Uint8Array data`

**Sources:** `src/pdp/server.ts` 505-521, `src/utils/piece.ts` 17-21

## Status Monitoring and Validation

### Status Response Types

The system provides detailed status information for asynchronous operations:

| Response Type | Purpose | Key Fields |
|---------------|---------|------------|
| `ProofSetCreationStatusResponse` | Track proof set creation | `proofSetCreated`, `txStatus`, `proofSetId` |
| `RootAdditionStatusResponse` | Track root additions | `addMessageOk`, `confirmedRootIds`, `rootCount` |
| `FindPieceResponse` | Piece discovery results | `pieceCid`, `piece_cid` (legacy) |

**Sources:** `src/pdp/server.ts` 48-114

### Response Validation

All server responses undergo validation using dedicated validation functions:

**Validation Process:**
- Raw JSON Response → `validateXxxResponse()` → Typed Response Object
- **Validation Functions:**
  - `validateProofSetCreationStatus()`
  - `validateRootAdditionStatus()`
  - `validateFindPieceResponse()`
  - `asProofSetData()`
- **Error Handling:** Validation Error

**Sources:** `src/pdp/validation.ts`, `src/pdp/server.ts` 346, `src/pdp/server.ts` 379, `src/pdp/server.ts` 410, `src/pdp/server.ts` 546-550

## Error Handling and Connectivity

### Provider Connectivity

The `ping()` method provides basic connectivity testing:

```javascript
async ping(): Promise<void> {
  const response = await fetch(`${this._apiEndpoint}/pdp/ping`)
  if (response.status !== 200) {
    throw new Error(`Provider ping failed: ${response.status}`)
  }
}
```

**Sources:** `src/pdp/server.ts` 609-619

### Error Response Handling

All server methods follow consistent error handling patterns:

1. Check HTTP status codes
2. Extract error text from response body
3. Throw descriptive errors with status codes and server messages
4. Handle missing headers gracefully (backward compatibility)

**Sources:** `src/pdp/server.ts` 189-193, `src/pdp/server.ts` 291-294, `src/pdp/server.ts` 341-343

## Integration Points

The PDP system integrates with several other SDK components to provide a complete storage and verification solution within the broader Synapse ecosystem.

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/4.2-pdp-(proof-of-data-possession)*