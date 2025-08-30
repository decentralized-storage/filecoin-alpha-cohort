# decrypt

Decrypts data that has been encrypted using Keypo.

**Note**: decryption can currently only be done in a client/browser environment. If you want to decrypt something server-side, please use the [server-sdk](https://github.com/keypo/keypo-server-sdk). We will be updating the docs with instructions for this SDK soon!

## Signature

```typescript
async function decrypt(
  dataIdentifier: string,
  wallet: ethers.Signer,
  config: DecryptConfig,
  debug?: boolean
): Promise<{ decryptedData: Uint8Array, metadata: DataMetadata }>
```

## Description

The decrypt function retrieves and decrypts data that was previously encrypted with Keypo. It uses the unique dataIdentifier to locate the data. The function must be invoked using an ethers v5 signer corresponding to an account that either encrypted the data or has been granted access to it.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIdentifier | string | Yes | The unique identifier of the encrypted data. |
| wallet | ethers.Signer | Yes | An ethers.js v5 signer that has permission to decrypt the data. |
| config | DecryptConfig | Yes | Configuration object containing necessary parameters for decryption. |
| debug | boolean | No | When set to `true`, enables debug statements during the decryption process. Default is `false`. |

## DecryptConfig Properties

**Note**: use [init](../data-management/init.md) to automatically load the config.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| registryContractAddress | string | Yes | The address of the permissions registry contract. |
| chain | string | Yes | The blockchain network to use. |
| expiration | string | Yes | ISO timestamp for when the decryption session should expire. |
| apiUrl | string | Yes | The base URL of the Keypo API. |

## Returns

`Promise<{ decryptedData: Uint8Array, metadata: DataMetadata }>` - A Promise that resolves to an object containing:

- **decryptedData**: The decrypted data as a Uint8 byte array
- **metadata**: The metadata object associated with the data, containing type information and other details needed for proper restoration

## Examples

### Basic Usage (Node.js)

```typescript
import { init, decrypt, postProcess } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

const dataId = "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab"

// Load your wallet and Keypo config
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const config = await init("https://api.keypo.io");

// Decrypt data
const { decryptedData, metadata } = await decrypt(
  dataId,
  wallet,
  config.decryptConfig
);

// Decrypt and convert to original format using postProcess
const originalData = postProcess(decryptedData, metadata);
```

### Browser Usage with Viem/Wagmi

This SDK requires a signer object from ethers v5. If you are using viem or wagmi in your application, you will need to convert your Viem Wallet Client to an `ethers.Signer`.

For detailed instructions on how to do this, please refer to the official [Viem Ethers v5 Migration Guide](https://viem.sh/docs/ethers-migration).

### Complete Decryption Workflow

```typescript
import { init, decrypt, postProcess } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

async function decryptMyData(dataIdentifier: string) {
  try {
    // Setup wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Load Keypo configuration
    const config = await init("https://api.keypo.io");
    
    // Decrypt the data
    const { decryptedData, metadata } = await decrypt(
      dataIdentifier,
      wallet,
      config.decryptConfig
    );
    
    // Restore to original format
    const originalData = postProcess(decryptedData, metadata);
    
    console.log("Data decrypted successfully:", originalData);
    return originalData;
    
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
}
```

### With Debug Mode

```typescript
import { init, decrypt, postProcess } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

// Enable debug mode for troubleshooting
const { decryptedData, metadata } = await decrypt(
  dataIdentifier,
  wallet,
  config.decryptConfig,
  true  // Enable debug logging
);

const originalData = postProcess(decryptedData, metadata);
```

## Error Handling

The decrypt function may throw errors in the following cases:

- **Access denied**: If the wallet does not have permission to decrypt the data
- **Data not found**: If the data identifier does not exist
- **Network errors**: If there are connectivity issues with the API or blockchain
- **Invalid configuration**: If the DecryptConfig is malformed

```typescript
try {
  const { decryptedData, metadata } = await decrypt(
    dataIdentifier,
    wallet,
    config.decryptConfig
  );
  const originalData = postProcess(decryptedData, metadata);
} catch (error) {
  if (error.message.includes('Access denied')) {
    console.error('You do not have permission to decrypt this data');
  } else if (error.message.includes('not found')) {
    console.error('Data identifier not found');
  } else {
    console.error('Decryption failed:', error.message);
  }
}
```

## Notes

- This SDK is compatible with **ethers v5**. Please ensure you are using this version in your project.
- You must use the exact data identifier that was assigned during encryption.
- Use [list](../data-management/list.md) or [search](../data-management/search.md) to find the data identifier for data you want to decrypt.
- Only accounts with appropriate permissions can decrypt the data.
- The returned metadata contains all information needed to restore the original data format using [postProcess](../data-processing/postProcess.md).
- For optimal handling of the decrypted data, use the `postProcess` function with the returned metadata.
- When debug is enabled, the function will log detailed information about the decryption process.

## Access Control

The decrypt function respects the access control permissions set during encryption:

1. **Owner access**: The wallet that originally encrypted the data can always decrypt it
2. **Shared access**: Wallets that have been granted access via the [share](../data-management/share.md) function can decrypt the data
3. **Time-based access**: Access permissions can have expiration times
4. **On-chain verification**: All permissions are verified through smart contracts

## Performance Considerations

- **Network latency**: Decryption involves multiple network calls (IPFS retrieval, Lit Protocol decryption)
- **Metadata processing**: Large metadata objects may require additional processing time
- **Browser environment**: Client-side decryption ensures keys never leave the user's environment
- **Caching**: Consider caching decrypted data locally for frequently accessed items

## See Also

- [list](../data-management/list.md) - For finding data identifiers
- [encrypt](../encryption/encrypt.md) - For encrypting data
- [postProcess](../data-processing/postProcess.md) - For converting decrypted data back to its original format
- [search](../data-management/search.md) - For finding data identifiers filtered by the name metadata field
- [share](../data-management/share.md) - For granting access to encrypted data
- [getDataInfo](../data-management/getDataInfo.md) - For checking access permissions before decryption

Last updated on July 11, 2025

# Keypo SDK Documentation