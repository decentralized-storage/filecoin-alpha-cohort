# Glossary

This document provides a comprehensive list of all TypeScript interfaces and types used throughout the Keypo SDK documentation.

## Core Types

### DataMetadata

```typescript
{
  name: string,        // Human-readable name for the data
  type: string,        // The detected type of the input data
  mimeType?: string,   // The detected MIME type (present for File/Blob inputs)
  subtype?: string,    // Additional type information (e.g., 'bigint', 'base64')
  arrayType?: string,  // For TypedArrays, specifies the specific array type
  userMetaData?: any   // Any custom metadata provided during preprocessing
}
```

### TypedArray

```typescript
type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
```

## Configuration Types

### EncryptConfig

```typescript
{
  apiUrl: string,                   // API endpoint for encryption service
  validatorAddress: string,         // Address of the validator contract
  registryContractAddress: string,  // Address of the registry contract
  bundlerRpcUrl: string            // RPC URL for the bundler
}
```

### EncryptForProxyConfig

```typescript
{
  apiUrl: string,                   // API endpoint for encryption service
  validatorAddress: string,         // Address of the validator contract
  registryContractAddress: string,  // Address of the registry contract
  zerodevRpcUrl: string,           // RPC URL for the bundler
  proxyAddress: string             // Address of the proxy contract that will execute
}
```

### DecryptConfig

```typescript
{
  registryContractAddress: string,  // Address of the registry contract
  chain: string,                   // Chain identifier
  expiration: string,              // Expiration time for access
  apiUrl: string                   // API endpoint for decryption service
}
```

### DeleteConfig

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry
  bundlerRpcUrl: string                      // RPC URL for the bundler
}
```

### ShareConfig

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry
  bundlerRpcUrl: string                      // RPC URL for the bundler
}
```

## API Response Types

### EncryptAPIResponse

```typescript
{
  name: string,                    // Name of the encrypted data
  encryptedData: {
    ipfsHash: string,             // IPFS hash of the encrypted data
    dataIdentifier: string        // Unique identifier for the encrypted data
  }
}
```

### DecryptAPIResponse

```typescript
{
  decryptedData: Uint8Array,      // The decrypted data as a byte array
  metadata: DataMetadata          // Metadata associated with the decrypted data
}
```

## Operation Results

### EncryptionResult

```typescript
{
  dataCID: string,                // IPFS Content Identifier (CID) of the encrypted data
  dataIdentifier: string          // Unique identifier for the encrypted data
}
```

## System Configuration

### KeypoRefs

```typescript
{
  Version: string,                           // SDK version
  KeypoApiUrl: string,                      // Base API URL for Keypo services
  RegistryContractAddress: string,          // Address of the registry contract
  DefaultValidationContractAddress: string, // Default validator contract address
  DefaultLitActionCID: string,              // Default Lit Action CID
  DefaultJSONRPC: string,                   // Default JSON-RPC endpoint
  ChainId: string,                          // Chain ID
  Chain: string,                            // Chain name
  GetFileDataByOwnerSubGraph: string        // SubGraph URL for file data queries
}
```

## Data Info Types

### DataInfo

```typescript
{
  cid: string,                     // IPFS CID of encrypted data
  dataContractAddress: string,     // Smart contract address managing access
  dataMetadata: {                  // Metadata associated with the data
    name: string,                  // Human-readable name for the data
    type: string,                  // The detected type of the input data
    mimeType?: string,             // The detected MIME type (present for File/Blob input)
    subtype?: string,              // Additional type information (e.g., 'bigint', 'base64')
    userMetaData?: string          // Any custom metadata provided during preprocessing
  },
  owner: string,                   // The wallet address that owns this data
  users: string[]                  // Array of wallet addresses that have been granted access
}
```

### ExtendedDataInfo

```typescript
{
  cid: string,                     // IPFS CID of encrypted data
  dataContractAddress: string,     // Smart contract address managing access
  dataIdentifier: string,          // Unique identifier for the data
  dataMetadata: {                  // Metadata associated with the data
    name: string,                  // Human-readable name for the data
    type: string,                  // The detected type of the input data
    mimeType?: string,             // The detected MIME type (present for File/Blob input)
    subtype?: string,              // Additional type information (e.g., 'bigint', 'base64')
    userMetaData?: string          // Any custom metadata provided during preprocessing
  },
  owner: string,                   // The wallet address that owns this data
  isAccessMinted: boolean          // Whether this data was accessed through a minted permission
}
```

