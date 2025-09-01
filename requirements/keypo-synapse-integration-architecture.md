# Keypo-Synapse Integration Architecture

## Overview

This document outlines the architecture for integrating Keypo's encryption SDK into the Synapse SDK to enable private data storage on Filecoin. The integration follows a "wrapper" pattern where Keypo handles encryption/decryption at the boundaries while maintaining minimal changes to Synapse's core functionality.

**NOTE**: This is our first iteration of what an implementation will look like. We expect this to change as we start building. 

## Design Principles

1. **Minimal Synapse Changes**: Keypo integration should require minimal modifications to existing Synapse SDK architecture
2. **Boundary Encryption**: Keypo operates at the beginning (encryption) and end (decryption) of workflows
3. **Composable Architecture**: Both SDKs maintain their independent functionality while enabling seamless integration
4. **Workflow Preservation**: Existing Synapse workflows continue to work unchanged for unencrypted data

## Integration Patterns

### Wrapper Functions

Create high-level wrapper functions that combine Keypo and Synapse operations:

```typescript
// New wrapper functions in Synapse SDK integration layer
// These use commp as the primary identifier (Synapse-centric approach)
async function uploadEncrypted(data, options?: { name: string })
async function downloadDecrypted(commp: string)
async function shareData(commp: string, recipientAddresses: string[])  // Looks up dataIdentifier via subgraph
async function deleteData(commp: string)  // Looks up dataIdentifier via subgraph
async function searchData(searchTerm: string) // Takes only search term, returns results with commp
```

## Core Architecture Components

### 1. Integration Layer

**Location**: New module `src/keypo/` in Synapse SDK

**Components**:
- `KeypoSynapseIntegration` - Main integration class that wraps Keypo SDK functions
- `EncryptedStorageService` - Enhanced storage service combining Keypo encryption with Synapse storage
- `KeypoDataProcessor` - Handles data transformations between Keypo and Synapse formats
- `IntegrationTypes` - TypeScript interfaces for integration

**Note**: All Keypo functionality (encrypt, decrypt, search, share, delete, deployPermissionedFileContract, mintOwnerNFT) comes from the `@keypo/typescript-sdk` package.

### 2. Wallet Compatibility Bridge

**User Interface**: Users always provide an Ethers v6 wallet (standard in Synapse SDK)

**Internal Conversions** (handled automatically):
- **Encryption/Share/Delete**: Convert Ethers v6 → Viem WalletClient
- **Decryption**: Use Ethers v6 directly (compatible with v5 requirements)

**Solution**: Simplified wallet adapter (used internally):

```typescript
// Internal wallet bridge - users never see this
class WalletBridge {
  private static readonly KERNEL_ADDRESS = '0x...' // Internal constant
  
  // Convert user's Ethers v6 wallet to Viem for encryption operations
  static toViemWallet(ethersWallet: ethers.Signer): WalletClient {
    const account = privateKeyToAccount(ethersWallet.privateKey)
    return createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    })
  }
  
  // Create authorization for Keypo operations (internal)
  static async createAuthorization(viemWallet: WalletClient): Promise<Authorization> {
    return await viemWallet.signAuthorization({
      contractAddress: this.KERNEL_ADDRESS as `0x${string}`
    })
  }
}
```

### 3. Data Flow Coordination

**Encryption Flow Coordinator**:
```typescript
class EncryptionFlowCoordinator {
  private walletBridge: WalletBridge;
  
  async executeEncryptedUpload(data: any, ethersWallet: ethers.Signer, dataName: string) {
    // Convert wallet internally for Keypo operations
    const viemWallet = WalletBridge.toViemWallet(ethersWallet);
    const authorization = await WalletBridge.createAuthorization(viemWallet);
    
    // 1. Keypo preprocessing
    const { dataOut, metadataOut } = await preProcess(data, dataName)
    
    // 2. Keypo encryption (using internally converted wallet)
    const dataIdentifier = await encrypt(dataOut, viemWallet, metadataOut, authorization)
    
    // 3. Synapse storage (dataOut is the encrypted data)
    const synapseResult = await synapse.storage.upload(dataOut)
    
    // 4. Deploy permissioned contract + mint NFT
    // This stores the dataIdentifier ↔ commp mapping on-chain
    const result = await this.deployPermissionedContract(metadataOut, dataIdentifier, synapseResult.commp)
    await this.mintOwnerNFT(result.dataContractAddress)
    
    return {
      dataIdentifier,
      commp: synapseResult.commp,
      dataContractAddress: result.dataContractAddress,
      keypoMetadata: {dataIdentifier, metadataOut},
      synapseMetadata: synapseResult
    }
  }
}
```

