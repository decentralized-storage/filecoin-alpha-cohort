# encrypt

Encrypts data.

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

The encrypt function encrypts the provided data using Keypo with EIP-7702 smart accounts. It requires a viem wallet client and authorization signature for the encryption process. The function encrypts the data and stores it on IPFS, returning identifiers needed for subsequent decryption and access management. The function caller is initially the only user who can decrypt the data, but they can update access after encryption.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gasless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with local wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIn | Uint8Array | Yes | The data to be encrypted as a Uint8 byte array (typically generated using preProcess). |
| walletClient | Client<Transport, Chain, Account> | Yes | The viem wallet client with the account used for the encryption process. |
| metadataIn | DataMetadata | Yes | Metadata object associated with the data (typically generated using preProcess). |
| authorization | any | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) for details. |
| config | EncryptConfig | Yes | Configuration object containing API endpoints, contract addresses, and RPC endpoints. |
| debug | boolean | No | When set to true, enables debug statements during encryption. Default is false. |

## EncryptConfig Structure

**Note**: use [init](../configuration.md) to automatically load the config.

```typescript
{
  apiUrl: string,                   // API endpoint for encryption service
  validatorAddress: string,         // Address of the validator contract
  registryContractAddress: string,  // Address of the registry contract
  bundlerRpcUrl: string            // RPC URL for the bundler (recommended ZeroDev)
}
```

## Returns

Promise<EncryptionResult> - A Promise that resolves to an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| dataCID | string | IPFS Content Identifier (CID) of the encrypted data. |
| dataIdentifier | string | Unique identifier for the encrypted data. |

## Examples

### Basic Usage

```typescript
// import relevant libraries
import { init, encrypt } from "@keypo/typescript-sdk";
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

// Prepare data for encryption
const { dataOut, metadataOut } = keypo.preProcess(data, 'my-encrypted-data');

// Encrypt data
const result = await keypo.encrypt(
  dataOut,
  walletClient,
  metadataOut,
  authorization,
  config.encryptConfig
);

console.log('Data encrypted successfully:', result.dataIdentifier);
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

- Initially, the encrypted data can only be decrypted by the wallet that encrypted it.
- To share access to the data with others, use the [share function](../data-management/share.md).
- The encryption operation is performed on-chain using EIP-7702 smart accounts and is gasless.
- Debug mode will log transaction details and receipts for troubleshooting.

## See Also

- [preProcess](../data-processing/preProcess.md) - Prepares data for encryption
- [share](../data-management/share.md) - For sharing access to encrypted data with other wallets
- [ZeroDev 7702 Documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) - For authorization signature details

Last updated on July 3, 2025