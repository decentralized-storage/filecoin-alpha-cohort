# encrypt

Encrypts data using the Keypo encryption system with EIP-7702 smart accounts powered by ZeroDev.

## Signature

```typescript
async function encrypt(
  dataIn: Uint8Array,
  walletClient: Client<Transport, Chain, Account>,
  metadataIn: DataMetadata,
  authorization: any,
  config: EncryptConfig,
  debug?: boolean
): Promise<EncryptionResult>
```

## Description

The `encrypt` function encrypts the provided data using Keypo with EIP-7702 smart accounts. It requires a viem wallet client and authorization signature for the encryption process. The function encrypts the data and stores it on IPFS, returning identifiers needed for subsequent decryption and access management. The function caller is initially the only user who can decrypt the data, but they can update access after encryption.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gassless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataIn` | `Uint8Array` | Yes | The data to be encrypted as a Uint8 byte array (typically generated using `preProcess`). |
| `walletClient` | `Client<Transport, Chain, Account>` | Yes | The viem wallet client with the account used for the encryption process. |
| `metadataIn` | `DataMetadata` | Yes | Metadata object associated with the data (typically generated using `preProcess`). |
| `authorization` | `any` | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) for details. |
| `config` | `EncryptConfig` | Yes | Configuration object containing API endpoints, contract addresses, and RPC endpoints. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during encryption. Default is `false`. |

### EncryptConfig Structure

```typescript
{
  apiUrl: string,                           // API endpoint for encryption service
  validatorAddress: string,                 // Address of the validator contract
  registryContractAddress: string,          // Address of the registry contract
  bundlerRpcUrl: string                     // RPC URL for the bundler (recommended: ZeroDev, but works with any account abstraction bundler/paymaster like biconomy, alchemy, etc)
}
```

## Returns

`Promise<EncryptionResult>` - A Promise that resolves to an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `dataCID` | `string` | IPFS Content Identifier (CID) of the encrypted data. |
| `dataIdentifier` | `string` | Unique identifier for the encrypted data. |

## Examples

### Basic Usage

```typescript
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// First preprocess the data
const file = new File([new Blob(['confidential content'])], 'secret.txt');
const { dataOut, metadataOut } = keypo.preProcess(file, 'secret-doc');

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

// Encrypt the preprocessed data
const config = {
  apiUrl: 'https://api.keypo.com',
  validatorAddress: '0x...',
  registryContractAddress: '0x...',
  bundlerRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/...'
};

const result = await keypo.encrypt(
  dataOut,
  walletClient,
  metadataOut,
  authorization,
  config,
  true  // enable debug logs
);

console.log(`Data encrypted with CID: ${result.dataCID}`);
console.log(`Data identifier: ${result.dataIdentifier}`);
```

### With Embedded Wallets

For embedded wallets like Privy, Dynamic, or Turnkey, refer to the [ZeroDev 7702 documentation](https://7702.zerodev.app/) for specific integration guides for generating an authorization signature.

## Authorization Requirements

This function requires an EIP-7702 authorization signature. The authorization must be signed by the account that will own the encrypted data.

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

- Initially, the encrypted data can only be decrypted by the wallet that encrypted it.
- To share access to the data with others, use the [sharing function](./sharing.md).
- The encryption process involves deploying a permissioned data contract and minting an owner NFT.
- The function uses ZeroDev's Kernel smart account implementation for enhanced security and gas optimization.
- Debug mode will log contract addresses, API responses, and transaction details for troubleshooting.

## Compatibility

- ✅ Wallets with known private keys
- ✅ Embedded wallets (Privy, Dynamic, Turnkey)
- ❌ Injected wallet providers (MetaMask, WalletConnect, etc.)

## See Also

- [preProcess](./preProcess.md) - Prepares data for encryption
- [Sharing Data](./sharing.md) - For sharing access to encrypted data with other wallets
- [ZeroDev 7702 Documentation](https://7702.zerodev.app/) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) - For authorization signature details