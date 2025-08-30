# delete

Permanently deletes encrypted data from the system using EIP-7702 smart accounts powered by ZeroDev.

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

The `deleteData` function permanently removes encrypted data from the systems. This operation is irreversible and will remove access for all wallets that had permission to use the data. The function must be invoked by the wallet that originally encrypted the data.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gassless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataIdentifier` | `string` | Yes | The unique identifier of the encrypted data to delete. |
| `walletClient` | `Client<Transport, Chain, Account>` | Yes | The viem wallet client with the account that has permission to delete the data. |
| `authorization` | `any` | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) for details. |
| `config` | `DeleteConfig` | Yes | Configuration object containing contract addresses and RPC endpoints. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the deletion process. Default is `false`. |

### DeleteConfig Structure

```typescript
{
  permissionsRegistryContractAddress: string,  // Address of the permissions registry contract
  bundlerRpcUrl: string                        // RPC URL for the bundler (recommended: ZeroDev, but works with any account abstraction bundler/paymaster like biconomy, alchemy, etc)
}
```

## Returns

`Promise<void>` - A Promise that resolves when the deletion operation is completed.

## Examples

### Basic Usage

```typescript
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Create wallet client
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

// Get authorization signature
const authorization = await walletClient.signAuthorization({
  account,
  contractAddress: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  chainId: baseSepolia.id,
  nonce: 0
});

// Delete encrypted data
const config = {
  permissionsRegistryContractAddress: '0x...',
  bundlerRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/...'
};

await keypo.deleteData(
  dataId,
  walletClient,
  authorization,
  config,
  true  // enable debug logs
);

console.log('Data deleted successfully');
```

### With Embedded Wallets

For embedded wallets like Privy, Dynamic, or Turnkey, refer to the [ZeroDev 7702 documentation](https://7702.zerodev.app/) for specific integration guides.

## Authorization Requirements

This function requires an EIP-7702 authorization signature. The authorization must be signed by the account that has permission to delete the data.

### Getting Authorization Signatures

#### With Known Private Keys
```typescript
const authorization = await walletClient.signAuthorization({
  account,
  contractAddress: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  chainId: baseSepolia.id,
  nonce: 0
});
```

#### With Embedded Wallets
For Privy, Dynamic, and Turnkey integrations, consult the [ZeroDev 7702 documentation](https://7702.zerodev.app/) for wallet-specific implementation details.

## Bundler Requirements

The function requires a bundler RPC endpoint. We recommend using ZeroDev's bundler service, but other compatible bundlers can be found in the [ZeroDev infrastructure documentation](https://docs.zerodev.app/meta-infra/rpcs).

## Notes

- The function requires the wallet to have permission to delete the data.
- Use `list` or `search` to find the data identifier for data you want to delete.
- The deletion operation is performed on-chain using EIP-7702 smart accounts and requires gas fees.
- This operation permanently deletes the encrypted data and removes access for all wallets.
- This operation cannot be undone - once data is deleted, it cannot be recovered.
- Only the owner of the data can delete it.
- The function uses ZeroDev's Kernel smart account implementation for enhanced security and gas optimization.
- Debug mode will log transaction details and receipts for troubleshooting.

## Compatibility

- ✅ Wallets with known private keys
- ✅ Embedded wallets (Privy, Dynamic, Turnkey)
- ❌ Injected wallet providers (MetaMask, WalletConnect, etc.)

## See Also

- [list](./list.md) - For finding data identifiers
- [search](./search.md) - For finding data identifiers filtered by the name metadata field
- [encrypt](./encrypt.md) - For encrypting data
- [encryptForProxy](./encryptForProxy.md) - For encrypting API keys
- [getDataInfo](./getDataInfo.md) - For checking data access permissions
- [share](./share.md) - For sharing access to encrypted data
- [ZeroDev 7702 Documentation](https://7702.zerodev.app/) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) - For authorization signature details 