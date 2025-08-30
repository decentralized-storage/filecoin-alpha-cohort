# Type System

## Relevant source files

The Type System defines the core TypeScript interfaces, types, and data structures that form the foundation of the Synapse SDK. This comprehensive type system ensures type safety across all SDK operations including storage, payments, proof management, and provider interactions.

For information about the concrete class implementations that use these types, see Synapse Class and Service Architecture. For details about storage-specific operations, see StorageService.

## Basic Type Aliases

The SDK defines several fundamental type aliases that provide semantic meaning and type safety throughout the codebase:

| Type Alias | Underlying Type | Purpose |
|---|---|---|
| **PrivateKey** | `string` | Ethereum private key for signing |
| **Address** | `string` | Ethereum addresses |
| **TokenAmount** | `number \| bigint` | Token quantities with flexible precision |
| **ProofSetId** | `string` | Unique identifiers for proof sets |
| **StorageProvider** | `string` | Storage provider identifiers |

Additional specialized types include `FilecoinNetworkType` for network selection (`'mainnet' | 'calibration'`) and `TokenIdentifier` for balance queries (`'USDFC' | string`).

**Sources**: `src/types.ts` 13-27

## Configuration Type Hierarchy

The SDK's configuration system is built around several key interfaces that control initialization and operation:

### Authentication Options

The `SynapseOptions` interface supports three authentication modes:

1. **Private key with RPC URL** - for server environments
2. **ethers Provider** - for browser environments  
3. **Direct Signer integration** - for advanced use cases

### Configuration Structure

```
SynapseOptions (Main SDK Configuration)
├── Authentication Options
│   ├── privateKey + rpcURL
│   ├── provider: ethers.Provider
│   └── signer: ethers.Signer
├── Service Overrides
│   ├── pieceRetriever: PieceRetriever
│   ├── subgraphService: SubgraphRetrievalService
│   └── subgraphConfig: SubgraphConfig
└── Storage Configuration
    ├── StorageOptions (Basic Storage Config)
    ├── StorageServiceOptions (Advanced Storage Config)
    └── DownloadOptions (Download Configuration)
        ├── proofSetId?: ProofSetId
        ├── storageProvider?: StorageProvider
        ├── withCDN?: boolean
        └── callbacks?: StorageCreationCallbacks
```

**Sources**: `src/types.ts` 36-59, `src/types.ts` 64-69, `src/types.ts` 288-299

## Service Interface Contracts

The SDK defines several critical interfaces that enable modularity and extensibility:

### Core Service Interfaces

#### PieceRetriever Interface
- **Method**: `fetchPiece()`
- **Signature**: `fetchPiece(commp, client, options) → Promise<Response>`
- **Parameters**:
  - `commp: CommP`
  - `client: string`
  - `options?: { providerAddress?: string, withCDN?: boolean, signal?: AbortSignal }`

#### SubgraphRetrievalService Interface
- **Methods**:
  - `getApprovedProvidersForCommP()`
  - `getProviderByAddress(address) → Promise<ApprovedProvider>`
- **Parameters**:
  - `address: string`

The `PieceRetriever` interface abstracts data retrieval mechanisms, returning Web API Response objects for flexibility. The `SubgraphRetrievalService` interface enables custom provider discovery implementations.

**Sources**: `src/types.ts` 96-113, `src/types.ts` 143-159

## Data Structure Types

The SDK's data structures represent the core entities in the Filecoin storage ecosystem:

### Authentication & Authorization
```typescript
AuthSignature {
  signature: string
  v: number
  r: string
  s: string
  signedData: string
}
```

### Storage Data Structures
```typescript
RootData {
  cid: CommP | string
  rawSize: number
}

ProofSetInfo {
  railId: number
  payer: string
  payee: string
  commissionBps: number
  metadata: string
  rootMetadata: string[]
  clientDataSetId: number
  withCDN: boolean
}

EnhancedProofSetInfo extends ProofSetInfo {
  pdpVerifierProofSetId: number
  nextRootId: number
  currentRootCount: number
  isLive: boolean
  isManaged: boolean
}
```

### Provider Information
```typescript
ApprovedProviderInfo {
  owner: string
  pdpUrl: string
  pieceRetrievalUrl: string
  registeredAt: number
  approvedAt: number
}
```

### Operation Results
```typescript
UploadResult {
  commp: CommP
  size: number
  rootId?: number
}

PieceStatus {
  exists: boolean
  proofSetLastProven: Date | null
  proofSetNextProofDue: Date | null
  retrievalUrl: string | null
  rootId?: number
  inChallengeWindow?: boolean
  hoursUntilChallengeWindow?: number
}
```

### Task Tracking
```typescript
UploadTask {
  commp(): Promise<CommP>
  store(): Promise<StorageProvider>
  done(): Promise<string>
}
```

These structures represent different aspects of the storage system: authentication data for EIP-712 signatures, storage metadata and proof set information, provider details from subgraph queries, and operation results with status information.

**Sources**: `src/types.ts` 164-175, `src/types.ts` 179-185, `src/types.ts` 189-223, `src/types.ts` 228-239, `src/types.ts` 337-344, `src/types.ts` 447-464

## Callback Interface System

The SDK provides extensive callback interfaces for tracking asynchronous operations:

### Upload Progress Flow
```typescript
UploadCallbacks {
  onUploadComplete?(commp: CommP)
  onRootAdded?(transaction?: ethers.TransactionResponse)
  onRootConfirmed?(rootIds: number[])
}
```

### Storage Creation Flow
```typescript
StorageCreationCallbacks {
  onProviderSelected?(provider: ApprovedProviderInfo)
  onProofSetResolved?(info: {isExisting, proofSetId, provider})
  onProofSetCreationStarted?()
  onProofSetCreationProgress?(status: {transactionMined, ...})
}
```

The callback system provides granular tracking of storage operations, from provider selection through proof set creation to upload completion and blockchain confirmation.

**Sources**: `src/types.ts` 244-283, `src/types.ts` 325-332, `src/types.ts` 74-81

## Comprehensive Information Types

The SDK includes several comprehensive information structures that aggregate data from multiple sources:

| Type | Purpose | Key Components |
|---|---|---|
| **StorageInfo** | Complete storage service information | Pricing data, provider list, service parameters, user allowances |
| **PreflightInfo** | Pre-upload validation data | Cost estimates, allowance checks, provider/proof set selection |
| **ProofSetData** | API response structure | Proof set ID, root data array, challenge timing |
| **SubgraphConfig** | Subgraph connection configuration | Direct endpoint or Goldsky configuration with API key |

The `StorageInfo` type provides a complete view of the storage ecosystem, including pricing tiers for CDN and non-CDN storage, approved provider lists, network parameters like epoch durations, and current user allowance status.

**Sources**: `src/types.ts` 349-414, `src/types.ts` 304-320, `src/types.ts` 419-440, `src/types.ts` 119-130

## Type Import and Export Structure

The type system is centralized in `src/types.ts` with selective re-exports of key types like `CommP` from the commp module. This approach provides a single source of truth for type definitions while maintaining module boundaries and preventing circular dependencies.

The file imports only essential external types (`ethers` interfaces) and internal types (`CommP`), keeping the type definitions lightweight and focused on data structure contracts rather than implementation details.

**Sources**: `src/types.ts` 8-12

---

*Document source: FilOzone/synapse-sdk Type System Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/3.2-type-system*  
*Generated on: August 26, 2025*