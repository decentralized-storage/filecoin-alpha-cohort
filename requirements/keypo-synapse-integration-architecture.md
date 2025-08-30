# Keypo-Synapse Integration Architecture

## Overview

This document outlines the architecture for integrating Keypo's encryption SDK into the Synapse SDK to enable private data storage on Filecoin. The integration follows a "wrapper" pattern where Keypo handles encryption/decryption at the boundaries while maintaining minimal changes to Synapse's core functionality.

## Design Principles

1. **Minimal Synapse Changes**: Keypo integration should require minimal modifications to existing Synapse SDK architecture
2. **Boundary Encryption**: Keypo operates at the beginning (encryption) and end (decryption) of workflows
3. **Composable Architecture**: Both SDKs maintain their independent functionality while enabling seamless integration
4. **Workflow Preservation**: Existing Synapse workflows continue to work unchanged for unencrypted data

## Integration Patterns

### Pattern 1: Wrapper Functions (Recommended)

Create high-level wrapper functions that combine Keypo and Synapse operations:

```typescript
// New wrapper functions in Synapse SDK
async function uploadEncrypted(data, keypoConfig, synapseConfig)
async function downloadDecrypted(commp, keypoConfig, synapseConfig)
async function proxyExecuteWithSynapse(dataIdentifier, proxyConfig, synapseConfig)
```

### Pattern 2: Enhanced StorageService

Extend Synapse's `StorageService` with optional Keypo integration:

```typescript
interface StorageServiceOptions {
  // Existing options...
  keypoIntegration?: KeypoIntegrationConfig
}

class StorageService {
  // Existing methods...
  async uploadWithEncryption(data, keypoConfig)
  async downloadWithDecryption(commp, keypoConfig)
}
```

## Core Architecture Components

### 1. Integration Layer

**Location**: New module `src/keypo/` in Synapse SDK

**Components**:
- `KeypoSynapseIntegration` - Main integration class
- `EncryptedStorageService` - Enhanced storage service with encryption
- `KeypoDataProcessor` - Handles Keypo data transformations
- `IntegrationTypes` - TypeScript interfaces for integration

### 2. Wallet Compatibility Bridge

**Challenge**: Keypo uses Viem (encryption) and Ethers v5 (decryption), Synapse uses Ethers v6

**Solution**: Create wallet adapter utilities:

```typescript
interface WalletBridge {
  toViemWallet(ethersWallet: ethers.Signer): WalletClient
  toEthersV5Wallet(ethersV6Wallet: ethers.Signer): ethers.v5.Wallet
  createAuthorization(wallet: ethers.Signer, kernelAddress: string): Promise<Authorization>
}
```

### 3. Data Flow Coordination

**Encryption Flow Coordinator**:
```typescript
class EncryptionFlowCoordinator {
  async executeEncryptedUpload(data: any, keypoConfig: KeypoConfig, synapseConfig: SynapseConfig) {
    // 1. Keypo preprocessing
    const { dataOut, metadataOut } = await preProcess(data, keypoConfig.name)
    
    // 2. Keypo encryption
    const { dataCID, dataIdentifier } = await encrypt(dataOut, keypoConfig.wallet, metadataOut, keypoConfig.authorization)
    
    // 3. Synapse storage
    const synapseResult = await synapse.storage.upload(encryptedData)
    
    // 4. Optional: Deploy permissioned contract + mint NFT
    if (keypoConfig.deployContract) {
      await this.deployPermissionedContract(dataIdentifier, synapseResult.commp)
    }
    
    return {
      dataIdentifier,
      commp: synapseResult.commp,
      keypoMetadata: { dataCID, dataIdentifier },
      synapseMetadata: synapseResult
    }
  }
}
```

## Detailed Integration Workflows

### 1. Encrypted Storage Workflow

#### Phase 1: Keypo Encryption
```typescript
// Input: Original data + Keypo configuration
const originalData = "Hello World"
const keypoConfig = {
  wallet: viemWallet,
  authorization: signedAuthorization,
  name: "my-private-data",
  accessConditions: [/* EVM conditions */]
}

// Step 1: Preprocess data for encryption
const { dataOut, metadataOut } = await preProcess(originalData, keypoConfig.name)

// Step 2: Encrypt data with access controls
const { dataCID, dataIdentifier } = await encrypt(
  dataOut, 
  keypoConfig.wallet, 
  metadataOut, 
  keypoConfig.authorization
)
```

#### Phase 2: Synapse Storage
```typescript
// Step 3: Store encrypted data via Synapse
const encryptedData = await fetchFromIPFS(dataCID) // Get encrypted bytes
const synapseResult = await synapse.storage.upload(encryptedData)

// Result includes CommP for Filecoin storage verification
console.log(`Stored with CommP: ${synapseResult.commp}`)
```