## Request/Response Types

### ProxyExecuteRequest

```typescript
{
  method: string,                           // HTTP method (GET, POST, PUT, DELETE)
  url: string,                             // Target API endpoint URL
  headers?: Record<string, string>,        // Optional HTTP headers
  body?: any                               // Optional request body
}
```

### ProxyExecuteConfig

```typescript
{
  chain: string,                           // Blockchain chain identifier
  apiUrl: string,                          // API endpoint for the proxy service
  expiration: string,                      // Session expiration time (ISO timestamp)
  permissionsRegistryContractAddress: string // Address of the permissions registry
}
```

## Filter and Pagination Types

### FilterConfig

```typescript
{
  filterBy?: {
    field: string;                         // Field to filter by (e.g., 'name', 'type')
    value: string | number | boolean;      // Value to filter for
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith'; // Filter operator
  };
  sortBy?: {
    field: string;                         // Field to sort by
    direction?: 'asc' | 'desc';           // Sort direction
  };
  pagination?: {
    pageSize?: number;                     // Number of items per page
    maxPages?: number;                     // Maximum number of pages to fetch
  };
}
```

## Supported Data Types

The following types are supported for encryption and decryption:

```typescript
type SupportedDataType =
  | File
  | Blob
  | ArrayBuffer
  | Buffer
  | string
  | number
  | bigint
  | boolean
  | object
  | null
  | undefined
  | TypedArray
```

## Wallet and Client Types

### VieWalletClient

```typescript
// From viem library
Client<Transport, Chain, Account>
```

### EthersWallet

```typescript
// From ethers v5 library
ethers.Signer | ethers.Wallet
```

### AuthorizationSignature

```typescript
// EIP-7702 authorization signature structure
{
  contractAddress: string,
  chainId: number,
  nonce: number,
  // Additional signature fields as defined by EIP-7702
}
```

## Error Types

### KeypoError

```typescript
{
  message: string,                         // Error description
  code?: string,                           // Error code for programmatic handling
  details?: any                            // Additional error context
}
```

## Utility Types

### PreProcessResult

```typescript
{
  dataOut: Uint8Array,                     // Processed data ready for encryption
  metadataOut: DataMetadata                // Generated metadata for the data
}
```

### DecryptResult

```typescript
{
  decryptedData: Uint8Array,               // The decrypted data as a byte array
  metadata: DataMetadata                   // Metadata needed for post-processing
}
```

## Notes

- All `dataIdentifiers` are unique across the entire system
- Human-readable names in metadata are not required to be unique, and can be duplicated
- The `owner` field indicates whether a wallet has full control over the data
- The `users` array contains wallet addresses that have been shared access to the data (excluding the owner)
- All blockchain operations (share, delete) use EIP-7702 smart accounts powered by ZeroDev
- The `dataContractAddress` is needed for access management operations
- The `cid` can be used to verify the data on IPFS
- `Buffer` is a Node.js specific type for handling binary data, equivalent to `Uint8Array` in browser environments
- Configuration types are used to specify contract addresses, API endpoints, and bundler RPC URLs
- API response types define the structure of responses from Keypo services
- Filter types enable advanced querying capabilities for data management functions
- All timestamp fields use ISO 8601 format strings
- Wallet client types differ between viem (for EIP-7702 operations) and ethers (for decryption operations)

## Type Usage Examples

### Working with DataMetadata

```typescript
const { dataOut, metadataOut } = await keypo.preProcess(file, 'my-document');
// metadataOut.type === 'file'
// metadataOut.mimeType === 'application/pdf' (example)
// metadataOut.name === 'my-document'
```

### Using Filter Configuration

```typescript
const filter: FilterConfig = {
  filterBy: {
    field: 'name',
    value: 'API',
    operator: 'contains'
  },
  sortBy: {
    field: 'name',
    direction: 'asc'
  },
  pagination: {
    pageSize: 20,
    maxPages: 5
  }
};

const results = await keypo.list(address, false, undefined, filter);
```

### Type-safe Post-processing

```typescript
interface MyConfig {
  apiKey: string;
  timeout: number;
}

const { decryptedData, metadata } = await keypo.decrypt(dataId, wallet, config);
const restoredConfig = keypo.postProcess<MyConfig>(decryptedData, metadata);
// restoredConfig is now typed as MyConfig
```

Last updated on June 21, 2025