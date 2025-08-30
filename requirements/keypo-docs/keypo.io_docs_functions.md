# Functions Overview

The Keypo SDK provides functions organized into four main categories for different aspects of data encryption and management.

## Data Processing

Functions for preparing and restoring data:

- **[preProcess](functions/data-processing/preProcess.md)** - Prepare data for encryption by converting it to Uint8Array format
- **[postProcess](functions/data-processing/postProcess.md)** - Restore decrypted data to its original format

## Data Encryption

Functions for encrypting data with different access patterns:

- **[encrypt](functions/encryption/encrypt.md)** - Encrypt data with standard access control using EIP-7702 smart accounts
- **[encryptForProxy](functions/encryption/encryptForProxy.md)** - Encrypt API keys for proxy execution using EIP-7702 smart accounts

## Data Access

Functions for accessing and using encrypted data:

- **[decrypt](functions/data-access/decrypt.md)** - Decrypt and access encrypted data
- **[proxyExecute](functions/data-access/proxyExecute.md)** - Execute API calls using encrypted API keys

## Data Management

Functions for managing access and lifecycle of encrypted data:

- **[share](functions/data-management/share.md)** - Share access to encrypted data with other wallets
- **[delete](functions/data-management/delete.md)** - Permanently delete encrypted data
- **[list](functions/data-management/list.md)** - View all accessible encrypted data with filtering and pagination
- **[getDataInfo](functions/data-management/getDataInfo.md)** - Get detailed information about specific encrypted data
- **[search](functions/data-management/search.md)** - Search for encrypted data by name

## Common Workflow Patterns

### Standard Encryption/Decryption

```typescript
// 1. Load Keypo configuration
const config = await keypo.init("https://api.keypo.io");

// 2. Prepare data
const { dataOut, metadataOut } = keypo.preProcess(data, 'my-data');

// 3. Encrypt
const result = await keypo.encrypt(
  dataOut,
  walletClient,
  metadataOut,
  authorization,
  config.encryptConfig
);

// 4. Later, decrypt
const { decryptedData, metadata } = await keypo.decrypt(
  result.dataIdentifier,
  wallet,
  config.decryptConfig
);

// 5. Restore original format
const originalData = keypo.postProcess(decryptedData, metadata);
```

### API Key Proxy Execution

```typescript
// 1. Load Keypo configuration
const config = await keypo.init("https://api.keypo.io");

// 2. Prepare API key
const { dataOut, metadataOut } = keypo.preProcess(apiKey, 'api-key');

// 3. Encrypt for proxy
const result = await keypo.encryptForProxy(
  dataOut,
  walletClient,
  metadataOut,
  config.encryptForProxyConfig,
  authorization
);

// 4. Execute API calls (example: OpenAI API)
const response = await proxyExecute(
  result.dataIdentifier,
  wallet,
  {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer ${apiKey}" // This will be replaced with the actual key
    },
    body: {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Write one sentence about a cat" }]
    }
  },
  config.proxyExecuteConfig
);
```

### Data Management

```typescript
// List all accessible data
const allData = await keypo.list(wallet.address);

// Search for specific data
const apiKeys = await keypo.search('OpenAI API Key', wallet.address);

// Share with another wallet
const config = await keypo.init("https://api.keypo.io");
await keypo.shareData(
  dataIdentifier,
  walletClient,
  [recipientAddress],
  config.shareConfig,
  authorization
);

// Get detailed info
const info = await keypo.getDataInfo(dataIdentifier);
```

## Function Categories

All functions are organized by their primary purpose. Use the navigation menu to explore each category in detail.

### Category Breakdown

1. **Data Processing**: Handle data format conversion and preparation
   - Essential for ensuring data integrity through the encryption/decryption cycle
   - Automatically detects data types and generates appropriate metadata

2. **Data Encryption**: Core encryption functionality with different access patterns
   - Standard encryption for general data protection
   - Proxy encryption for secure API key management

3. **Data Access**: Retrieve and use encrypted data
   - Standard decryption for data recovery
   - Proxy execution for secure API calls without key exposure

4. **Data Management**: Lifecycle and access control operations
   - Share data with specific wallets
   - Delete data permanently
   - Search and browse encrypted data
   - Get detailed information about access permissions

## Integration Notes

- All encryption functions require EIP-7702 authorization signatures
- Wallet clients must support smart account operations
- The SDK is compatible with embedded wallets (Privy, Dynamic, Turnkey)
- All operations are gasless for end users through ZeroDev bundling
- Data is stored on IPFS for decentralized access
- Access control is managed through on-chain smart contracts

## Next Steps

Choose the appropriate function category based on your use case:

- Start with **Data Processing** to understand data preparation
- Use **Data Encryption** for protecting sensitive information
- Implement **Data Access** for retrieving encrypted data
- Utilize **Data Management** for sharing and organizing data

Last updated on July 2, 2025

# Keypo SDK Documentation