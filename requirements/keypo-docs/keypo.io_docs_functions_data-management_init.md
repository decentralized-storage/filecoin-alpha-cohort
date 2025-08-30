# init

The init function initializes the Keypo SDK by fetching configuration constants from the Keypo API and setting up all necessary configuration objects for data management operations.

## Overview

This function is the entry point for the Keypo SDK. It fetches the latest configuration constants from the Keypo API and returns a configuration object containing all the necessary settings for encryption, decryption, sharing, deletion, and proxy operations.

## Function Signature

```typescript
export async function init(apiUrl: string): Promise<{
  kernelAddress: string;
  decryptConfig: DecryptConfig;
  deleteConfig: DeleteConfig;
  encryptConfig: EncryptConfig;
  encryptForProxyConfig: EncryptForProxyConfig;
  proxyExecuteConfig: ProxyExecuteConfig;
  shareConfig: ShareConfig;
}>
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| apiUrl | string | The base URL of the Keypo API (e.g., "[https://api.keypo.io](https://api.keypo.io)") |

## Return Value

Returns a configuration object containing:

- **kernelAddress**: The account implementation address for the Kernel V3.3 smart account
- **decryptConfig**: Configuration for data decryption operations
- **deleteConfig**: Configuration for data deletion operations
- **encryptConfig**: Configuration for data encryption operations
- **encryptForProxyConfig**: Configuration for proxy encryption operations
- **proxyExecuteConfig**: Configuration for proxy execution operations
- **shareConfig**: Configuration for data sharing operations

For information on the configuration objects listed above, please consult the [glossary](../../glossary.md)

## Usage Example

```typescript
// import relevant libraries
import { init, decrypt, postProcess } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

const dataId = "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab"

// Load your wallet and Keypo config
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const config = await keypo.init("https://api.keypo.io");

// Decrypt data
const { decryptedData, metadata } = await keypo.decrypt(
  dataId,
  wallet,
  config.decryptConfig
);

// Decrypt and convert to original format using postProcess
const originalData = keypo.postProcess(decryptedData, metadata);
```

## Configuration Details

Each configuration object has a permutation of the following constants from the Keypo API:

- **Registry Contract Address**: Used for permission management
- **Default Validation Contract Address**: Used for encryption validation
- **Default Lit Action CID**: Used as proxy address for proxy operations
- **Bundler RPC URL**: Used for transaction bundling
- **Chain**: The blockchain network to use

## Error Handling

The function throws an error if:

- The API request fails (network error, invalid response, etc.)
- The response is not valid JSON
- Any other initialization error occurs

## Notes

- The function automatically sets expiration times to 1 hour from the current time for decryption and proxy execution.
- It uses ZeroDev Kernel V3.3 as the default smart account implementation
- All configuration objects are pre-populated with the latest constants from the Keypo API
- This function should be called once at the beginning of your application to initialize the SDK

Last updated on July 2, 2025