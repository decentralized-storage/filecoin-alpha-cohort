# Storage System

## Relevant source files

The Storage System is the core component responsible for managing data upload, download, and proof operations within the Synapse SDK. It orchestrates interactions between clients, storage providers (Curio nodes), and the blockchain through a comprehensive Proof of Data Possession (PDP) system.

This document covers the complete storage workflow including provider selection, proof set management, data validation, and retrieval mechanisms. For payment-related storage operations, see Service Approvals and Allowances. For storage provider management from the Pandora contract perspective, see Storage Provider Management.

## Architecture Overview

The Storage System follows a layered architecture with clear separation between client-facing APIs, service orchestration, and provider communication:

### Storage System Architecture

- **Client Layer**: Synapse
- **Orchestration Layer**: StorageService
  - StorageService Implementation
  - Provider Selection Logic
  - Proof Set Management
- **Communication Layer**: 
  - PDPServer
  - PDPAuthHelper
  - PieceRetriever
- **Storage Provider Layer**: Curio Storage Node
  - `/pdp/proof-sets`
  - `/pdp/piece`
  - `/piece/{commp}`
- **Blockchain Layer**: 
  - PDPVerifier Contract
  - Pandora Contract

**Sources**: `src/storage/service.ts` 1-112, `src/pdp/server.ts` 1-40, `README.md` 58-130

## Core Components

The Storage System consists of several interconnected components that handle different aspects of data storage and retrieval:

### Component Interaction Diagram

**Core Functions**:
- **StorageService Core**: `createProofSet()`, `addRoots()`, `uploadPiece()`, `downloadPiece()`, `findPiece()`
- **PDPServer**: `validateRawSize()`, `resolveProviderAndProofSet()`
- **PDPAuthHelper**: `signCreateProofSet()`, `signAddRoots()`
- **piece.ts**: `constructPieceUrl()`, `constructFindPieceUrl()`
- **commp/index.ts**: `calculate()`, `downloadAndValidateCom()`, `asCommP()`

**Sources**: `src/storage/service.ts` 33-112, `src/pdp/server.ts` 116-631, `src/utils/piece.ts` 1-43

## Upload Workflow

The upload process involves multiple stages including validation, provider communication, and blockchain confirmation:

### Upload Sequence Diagram

The upload workflow follows this sequence:

1. **Client** → **StorageService**: `upload(data)`
2. **StorageService**: `validateRawSize(data.length)`
3. **StorageService** → **PDPServer**: `uploadPiece(data)`
4. **PDPServer**: `calculateCommP(data)`
5. **PDPServer** → **CurioNode**: `POST /pdp/piece`
6. **CurioNode** → **PDPServer**: `201 Created + Location`
7. **PDPServer** → **CurioNode**: `PUT /pdp/piece/upload/{uuid}`
8. **CurioNode** → **PDPServer**: `204 No Content`
9. **PDPServer** → **StorageService**: `{commP, size}`

### Wait for piece to be "parked"

**Loop**: Polling for piece ready
- **StorageService** → **PDPServer**: `findPiece(commP, size)`
- **PDPServer** → **CurioNode**: `GET /pdp/piece?name=...&hash=...`
- **Alternative outcomes**:
  - `200 OK + piece data` (piece found)
  - `404 Not Found` (piece not found - retry)

### Add to proof set

10. **StorageService**: `onUploadComplete(commP)`
11. **StorageService**: `getAddRootsInfo(proofSetId)`
12. **StorageService** → **PDPServer**: `addRoots(proofSetId, dataSetId, nextRootId, rootData)`
13. **PDPAuthHelper**: `signAddRoots(dataSetId, nextRootId, rootData)`
14. **PDPServer** → **PDPVerifier**: `POST /pdp/proof-sets/{id}/roots`
15. **PDPVerifier**: `addRoots(extraData=signature)`
16. **PDPVerifier**: callback with signature validation
17. **PDPVerifier** → **PDPServer**: `201 Created + Location + txHash`
18. **PDPServer** → **StorageService**: `{message, txHash, statusUrl}`

### Transaction confirmation

19. **StorageService**: wait for transaction confirmation
20. **StorageService**: `getRootAdditionStatus(proofSetId, txHash)`
21. **StorageService**: `{txStatus, confirmedRootIds}`
22. **StorageService**: `onRootConfirmed(rootIds)`
23. **StorageService** → **Client**: `201 Created {message}`
24. **StorageService**: `onRootAdded()`
25. **Final result**: `{commP, size, rootId}`