## Detailed Integration Workflows

This is how we will implement encryption and decryption under the hood.

### Key Identifiers
- **`commp`** (Synapse): Primary identifier used in wrapper functions - content identifier for Filecoin storage
- **`dataIdentifier`** (Keypo): Internal identifier for encrypted data operations
- **Lookup**: When operations need `dataIdentifier`, subgraph lookup using `commp` retrieves it automatically

### Commp to DataIdentifier Lookup Pattern
```typescript
// Then use Keypo's getDataInfo for additional metadata if needed
async function getDataInfoFromCommp(commp: string): Promise<DataInfo | null> {
  const dataIdentifier = await getDataIdentifierFromCommp(commp);
  if (!dataIdentifier) return null;
  
  // Use Keypo's existing getDataInfo function
  return await getDataInfo(dataIdentifier);
}
```

### 1. Encrypted Storage Workflow

#### Phase 1: Keypo Encryption
```typescript
// Import functions from unified SDK
import { preProcess, encrypt, init } from '@keypo/synapse-sdk';

// User provides Ethers v6 wallet (standard Synapse pattern)
const ethersWallet = new ethers.Wallet(privateKey, provider);

// Internal: KeypoSynapseIntegration handles Keypo initialization
// Convert to Viem wallet for Keypo encryption (hidden from user)
const viemWallet = WalletBridge.toViemWallet(ethersWallet);
const authorization = await WalletBridge.createAuthorization(viemWallet);

// Step 1: Preprocess data for encryption (Keypo SDK)
const { dataOut, metadataOut } = await preProcess(originalData, "my-data-name");

// Step 2: Encrypt data with access controls (Keypo SDK)
const dataIdentifier = await encrypt(
  dataOut,  // This gets modified in place to encrypted form
  viemWallet,
  metadataOut,
  authorization
);
```

#### Phase 2: Synapse Storage
```typescript
// Step 3: Store encrypted data via Synapse (using same Ethers v6 wallet)
const synapse = await Synapse.create({
  privateKey: ethersWallet.privateKey,
  rpcURL: RPC_URLS.calibration.websocket  // Use calibration testnet for testing
})

// Create storage service
const storage = await synapse.createStorage()

// Upload encrypted data (dataOut was encrypted in place)
const uploadResult = await storage.upload(dataOut);

// The mapping between dataIdentifier and commp will be stored on-chain
// when we deploy the permissioned contract (see next phase)
```

#### Phase 3: On-Chain Actions (Always Included)
```typescript
// Step 4: Use the same Viem wallet already created for on-chain actions
// (viemWallet and authorization were already created above for encryption)

// Step 5: Deploy permissioned file contract (always happens)
import { deployPermissionedContract } from '@keypo/synapse-sdk';
const result = await deployPermissionedContract(
  metadataOut,      // Contains name and other metadata
  dataIdentifier,   // Keypo's unique ID
  uploadResult.commp  // Synapse's storage ID - gets indexed by subgraph
)
// This stores the dataIdentifier ↔ commp mapping on-chain,
// making it queryable via Keypo's subgraph

// Step 6: Mint owner NFT (always happens)
import { mintOwnerNFT } from '@keypo/synapse-sdk';
const ownerNFT = await mintOwnerNFT(result.dataContractAddress)
```

### 2. Decryption Retrieval Workflow

