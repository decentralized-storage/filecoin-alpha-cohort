# Glossary

This document provides a comprehensive list of all TypeScript interfaces and types used throughout the Keypo SDK documentation.

## Core Types

### DataMetadata
```typescript
{
  name: string,           // Human-readable name for the data
  type: string,           // The detected type of the input data
  mimeType?: string,      // The detected MIME type (present for File/Blob inputs)
  subtype?: string,       // Additional type information (e.g., 'bigint', 'base64', 'json')
  arrayType?: string,     // For TypedArrays, specifies the specific array type
  userMetaData?: any      // Any custom metadata provided during preprocessing
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
  apiUrl: string,                           // API endpoint for encryption service
  validatorAddress: string,                 // Address of the validator contract
  registryContractAddress: string,          // Address of the registry contract
  bundlerRpcUrl: string                     // RPC URL for the bundler
}
```

### EncryptForProxyConfig
```typescript
{
  apiUrl: string,                           // API endpoint for encryption service
  validatorAddress: string,                 // Address of the validator contract
  registryContractAddress: string,          // Address of the registry contract
  zerodevRpcUrl: string,                    // RPC URL for the bundler
  proxyAddress: string                      // Address of the proxy contract that will execute the API calls
}
```

### DecryptConfig
```typescript
{
  registryContractAddress: string,          // Address of the registry contract
  chain: string,                            // Chain identifier
  expiration: string,                       // Expiration time for access
  apiUrl: string                            // API endpoint for decryption service
}
```

### DeleteConfig
```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry contract
  bundlerRpcUrl: string                      // RPC URL for the bundler
}
```

### ShareConfig
```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry contract
  bundlerRpcUrl: string                      // RPC URL for the bundler
}
```

## API Response Types

### EncryptAPIResponse
```typescript
{
  name: string,                             // Name of the encrypted data
  encryptedData: {
    ipfsHash: string,                       // IPFS hash of the encrypted data
    dataIdentifier: string                  // Unique identifier for the encrypted data
  }
}
```

### DecryptAPIResponse
```typescript
{
  decryptedData: Uint8Array,                // The decrypted data as a byte array
  metadata: DataMetadata                    // Metadata associated with the decrypted data
}
```

## Operation Results

### EncryptionResult
```typescript
{
  dataCID: string,           // IPFS Content Identifier (CID) of the encrypted data
  dataIdentifier: string     // Unique identifier for the encrypted data
}
```

## System Configuration

### KeypoRefs
```typescript
{
  Version: string,                           // SDK version
  KeypoApiUrl: string,                       // Base API URL for Keypo services
  RegistryContractAddress: string,           // Address of the registry contract
  DefaultValidationContractAddress: string,  // Default validator contract address
  DefaultLitActionCID: string,               // Default Lit Action CID
  DefaultJSONRPC: string,                    // Default JSON-RPC endpoint
  ChainId: string,                           // Chain ID
  Chain: string,                             // Chain name
  GetFileDataByOwnerSubGraph: string         // SubGraph URL for file data queries
}
```

## Data Info Types

### DataInfo
```typescript
{
  cid: string,              // IPFS CID of encrypted data
  dataContractAddress: string, // Smart contract address managing access
  dataMetadata: {           // Metadata associated with the data
    name: string,           // Human-readable name for the data
    type: string,           // The detected type of the input data
    mimeType?: string,      // The detected MIME type (present for File/Blob inputs)
    subtype?: string,       // Additional type information (e.g., 'bigint', 'base64', 'json')
    userMetaData?: string   // Any custom metadata provided during preprocessing (JSON stringified)
  },
  owner: string,            // The wallet address that owns this data
  users: string[]           // Array of wallet addresses that have been granted access to this data
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