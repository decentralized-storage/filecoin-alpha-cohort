# share

Shares access to encrypted data with other wallet addresses.

## Signature

```typescript
async function shareData(
  dataIdentifier: string,
  walletClient: Client<Transport, Chain, Account>,
  recipientAddresses: string[],
  config: ShareConfig,
  authorization: any,
  debug?: boolean
): Promise<void>
```

## Description

The `shareData` function allows you to grant access to encrypted data to other wallets. This is useful when you want to share your encrypted data with other users while maintaining control over who can access it. The function requires the wallet that originally encrypted the data or has sharing permissions.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gassless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataIdentifier` | `string` | Yes | The unique identifier of the encrypted data to share. |
| `walletClient` | `Client<Transport, Chain, Account>` | Yes | The viem wallet client with the account that has permission to share the data. |
| `recipientAddresses` | `string[]` | Yes | Array of wallet addresses to grant access to. |
| `config` | `ShareConfig` | Yes | Configuration object containing contract addresses and RPC endpoints. |
| `authorization` | `any` | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) for details. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the sharing process. Default is `false`. |

### ShareConfig Structure

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry contract
  bundlerRpcUrl: string                        // RPC URL for the bundler (recommended: ZeroDev, but works with any account abstraction bundler/paymaster like biconomy, alchemy, etc)
}
```

## Returns

`Promise<void>` - A Promise that resolves when the sharing operation is completed.

## Examples

### Basic Usage

```typescript
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const dataId = "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab";

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

// Share access to encrypted data with multiple wallets
const config = {
  permissionsRegistryContractAddress: '0x...',
  bundlerRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/...'
};

await keypo.shareData(
  dataId,
  walletClient,
  [
    "0x2529254cC1d40b77198c94e51C554A88734Efeb7", // recipient 1
    "0x1234567890123456789012345678901234567890"  // recipient 2
  ],
  config,
  authorization,
  true  // enable debug logs
);

console.log('Data shared successfully');
```

### With Embedded Wallets

For embedded wallets like Privy, Dynamic, or Turnkey, refer to the [ZeroDev 7702 documentation](https://7702.zerodev.app/) for specific integration guides for generating an authorization signature.

## Authorization Requirements

This function requires an EIP-7702 authorization signature. The authorization must be signed by the account that has permission to share the data.

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

## Default Configuration Values

For the `baseSepolia` test network, you can use the following default values in your config:

- **RegistryContractAddress**: `0x8370Ee1a51B5F31cc10E2f4d786Ff20198B10BBE`
- **DefaultValidationContractAddress**: `0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C`
- **ChainId**: `84532`
- **Chain**: `baseSepolia`

For a complete list of default configuration values, see the [main README](./README.md#default-configuration-values).

## Notes

- The function requires the wallet to have permission to share the data.
- Use `list` or `search` to find the data identifier for data you want to share.
- All recipient addresses must be valid Ethereum addresses.
- The function can share with multiple recipients in a single transaction.
- The sharing operation is performed on-chain using EIP-7702 smart accounts and requires gas fees.
- The function uses ZeroDev's Kernel smart account implementation for enhanced security and gas optimization.
- Debug mode will log transaction details and receipts for troubleshooting.
- The function calls the `mintFromPermissionedFileForOwner` contract function to grant access.

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
- [ZeroDev 7702 Documentation](https://7702.zerodev.app/) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) - For authorization signature details 