#### Phase 3: On-Chain Actions (Optional)
```typescript
// Step 4: Deploy permissioned file contract
const permissionContract = await deployPermissionedFileContract({
  dataIdentifier,
  commp: synapseResult.commp,
  accessConditions: keypoConfig.accessConditions
})

// Step 5: Mint owner NFT
const ownerNFT = await mintOwnerNFT({
  owner: keypoConfig.wallet.address,
  permissionContract: permissionContract.address,
  dataIdentifier
})
```

### 2. Decryption Retrieval Workflow

#### Phase 1: Synapse Retrieval
```typescript
// Input: CommP from previous storage + Keypo configuration
const commp = "baga6ea4seaq..." // From previous upload
const keypoConfig = {
  wallet: ethersV5Wallet,
  authorization: signedAuthorization
}

// Step 1: Retrieve encrypted data from Synapse
const encryptedData = await synapse.download(commp)
```

#### Phase 2: Keypo Decryption
```typescript
// Step 2: Determine dataIdentifier (stored in metadata or retrieved from contract)
const dataIdentifier = await getDataIdentifierFromCommP(commp)

// Step 3: Decrypt data
const { decryptedData, metadata } = await decrypt(
  dataIdentifier,
  keypoConfig.wallet,
  keypoConfig.authorization
)

// Step 4: Postprocess to original format
const originalData = await postProcess(decryptedData, metadata)
console.log("Decrypted data:", originalData)
```

### 3. Proxy Execution Workflow

#### Encrypted API Key Storage
```typescript
// Step 1: Encrypt API key for proxy execution
const { dataCID, dataIdentifier } = await encryptForProxy(
  apiKey,
  proxyWallet,
  metadata,
  authorization
)

// Step 2: Store encrypted key via Synapse
const synapseResult = await synapse.storage.upload(await fetchFromIPFS(dataCID))
```

#### Proxy Execution with Retrieval
```typescript
// Step 1: Retrieve encrypted API key
const encryptedKey = await synapse.download(commp)

// Step 2: Execute API call without exposing key
const result = await proxyExecute(
  dataIdentifier,
  proxyExecutionWallet,
  authorization,
  {
    apiEndpoint: "https://api.example.com/data",
    method: "GET",
    headers: { "Authorization": "Bearer ${DECRYPTED_KEY}" }
  }
)
```

## Integration Points

### 1. Synapse SDK Modifications

**Minimal Required Changes**:

1. **New Optional Dependency**: Add `@keypo/typescript-sdk` as optional peer dependency
2. **Wallet Bridge Utilities**: Add utilities to convert between wallet formats
3. **Integration Module**: New `src/keypo/` module with wrapper functions
4. **Type Extensions**: Extend existing interfaces with optional Keypo configurations

**Modified Files**:
- `package.json` - Add optional Keypo dependency
- `src/types.ts` - Add Keypo integration interfaces
- `src/synapse.ts` - Add optional encrypted storage methods
- `src/storage/service.ts` - Add encryption-aware upload/download methods

### 2. New Integration Modules

```typescript
// src/keypo/index.ts
export * from './integration'
export * from './wallet-bridge'
export * from './encrypted-storage'
export * from './types'

// src/keypo/integration.ts
export class KeypoSynapseIntegration {
  constructor(synapseConfig: SynapseConfig, keypoConfig: KeypoConfig)
  
  async uploadEncrypted(data: any, options?: EncryptedUploadOptions)
  async downloadDecrypted(commp: string, options?: DecryptedDownloadOptions)
  async proxyExecuteWithStorage(dataIdentifier: string, proxyOptions: ProxyOptions)
}

// src/keypo/encrypted-storage.ts
export class EncryptedStorageService extends StorageService {
  constructor(synapseStorage: StorageService, keypoConfig: KeypoConfig)
  
  async uploadWithEncryption(data: any)
  async downloadWithDecryption(commp: string)
}
```

### 3. Configuration Schema

```typescript
interface KeypoIntegrationConfig {
  // Keypo configuration
  apiUrl: string
  walletClient: WalletClient  // Viem wallet for encryption
  decryptWallet: ethers.v5.Wallet  // Ethers v5 for decryption
  authorization: Authorization
  
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
  dataCID: string
  
  // Synapse results
  commp: string
  
  // Integration results
  permissionContract?: string
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

**Challenge**: Need to map Synapse CommP to Keypo dataIdentifier for retrieval

**Solutions**:

### Option 1: Metadata Storage (Recommended)
```typescript
// Store mapping in IPFS metadata
const mappingMetadata = {
  commp: "baga6ea4seaq...",
  dataIdentifier: "keypo_data_id_123",
  timestamp: Date.now(),
  accessConditions: [...]
}

