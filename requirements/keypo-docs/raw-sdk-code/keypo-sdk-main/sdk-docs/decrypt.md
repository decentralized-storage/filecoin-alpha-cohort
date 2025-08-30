# decrypt

Decrypts data that has been encrypted using Keypo.

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

The `decrypt` function retrieves and decrypts data that was previously encrypted with Keypo. It uses the unique `dataIdentifier` to locate the data. The function must be invoked using an ethers signer corresponding to an account that either encrypted the data or has been granted access to it.

The decryption process is handled by a secure API endpoint that manages the Lit Protocol session and data retrieval from IPFS.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataIdentifier` | `string` | Yes | The unique identifier of the encrypted data. |
| `wallet` | `ethers.Signer` | Yes | An ethers.js signer that has permission to decrypt the data. |
| `config` | `DecryptConfig` | Yes | Configuration object containing necessary parameters for decryption. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the decryption process. Default is `false`. |

### DecryptConfig Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `registryContractAddress` | `string` | Yes | The address of the permissions registry contract. |
| `chain` | `string` | Yes | The blockchain network to use. |
| `expiration` | `string` | Yes | ISO timestamp for when the session should expire. |
| `apiUrl` | `string` | Yes | The base URL of the Keypo API. |

## Returns

`Promise<{ decryptedData: Uint8Array, metadata: DataMetadata }>` - A Promise that resolves to an object containing:
- `decryptedData`: The decrypted data as a Uint8 byte array
- `metadata`: The metadata object associated with the data, containing type information and other details needed for proper restoration

## Examples

For default addresses and identifiers for the `baseSepolia` test network, please see the main [SDK README](./README.md).

### Basic Usage (Node.js)

```typescript
const dataId = "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab";

// Basic decryption
const config = {
  registryContractAddress: "0x...",
  chain: "ethereum",
  expiration: new Date(Date.now() + 3600000).toISOString(),
  apiUrl: "https://api.keypo.io"
};

const { decryptedData, metadata } = await keypo.decrypt(dataId, wallet, config, true); // enable debug logs

// Decrypt and convert to original format using postProcess
const originalData = keypo.postProcess(decryptedData, metadata);
```

### Browser Usage with Viem/Wagmi

This SDK requires a signer object from `ethers` v5. If you are using `viem` or `wagmi` in your application, you will need to convert your Viem Wallet Client to an `ethers.Signer`.

For detailed instructions on how to do this, please refer to the official Viem Ethers v5 Migration Guide: [https://viem.sh/docs/ethers-migration](https://viem.sh/docs/ethers-migration).

## Notes

- This SDK is compatible with **ethers v5**. Please ensure you are using this version in your project.
- You must use the exact data identifier that was assigned during encryption.
- Use `list` or `search` to find the data identifier for data you want to decrypt.
- Only accounts with appropriate permissions can decrypt the data.
- The decryption process is handled securely by the Keypo API.
- The returned metadata contains all information needed to restore the original data format using `postProcess`.
- For optimal handling of the decrypted data, use the `postProcess` function with the returned metadata.
- When debug is enabled, the function will log detailed information about the decryption process.

## See Also

- [list](./list.md) - For finding data identifiers
- [encrypt](./encrypt.md) - For encrypting data
- [postProcess](./postProcess.md) - For converting decrypted data back to its original format
- [search](./search.md) - For finding data identifiers filtered by the name metadata field