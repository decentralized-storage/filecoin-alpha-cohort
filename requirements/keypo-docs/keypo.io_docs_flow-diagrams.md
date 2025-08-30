# Flow Diagrams

These diagrams help visualize the complex interactions between different components of the Keypo system. Use them as reference when implementing specific features or troubleshooting issues.

## Standard Encryption Flow

```
Unencrypted Data → preProcess → encrypt → IPFS Storage
```

The standard encryption process follows these steps:

1. **Unencrypted Data**: The original data in any supported format
2. **preProcess**: Converts data to Uint8Array and generates metadata
3. **encrypt**: Encrypts the processed data using Lit Protocol
4. **IPFS Storage**: Stores the encrypted data on IPFS for decentralized access

## Standard Decryption Flow

```
IPFS Storage → Encrypted Data → decrypt → postProcess → Decrypted Data
```

The standard decryption process follows these steps:

1. **IPFS Storage**: Retrieves encrypted data from IPFS using the data identifier
2. **Encrypted Data**: The encrypted data retrieved from storage
3. **decrypt**: Decrypts the data using access control permissions
4. **postProcess**: Converts the decrypted Uint8Array back to its original format
5. **Decrypted Data**: The final restored data in its original format

## Encrypt for Proxy Execute Flow

```
API Key → preProcess → encryptForProxy → IPFS Storage
```

The proxy encryption process is designed for securely storing API keys:

1. **API Key**: The sensitive API key or credential to be encrypted
2. **preProcess**: Converts the API key to Uint8Array with metadata
3. **encryptForProxy**: Encrypts the key with special proxy execution permissions
4. **IPFS Storage**: Stores the encrypted API key for later proxy use

## Proxy Execute Flow

```
IPFS Storage → Encrypted Data → proxyExecute → API Response
```

The proxy execution process allows secure API calls without exposing keys:

1. **IPFS Storage**: Retrieves the encrypted API key from storage
2. **Encrypted Data**: The encrypted API key data
3. **proxyExecute**: Decrypts the key within a TEE and makes the API call
4. **API Response**: Returns the API response without ever exposing the key

## Workflow Integration

### Complete Encryption-Decryption Cycle

For standard data encryption and decryption:

```typescript
// Encryption workflow
const { dataOut, metadataOut } = await preProcess(originalData, "my-data");
const { dataCID, dataIdentifier } = await encrypt(dataOut, wallet, metadataOut, authorization);

// Decryption workflow  
const { decryptedData, metadata } = await decrypt(dataIdentifier, wallet, authorization);
const restoredData = await postProcess(decryptedData, metadata);
```

### Complete Proxy Encryption-Execution Cycle

For API key encryption and proxy execution:

```typescript
// Proxy encryption workflow
const { dataOut, metadataOut } = await preProcess(apiKey, "api-key");
const { dataCID, dataIdentifier } = await encryptForProxy(dataOut, wallet, metadataOut, authorization);

// Proxy execution workflow
const apiResponse = await proxyExecute(
  dataIdentifier,
  { method: "GET", url: "https://api.example.com/data" },
  wallet,
  authorization
);
```

## Component Interactions

### Key Components

- **preProcess/postProcess**: Handle data format conversion and metadata management
- **encrypt/decrypt**: Manage the core encryption/decryption using Lit Protocol
- **encryptForProxy/proxyExecute**: Handle secure API execution without key exposure
- **IPFS Storage**: Provides decentralized storage for encrypted data
- **Wallet/Authorization**: Manages access control and permissions

### Security Model

The flow diagrams illustrate Keypo's zero-knowledge architecture:

1. **Data never leaves encrypted**: Raw data is immediately processed and encrypted
2. **Keys stay distributed**: Decryption keys are managed by Lit Protocol's network
3. **Proxy execution in TEE**: API keys are decrypted only within trusted execution environments
4. **On-chain access control**: Permissions are managed through smart contracts

## Implementation Notes

- All flows require proper wallet setup with EIP-7702 authorization
- The `preProcess` and `postProcess` functions ensure data integrity across the encryption cycle
- IPFS storage provides content-addressed, tamper-proof data storage
- Proxy execution enables secure third-party API integration without credential exposure

Last updated on July 1, 2025

# Keypo SDK Documentation