// Store mapping CID alongside main data
const mappingCID = await storeMetadataOnIPFS(mappingMetadata)
```

### Option 2: On-Chain Registry
```typescript
contract CommPToDataIdentifierRegistry {
  mapping(bytes32 => string) public commPToDataIdentifier;
  mapping(string => bytes32) public dataIdentifierToCommP;
  
  function registerMapping(bytes32 commp, string memory dataIdentifier) external;
  function getDataIdentifier(bytes32 commp) external view returns (string memory);
}
```

### Option 3: Deterministic Encoding
```typescript
// Embed dataIdentifier in CommP metadata during storage
function encodeDataIdentifierInCommP(dataIdentifier: string): CommPMetadata {
  return {
    originalCommP: calculateCommP(encryptedData),
    dataIdentifier: dataIdentifier,
    encoding: "keypo-v1"
  }
}
```

## Error Handling & Edge Cases

### 1. Wallet Compatibility Issues
```typescript
try {
  const viemWallet = walletBridge.toViemWallet(ethersWallet)
} catch (error) {
  throw new KeypoSynapseIntegrationError('Wallet conversion failed', { cause: error })
}
```

### 2. Network Mismatches
```typescript
// Ensure both SDKs operate on compatible networks
if (synapseConfig.network !== keypoConfig.chainId) {
  throw new NetworkMismatchError(`Synapse: ${synapseConfig.network}, Keypo: ${keypoConfig.chainId}`)
}
```

### 3. Data Identifier Resolution Failures
```typescript
// Fallback strategies for missing mappings
async function resolveDataIdentifier(commp: string): Promise<string> {
  try {
    return await getFromMetadata(commp)
  } catch {
    try {
      return await getFromRegistry(commp)
    } catch {
      throw new DataIdentifierNotFoundError(`Cannot resolve dataIdentifier for CommP: ${commp}`)
    }
  }
}
```

## Usage Examples

### Basic Encrypted Storage
```typescript
import { Synapse } from '@filoz/synapse-sdk'
import { KeypoSynapseIntegration } from '@filoz/synapse-sdk/keypo'
import { createWalletClient } from 'viem'

// Initialize both SDKs
const synapse = await Synapse.create({ privateKey: '0x...' })
const keypoConfig = {
  apiUrl: 'https://api.keypo.io',
  walletClient: createWalletClient({ ... }),
  decryptWallet: ethersV5Wallet,
  authorization: await signAuthorization(...)
}

// Create integration instance
const integration = new KeypoSynapseIntegration(synapse, keypoConfig)

// Upload encrypted data
const result = await integration.uploadEncrypted("Hello World", {
  name: "my-secret-data",
  accessConditions: [{ contractAddress: '0x...', method: 'balanceOf' }]
})

console.log(`Data stored with CommP: ${result.commp}`)
console.log(`Keypo dataIdentifier: ${result.dataIdentifier}`)

// Download and decrypt
const decryptedData = await integration.downloadDecrypted(result.commp)
console.log(`Decrypted: ${decryptedData}`) // "Hello World"
```

### Advanced Integration with NFT Minting
```typescript
const result = await integration.uploadEncrypted("Private Document", {
  name: "private-doc",
  autoDeployContract: true,
  mintOwnerNFT: true,
  accessConditions: [
    createEVMBalanceCondition('0x...', 1000), // Min 1000 tokens
    createTimeBasedCondition(Date.now() + 86400000) // Valid for 24h
  ]
})

console.log(`Permission Contract: ${result.permissionContract}`)
console.log(`Owner NFT: ${result.ownerNFT}`)
```

### Proxy Execution with API Keys
```typescript
// Store encrypted API key
const keyResult = await integration.uploadEncryptedForProxy(apiKey, {
  name: "openai-api-key",
  proxyConditions: [{ wallet: authorizedBotWallet.address }]
})

// Execute API call without exposing key
const response = await integration.proxyExecuteWithStorage(keyResult.dataIdentifier, {
  apiEndpoint: "https://api.openai.com/v1/completions",
  method: "POST",
  body: { prompt: "Hello", max_tokens: 50 },
  headers: { "Authorization": "Bearer ${DECRYPTED_KEY}" }
})
```

## Migration Path

### Phase 1: Core Integration
1. Add Keypo as optional dependency
2. Implement wallet bridge utilities
3. Create basic wrapper functions
4. Add TypeScript interfaces

### Phase 2: Enhanced Features  
1. Implement metadata mapping strategies
2. Add on-chain registry support
3. Develop proxy execution integration
4. Create comprehensive error handling

### Phase 3: Advanced Features
1. Add automatic contract deployment
2. Implement NFT minting integration
3. Develop advanced access control patterns
4. Optimize for gas efficiency

## Conclusion

This architecture provides a clean, composable integration between Keypo and Synapse that:

- Maintains the independent functionality of both SDKs
- Requires minimal changes to existing Synapse codebase
- Enables powerful encrypted storage workflows
- Supports both standard and proxy execution patterns
- Provides clear upgrade paths for enhanced features

The wrapper pattern ensures that developers can adopt encrypted storage incrementally while preserving existing Synapse functionality for unencrypted use cases.