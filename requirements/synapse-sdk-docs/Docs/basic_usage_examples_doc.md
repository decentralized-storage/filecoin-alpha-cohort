# Basic Usage Examples

## Relevant source files

This page demonstrates common usage patterns for the Synapse SDK through practical examples. It covers the essential workflows developers need to implement when building applications that interact with Filecoin storage services.

For detailed configuration options, see Configuration Options. For architectural details about the core classes, see Core Architecture.

## Overview of Basic Workflows

The Synapse SDK follows a straightforward pattern for most storage operations:

### Basic Workflow Flow
1. **User Application** → **Synapse.create()**
2. **synapse.payments.*** → **PaymentsService Instance**
   - USDFC Token Operations
   - Service Approvals
3. **synapse.createStorage()** → **StorageService Instance**
   - Provider Selection
   - Proof Set Management
4. **storage.upload()**
5. **synapse.download()**

**Sources**: `README.md` 58-90, `utils/example-storage-e2e.js` 58-254

## Initial Setup Examples

### Simple Private Key Setup

The most straightforward way to initialize the SDK uses a private key and RPC endpoint:

```javascript
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk'

const synapse = await Synapse.create({
 privateKey: '0x...',
 rpcURL: RPC_URLS.calibration.websocket
})
```

### Browser Provider Setup

For browser applications using MetaMask or similar wallets:

```javascript
import { Synapse } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

const provider = new ethers.BrowserProvider(window.ethereum)
const synapse = await Synapse.create({ provider })
```

### Network Detection and Validation

The SDK automatically detects the network and validates it supports only Filecoin mainnet (314) and calibration testnet (314159):

#### Network Validation Flow
1. **Synapse.create()** → **Network Detection** → **Chain ID Check**
2. **Chain ID outcomes**:
   - **314** → Mainnet Config → `CONTRACT_ADDRESSES.mainnet`
   - **314159** → Calibration Config → `CONTRACT_ADDRESSES.calibration`
   - **Other** → Error: Unsupported Network

**Sources**: `src/synapse.ts`, `src/utils/constants.ts`

## Payment Setup Examples

### Basic USDFC Operations

Before using storage services, users must deposit USDFC tokens and approve service operations:

```javascript
import { TOKENS, CONTRACT_ADDRESSES } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

// Check current balances
const filBalance = await synapse.payments.walletBalance()
const usdfcBalance = await synapse.payments.walletBalance(TOKENS.USDFC)

// Deposit USDFC tokens
const depositAmount = ethers.parseUnits('100', 18)
const depositTx = await synapse.payments.deposit(depositAmount, TOKENS.USDFC)
await depositTx.wait()

// Check payments contract balance
const contractBalance = await synapse.payments.balance()
```

### Service Approval Workflow

Storage operations require approving the Pandora service as an operator:

```javascript
const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[synapse.getNetwork()]

// Approve service with rate and lockup allowances
const approvalTx = await synapse.payments.approveService(
 pandoraAddress,
 ethers.parseUnits('10', 18), // Rate allowance: 10 USDFC per epoch
 ethers.parseUnits('1000', 18) // Lockup allowance: 1000 USDFC total
)
await approvalTx.wait()

// Check approval status
const status = await synapse.payments.serviceApproval(pandoraAddress)
console.log('Service approved:', status.isApproved)
```

### Payment Setup Sequence

The payment setup follows this interaction pattern:

1. **Application** → **PaymentsService**: `deposit(amount, TOKENS.USDFC)`
2. **PaymentsService** → **USDFC Token**: `approve(paymentsContract, amount)`
3. **PaymentsService** → **Payments Contract**: `deposit(amount, token)`
4. **Payments Contract** → **PaymentsService**: Funds available
5. **Application** → **PaymentsService**: `approveService(pandora, rate, lockup)`
6. **PaymentsService** → **Payments Contract**: `approveService(pandora, rate, lockup)`
7. **Payments Contract** → **PaymentsService**: Service approved

**Sources**: `README.md` 94-113, `src/payments/service.ts`

## Storage Operations Examples

### Creating a Storage Service

The `createStorage()` method handles provider selection and proof set management automatically:

```javascript
const storage = await synapse.createStorage({
 providerId: 1, // Optional: specific provider
 withCDN: true, // Optional: enable CDN support
 callbacks: {
 onProviderSelected: (provider) => {
 console.log(`Selected provider: ${provider.owner}`)
 },
 onProofSetResolved: (info) => {
 console.log(`Proof set ID: ${info.proofSetId}`)
 }
 }
})
```