#### Phase 1: Synapse Retrieval and wallet setup
```typescript
// Import search function from unified SDK
import { search } from '@keypo/synapse-sdk';

// Use search to find data by name (only takes search term)
// This queries the subgraph which indexed the smart contract data
const searchResults = await search("my-data-name");

// Search returns array of matches from the subgraph:
/*
{
  commp: string,             // Synapse commp (from smart contract)
  dataContractAddress: string, // Smart contract address managing access
  dataIdentifier: string,   // Unique identifier for the data
  dataMetadata: {           // Metadata associated with the data
    name: string,           // Human-readable name for the data
    type: string,           // The detected type of the input data
    mimeType?: string,      // The detected MIME type (present for File/Blob inputs)
    subtype?: string,       // Additional type information (e.g., 'bigint', 'base64', 'json')
    userMetaData?: string   // Any custom metadata provided during preprocessing (JSON stringified)
  },
  owner: string,            // The wallet address that owns this data
  isAccessMinted: boolean   // Whether this data was accessed through a minted permission
}
*/

const metaData = searchResults[0]; // Get first match
const commp = metaData.commp;
const dataId = metaData.dataIdentifier;

// User provides standard Ethers v6 wallet
const ethersWallet = new ethers.Wallet(privateKey, provider);
// Keypo config is handled internally by KeypoSynapseIntegration

// Step 1: Retrieve encrypted data from Synapse
const encryptedData = await synapse.download(commp)
```

#### Phase 2: Keypo Decryption
```typescript
// Import functions from unified SDK
import { decrypt, postProcess } from '@keypo/synapse-sdk';

// Step 3: Decrypt data (Keypo SDK - Ethers v6 works directly)
const { decryptedData, metadata } = await decrypt(
  dataId, 
  ethersWallet,  // Ethers v6 is compatible
  config.decryptConfig
);

// Step 4: Postprocess to original format (Keypo SDK)
const originalData = await postProcess(decryptedData, metadata)
console.log("Decrypted data:", originalData)
```

### 3. Share and Delete Workflow

```typescript
// Import functions from the unified package
import { share, deleteData } from '@keypo/synapse-sdk';

// User provides commp (Synapse identifier)
const ethersWallet = new ethers.Wallet(privateKey, provider);

// Internal: Convert to Viem for share/delete operations
const viemWallet = WalletBridge.toViemWallet(ethersWallet);
const authorization = await WalletBridge.createAuthorization(viemWallet);

// Lookup dataIdentifier from commp using subgraph (internal)
const dataIdentifier = await getDataIdentifierFromCommp(commp);
if (!dataIdentifier) {
  throw new Error(`No data found for commp: ${commp}`);
}

// Share data with another user (using Keypo SDK)
await share(dataIdentifier, recipientAddress, viemWallet, authorization);

// Delete data (using Keypo SDK)
await deleteData(dataIdentifier, viemWallet, authorization);
```

## Integration Points

### 1. Unified Package Architecture

**New Approach**: Single `@keypo/synapse-sdk` package that includes:

1. **Bundled Synapse SDK**: Synapse functionality integrated as internal dependency
2. **Keypo Encryption**: All encryption/decryption capabilities
3. **Unified Interface**: Single package with all functions (upload, download, share, delete, search)
4. **Smart Contract Integration**: Automatic contract deployment and NFT minting

**Package Structure**:
- `src/core/` - Core Keypo encryption functionality
- `src/synapse/` - Bundled Synapse SDK (internal)
- `src/contracts/` - Smart contract deployment and NFT minting
- `src/subgraph/` - Subgraph querying for data lookup
- `src/index.ts` - Unified exports (uploadEncrypted, downloadDecrypted, etc.)

### 2. Unified Package Exports

```typescript
// @keypo/synapse-sdk - Single package exports
export async function init(config: {
  wallet: ethers.Signer,
  rpcURL: string
}): Promise<void>

// Core functions (all encryption + Synapse storage included)
export async function uploadEncrypted(data: any, options?: { name: string })
export async function downloadDecrypted(commp: string)
export async function shareData(commp: string, recipientAddresses: string[])
export async function deleteData(commp: string)
export async function search(searchTerm: string)

// Internal modules (not exported)
// - SynapseClient (handles Filecoin storage)
// - KeypoEncryption (handles encryption/decryption) 
// - ContractDeployer (handles smart contracts & NFTs)
// - SubgraphClient (handles data lookup)
// - WalletBridge (handles wallet conversions)
```

### 3. Configuration Schema

