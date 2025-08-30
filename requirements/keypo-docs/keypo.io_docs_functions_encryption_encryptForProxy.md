# encryptForProxy

Uses Keypo to encrypt data such that it can only be decrypted by a trusted execution environment (TEE) bound to specific code.

## Signature

```typescript
async function encryptForProxy(
  dataIn: Uint8Array,
  walletClient: Client<Transport, Chain, Account>,
  metadataIn: DataMetadata,
  config: EncryptForProxyConfig,
  authorization: any,
  debug?: boolean
): Promise<EncryptionResult>
```

## Description

The encryptForProxy function encrypts data such that it can only be used within a trusted execution environment (TEE) bound to specific code. This is useful in situations where you want to enable someone to use your data in a very specific way without giving them access to the unencrypted data. Currently this function only works with encrypting API keys.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gasless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with local wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

**Note**: This feature currently only works for encrypting API keys and must be used in tandem with [proxyExecute](../data-access/proxyExecute.md).

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIn | Uint8Array | Yes | The data to be encrypted as a Uint8 byte array (typically from preProcess). |
| walletClient | Client<Transport, Chain, Account> | Yes | The viem wallet client with the account used for the encryption process. |
| metadataIn | DataMetadata | Yes | Metadata object associated with the data (typically from preProcess). |
| config | EncryptForProxyConfig | Yes | Configuration object containing API endpoints, contract addresses, proxy address, and RPC endpoints. |
| authorization | any | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) for details. |
| debug | boolean | No | When set to true, enables debug statements during encryption. Default is false. |

## EncryptForProxyConfig Structure

**Note**: use [init](../configuration.md) to automatically load the config.

```typescript
{
  apiUrl: string,                      // API endpoint for encryption service
  validatorAddress: string,            // Address of the validator contract
  registryContractAddress: string,     // Address of the registry contract
  zerodevRpcUrl: string,              // RPC URL for the bundler (recommended ZeroDev)
  proxyAddress: string                // Address of the proxy contract that will execute
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
import { init, encryptForProxy } from "@keypo/typescript-sdk";
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

// Prepare API key for proxy encryption
const { dataOut, metadataOut } = keypo.preProcess(apiKey, 'my-api-key');

// Encrypt API key for proxy execution
const result = await keypo.encryptForProxy(
  dataOut,
  walletClient,
  metadataOut,
  config.encryptForProxyConfig,
  authorization
);

console.log('API key encrypted for proxy execution:', result.dataIdentifier);
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

- Initially, the data can only be used by the wallet that encrypted it.
- To share with others, use the [share function](../data-management/share.md).
- The encryptForProxy operation is performed on-chain using EIP-7702 smart accounts and is gasless.
- Debug mode will log transaction details and receipts for troubleshooting.
- The proxy address is embedded in the metadata during encryption to ensure the data can only be used by the specified TEE environment.

## See Also

- [preProcess](../data-processing/preProcess.md) - Prepares data for encryption
- [proxyExecute](../data-access/proxyExecute.md) - Execute API calls using encrypted API keys
- [share](../data-management/share.md) - For sharing access to encrypted data with other wallets
- [ZeroDev 7702 Documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) - For authorization signature details

Last updated on July 3, 2025