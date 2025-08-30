# delete

Permanently deletes encrypted data from the system.

## Signature

```typescript
async function deleteData(
  dataIdentifier: string,
  walletClient: Client<Transport, Chain, Account>,
  authorization: any,
  config: DeleteConfig,
  debug?: boolean
): Promise<void>
```

## Description

The deleteData function permanently removes encrypted data from the systems. This operation is irreversible and will remove access for all wallets that had permission to use the data. The function must be invoked by the wallet that originally encrypted the data.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gasless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIdentifier | string | Yes | The unique identifier of the encrypted data to delete. |
| walletClient | Client<Transport, Chain, Account> | Yes | The viem wallet client with the account that has permission to delete the data. |
| authorization | any | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) for details. |
| config | DeleteConfig | Yes | Configuration object containing contract addresses and RPC endpoints. |
| debug | boolean | No | When set to true, enables debug statements during the deletion process. Default is false. |

## DeleteConfig Structure

**Note**: use [init](init.md) to automatically load the config.

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry
  bundlerRpcUrl: string                      // RPC URL for the bundler (recommended ZeroDev)
}
```

## Returns

Promise<void> - A Promise that resolves when the deletion operation is completed.

## Examples

### Basic Usage (local wallet)

```typescript
// import relevant libraries
import { init, deleteData } from "@keypo/typescript-sdk";
import { http, createWalletClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"

// load config
const config = await init("https://api.keypo.io");

// Create wallet client
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

// Get authorization signature (needed for wallet to use smart account features)
const authorization = await walletClient.signAuthorization({
  contractAddress: config.kernelAddress as `0x${string}`, // Kernel V3.3 implementation
});

// Delete encrypted data
await keypo.deleteData(
  dataId,
  walletClient,
  authorization,
  config.deleteConfig
);

console.log('Data deleted successfully');
```

## With Embedded Wallets

Keypo works with the following embedded wallets: Privy, Dynamic and Turnkey.

You need to pass the embedded wallet as Viem wallet client to the delete function in order for it to work properly. Please consult the embedded wallet's documentation on guidelines for how to do that.

## Authorization Requirements

This function requires an EIP-7702 authorization signature. The authorization must be signed by the account that has permission to delete the data.

### Getting Authorization Signatures

#### With Known Private Keys

```typescript
const authorization = await walletClient.signAuthorization({
  contractAddress: config.kernelAddress as `0x${string}`, // Kernel V3.3 implementation
});
```

#### With Embedded Wallets

For Privy, Dynamic, and Turnkey integrations, consult the [ZeroDev 7702 documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) for wallet-specific implementation details.

## Notes

- This operation is permanent and irreversible - once data is deleted, it cannot be recovered.
- The function requires the wallet to be the same wallet that encrypted the data originally.
- Use [list](list.md) or [search](search.md) to find the data identifier for data you want to delete.
- The deletion operation is performed on-chain using EIP-7702 smart accounts and is gasless.
- Debug mode will log transaction details and receipts for troubleshooting.

## See Also

- [list](list.md) - For finding data identifiers
- [search](search.md) - For finding data identifiers filtered by the name metadata field
- [encrypt](../encryption/encrypt.md) - For encrypting data
- [encryptForProxy](../encryption/encryptForProxy.md) - For encrypting API keys
- [getDataInfo](getDataInfo.md) - For checking data access permissions
- [share](share.md) - For sharing access to encrypted data
- [ZeroDev 7702 Documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) - For authorization signature details

Last updated on July 3, 2025