```typescript
interface KeypoIntegrationConfig {
  // User provides only Ethers v6 wallet
  wallet: ethers.Signer  // Standard Ethers v6 wallet from user
  
  // Optional: Override defaults (normally not needed)
  apiUrl?: string  // Defaults to production Keypo API
  kernelAddress?: string  // Defaults to deployed kernel address
  
  // Integration options
  autoDeployContract?: boolean
  mintOwnerNFT?: boolean
  defaultAccessConditions?: AccessCondition[]
  
  // Metadata handling
  storeDataIdentifierMapping?: boolean
  metadataStorageOptions?: {
    provider: 'ipfs' | 'arweave' | 'custom'
    customHandler?: (mapping: CommPToDataIdentifier) => Promise<void>
  }
}

interface EncryptedUploadResult {
  // Keypo results
  dataIdentifier: string
  dataContractAddress: string
  
  // Synapse results
  commp: string
  
  // Integration results
  ownerNFT?: string
  
  // Metadata
  metadata: {
    keypo: any
    synapse: any
    integration: any
  }
}
```

## Data Identifier Mapping Strategy

**Unified Approach**: `@keypo/synapse-sdk` handles all mapping internally

**User Interface**: Users only work with `commp` (Synapse identifiers)
**Internal Mapping**: Package maintains `dataIdentifier` ↔ `commp` via smart contracts

```typescript
// User uploads data - gets commp back
const result = await uploadEncrypted("data", { name: "my-file" });
console.log(result.commp);  // User's primary identifier

// Package automatically:
// 1. Encrypts data with Keypo (creates dataIdentifier)
// 2. Stores on Filecoin with Synapse (creates commp)
// 3. Deploys smart contract linking both
// 4. Mints NFT for ownership
// 5. Subgraph indexes for search

// User searches by name - gets commp
const results = await search("my-file");
const commp = results[0].commp;

// User operates with commp - package handles dataIdentifier lookup
await shareData(commp, ["0xrecipient..."]);
```

## Usage Examples

### Basic Encrypted Storage
```typescript
// Single unified package containing everything
import { init, search, uploadEncrypted, downloadDecrypted, shareData, deleteData } from '@keypo/synapse-sdk'

// User only needs to provide Ethers v6 wallet
const privateKey = '0x...';
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const ethersWallet = new ethers.Wallet(privateKey, provider);

// Initialize the unified SDK (Synapse is bundled internally)
const keypoSynapse = await init({
  wallet: ethersWallet,
  rpcURL: RPC_URL
});

// Upload with encryption (always deploys contract & mints NFT)
const result = await uploadEncrypted("Hello World", {
  name: "my-secret-data"
})

console.log(`Data stored with CommP: ${result.commp}`)
console.log(`Smart contract: ${result.dataContractAddress}`)
console.log(`Owner NFT: ${result.ownerNFT}`)

// Later: Find data by name (queries the subgraph)
const searchResults = await search("my-secret-data")  // Only takes search term
const commp = searchResults[0].commp

// Use commp for all operations - share, delete, download
const decryptedData = await downloadDecrypted(commp)
// await shareData(commp, ["0x..."])  // Share with others
// await deleteData(commp)  // Delete data
console.log(`Decrypted: ${decryptedData}`) // "Hello World"
```

## Migration Path

### Phase 1: Core Integration
1. Modify Keypo SDK to work correctly with Synapse (main change is removing current upload/download flows from encrypt/decrypt so Synapse can do it)
2. Add Keypo as optional dependency
3. Implement wallet bridge utilities
4. Create basic wrapper functions
5. Add TypeScript interfaces

### Phase 2: Enhanced Features  
1. Add comprehensive error handling
2. Implement sharing and deleting features
3. Add advanced search and filtering capabilities

### Phase 3: Test and fine-tuning

## Conclusion

This architecture provides a clean, composable integration between Keypo and Synapse that:

- Maintains the independent functionality of both SDKs
- Requires minimal changes to existing Synapse codebase
- Enables powerful encrypted storage workflows
- Supports both standard and proxy execution patterns
- Provides clear upgrade paths for enhanced features

The wrapper pattern ensures that developers can adopt encrypted storage incrementally while preserving existing Synapse functionality for unencrypted use cases.