**Sources**: `src/storage/service.ts` 781-992, `src/pdp/server.ts` 418-551, `README.md` 362-395

## Download and Retrieval

The download system supports multiple retrieval strategies including provider-specific downloads and multi-provider fallback:

### Download Strategies

The system provides multiple download entry points:

#### Download Entry Points
- `Synapse.download()`
- `StorageService.providerDo()`
- `PDPServer.downloadPiece()`

#### Retrieval Chain
The `PieceRetriever` component manages the retrieval process through:

1. **Subgraph Provider Discovery**
2. **CDN Retrieval** or **Direct Provider Retrieval**

#### URL Construction
- `constructPieceUrl()` generates URLs in the format: `{retrievalEndpoint}/piece/{commP}`

#### Validation
- `downloadAndValidateCommP()` performs CommP verification to ensure data integrity

**Sources**: `src/storage/service.ts` 1000-1015, `src/pdp/server.ts` 506-521, `src/utils/piece.ts` 18-21

## Provider Selection

The `StorageService` implements sophisticated provider selection logic that balances performance, availability, and user preferences:

### Provider Resolution Process

The selection process prioritizes options in this order:

1. **Explicit proof set ID** - Direct specification via `StorageServiceOptions.proofSetId`
2. **Explicit provider ID** - Provider selection via `StorageServiceOptions.providerId`
3. **Explicit provider address** - Provider selection via `StorageServiceOptions.providerAddress`
4. **Smart selection** - Automatic selection based on existing proof sets and provider availability

### Resolution Strategies

The system uses these resolution methods:
- `resolveByProofSetId()`
- `resolveByProviderId()`
- `resolveByProviderAddress()`
- `smartSelectProvider()`

### Smart Selection Logic
- Check existing proof sets
- `selectProviderWithPing()`
- `selectRandomProvider()`
- Sort by preference (roots first)

### Provider Data Sources
- `PandoraService.getAllApprovedProviders()`
- `getClientProofSetsWithDetails()`
- `getApprovedProvider()`
- `PDPServer.ping()`

**Sources**: `src/storage/service.ts` 335-383, `src/storage/service.ts` 562-653, `src/storage/service.ts` 715-746

## Proof Set Management

Proof sets are the fundamental unit for organizing data within the PDP system. They represent collections of data pieces that are proven together.

### Proof Set Lifecycle

The proof set lifecycle follows these states:

1. **Resolving** - `StorageService.create()`
2. **ExistingFound** - Existing proof set found → Proof set validated → **Ready**
3. **CreatingNew** - No suitable proof set exists → `PDPServer.createProofSet()`
4. **WaitingForTx** - Transaction found on chain
5. **WaitingForConfirmation** - Transaction confirmed
6. **WaitingForLive** - Proof set marked as live → **Ready**

### Storage Operations Flow

Once in **Ready** state:
7. **AddingRoots** - `StorageService.upload()` → `PDPServer.addRoots()`
8. **WaitingForRootTx** - Root addition transaction
9. **WaitingForRootConfirm** - Root confirmed
10. **Complete** - Storage operations complete

### Error States
- **Creation failed** - Transaction timeout → Confirmation timeout
- **Proof set not live** - Returns to error handling

**Sources**: `src/storage/service.ts` 176-329, `src/pdp/server.ts` 156-213

## Data Validation

The Storage System implements comprehensive data validation at multiple levels:

### Validation Layers

| Validation Type | Location | Purpose | Implementation |
|---|---|---|---|
| **Size Validation** | `StorageService.validateRawSize()` | Enforce upload size limits | `src/storage/service.ts` 53-76 |
| **CommP Validation** | `asCommP()` utility | Validate piece commitments | Referenced in upload/download flows |
| **Content Validation** | `downloadAndValidateCommP()` | Verify downloaded data integrity | Used in all download operations |
| **PDP Response Validation** | `validateProofSetCreationStatusResponse()` | Validate server responses | `src/pdp/server.ts` 346 |
| **URL Construction** | `constructFindPieceUrl()` | Ensure proper API formatting | `src/utils/piece.ts` 30-42 |

---

*Document source: FilOzone/synapse-sdk Storage System Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/4-storage-system*  
*Generated on: August 26, 2025*