### Upload and Download Operations

Basic file operations with the storage service:

```javascript
// Upload data
const data = new TextEncoder().encode('Hello Filecoin!')
const uploadResult = await storage.upload(data, {
 onUploadComplete: (commp) => {
 console.log(`Upload complete! CommP: ${commp}`)
 },
 onRootAdded: (transaction) => {
 if (transaction) {
 console.log(`Transaction: ${transaction.hash}`)
 }
 }
})

// Download from this provider
const downloaded = await storage.providerDownload(uploadResult.commp)

// Download from any provider
const anyProvider = await synapse.download(uploadResult.commp)
```

### Storage Service Class Relationships

#### Class Structure
```
Synapse
├── +payments: PaymentsService
├── +createStorage(options): StorageService
├── +download(commp, options): Uint8Array
└── +getNetwork(): string

StorageService
├── +proofSetId: number
├── +storageProvider: string
├── +upload(data, callbacks): UploadResult
├── +providerDownload(commp): Uint8Array
├── +preflightUpload(size): PreflightResult
└── +pieceStatus(commp): PieceStatus

PandoraService
├── +calculateStorageCost(size): StorageCost
├── +checkAllowanceForStorage(size): AllowanceCheck
└── +prepareStorageUpload(options): PrepResult

PDPServer
├── +createProofSet(dataSetId, payee, withCDN): CreateResult
├── +addRoots(proofSetId, dataSetId, rootId, roots): AddResult
├── +uploadPiece(data, filename): PieceResult
└── +downloadPiece(commp): Uint8Array
```

**Relationships**:
- Synapse **creates** StorageService
- StorageService **uses** PandoraService
- StorageService **communicates with** PDPServer

**Sources**: `src/synapse.ts`, `src/storage/service.ts`, `src/pandora/service.ts`, `src/pdp/server.ts`

## Advanced Usage Patterns

### Preflight Upload Checks

Before uploading, check if the operation will succeed:

```javascript
const preflight = await storage.preflightUpload(fileData.length)

if (!preflight.allowanceCheck.sufficient) {
 console.error(`Insufficient allowances: ${preflight.allowanceCheck.message}`)
 // Handle insufficient funds/approvals
} else {
 console.log('Estimated costs:')
 console.log(`Per epoch: ${preflight.estimatedCost.perEpoch}`)
 console.log(`Per month: ${preflight.estimatedCost.perMonth}`)
}
```

### Provider Information and Status

Get detailed information about storage providers and piece status:

```javascript
// Get provider details
const providerInfo = await storage.getProviderInfo()
console.log(`PDP URL: ${providerInfo.pdpUrl}`)
console.log(`Retrieval URL: ${providerInfo.pieceRetrievalUrl}`)

// Check piece status
const status = await storage.pieceStatus(uploadResult.commp)
console.log(`Piece exists: ${status.exists}`)
console.log(`Last proven: ${status.proofSetLastProven}`)
console.log(`Next proof due: ${status.proofSetNextProofDue}`)

// Get proof set roots
const rootCids = await storage.getProofSetRoots()
console.log(`Proof set contains ${rootCids.length} root CIDs`)
```

### Error Handling Patterns

The SDK uses descriptive error messages with proper error chaining:

```javascript
try {
 const storage = await synapse.createStorage()
 const result = await storage.upload(data)
} catch (error) {
 console.error(error.message) // Clear error description
 if (error.cause) {
 console.error(error.cause) // Underlying error details
 }
}
```

## Complete Upload-Download Flow

The complete workflow involves these interactions:

1. **Application** → **Synapse**: `createStorage(options)`
2. **Synapse** → **StorageService**: select provider & proof set
3. **Synapse** → **Application**: StorageService instance
4. **Application** → **StorageService**: `upload(data, callbacks)`
5. **StorageService** → **PDPServer**: `uploadPiece(data)`
6. **StorageService** → **PandoraService**: `addRoots(proofSetId, roots)`
7. **PandoraService** → **Blockchain**: transaction confirmation

This sequence demonstrates how the SDK orchestrates complex operations across multiple services and external systems to provide a simple developer interface.

---

*Document source: FilOzone/synapse-sdk Basic Usage Examples Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/2.2-basic-usage-examples*  
*Generated on: August 26, 2025*