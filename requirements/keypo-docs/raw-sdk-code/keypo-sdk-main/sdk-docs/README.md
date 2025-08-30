# Keypo SDK Documentation

The Keypo SDK provides a simple interface for encrypting, sharing and managing sensitive data using Keypo. This documentation covers all aspects of the SDK's functionality.

## Key Features

- **Decryption keys are stored on Lit Protocol's distributed key management network and are self custodied by the wallet.**
- **Permissions are managed on-chain by Keypo's smart contracts on Base Sepolia network. The top level smart contract can be found at 0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE.**
- **The SDK is a gassless experience powered by ZeroDev. The SDK is also compatible with embedded wallets like Privy which means you can use the SDK with email.**
- **All encrypted data is stored on IPFS and can only ***be decrypted by authorized wallets.*****

## What You Can Do

- **Encrypt and share sensitive documents** - Upload confidential files and grant access to specific wallets without exposing the content
- **Secure API key delegation** - Store API keys encrypted and delegate access to others who can then execute API calls without learning the underlying API key
- **Build privacy-preserving applications** - Create dApps that handle sensitive user data while maintaining full user control and ownership

## Main Functions

### Data Processing
- [preProcess](./preProcess.md) - Prepare data for encryption
- [postProcess](./postProcess.md) - Restore decrypted data to its original format

### Data Encryption
- [encrypt](./encrypt.md) - Encrypt data with standard access control using EIP-7702 smart accounts
- [encryptForProxy](./encryptForProxy.md) - Encrypt API keys for proxy execution using EIP-7702 smart accounts

### Data Access
- [decrypt](./decrypt.md) - Decrypt and access encrypted data
- [proxyExecute](./proxyExecute.md) - Execute API calls using encrypted API keys

### Data Management
- [share](./share.md) - Share access to encrypted data with other wallets using EIP-7702 smart accounts
- [delete](./delete.md) - Permanently delete encrypted data using EIP-7702 smart accounts
- [list](./list.md) - View all accessible encrypted data with filtering and pagination
- [getDataInfo](./getDataInfo.md) - Get detailed information about specific encrypted data
- [search](./search.md) - Search for encrypted data by name

## Flow Diagrams

### Standard Encryption/Decryption Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Unencrypted │     │  preProcess │     │   encrypt   │     │    IPFS     │
│    Data     │────▶│             │────▶│             │────▶│  Storage    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                    │
                                                                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Decrypted  │     │  postProcess│     │   decrypt   │     │  Encrypted  │
│    Data     │◀────│             │◀────│             │◀────│    Data     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Proxy Execution Flow
```
┌─────────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│   API Key   │     │  preProcess │     │encryptForProxy│     │    IPFS     │
│             │────▶│             │────▶│               │────▶│  Storage    │
└─────────────┘     └─────────────┘     └───────────────┘     └─────────────┘
                                                                    │
                                                                    |
┌─────────────┐     ┌─────────────┐     ┌─────────────┐             |
│    API      │     │ proxyExecute│     │  Encrypted  │◀─────────────         
│  Response   │◀────│             │◀────│    Data     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Type Definitions

See the [glossary](./glossary.md) for detailed information about all TypeScript interfaces and types used in the SDK.

## Key Concepts

### Data Identifiers
- Each piece of encrypted data has a unique `dataIdentifier`
- Human-readable names are stored in metadata, they are not required to be unique
- Use `list` or `getDataInfo` to look up data by its identifier

### Access Control
- Data owners have full, self-custody control over their encrypted data
- Access controls are mediated by EVM smart contracts using EIP-7702 smart accounts
- Access conditions can be updated in place on previously encrypted data, without requiring re-encryption

### Proxy Execution
- API keys can be encrypted for use in a trusted execution environment (TEE)
- Proxy execution allows API calls to be made without exposure of the encrypted key
- The encryption and execution flow for this case is specified below

### EIP-7702 Smart Accounts
- The SDK uses EIP-7702 smart accounts powered by ZeroDev for a gassless experience
- All blockchain operations (encrypt, share, delete) require authorization signatures
- Compatible with wallets where private keys are available or embedded wallets (Privy, Dynamic, Turnkey)
- Not compatible with injected wallet providers like MetaMask

## Default Configuration Values

Below are the default addresses and identifiers for the `baseSepolia` test network.

- **KeypoApiUrl**: `https://api.keypo.io`
- **RegistryContractAddress**: `0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE`
- **DefaultValidationContractAddress**: `0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C`
- **DefaultLitActionCID**: `QmZSXvjHKYxM3hsfQcA3WDji2usjvk9Tv6R6t9HSbTRjNw`
- **ChainId**: `84532`
- **Chain**: `baseSepolia`
- **GetFileDataByOwnerSubGraph**: `https://gateway.thegraph.com/api/subgraphs/id/3DYoVYkrq6vHDufNpczKRWrPCkhoopeKz4o3sYkhK229`

## Getting Started

1. Import the Keypo SDK
2. Initialize your wallet client (viem) and get authorization signatures
3. Use `preProcess` to prepare your data for encryption
4. Encrypt your data using either `encrypt` or `encryptForProxy` with EIP-7702 smart accounts
5. Use `list`, `getDataInfo` or `search` to view your accessible data
6. Share access with other wallets using `share`
7. Access data using `decrypt` or `proxyExecute`

## Authorization Requirements

Most functions require EIP-7702 authorization signatures. For detailed instructions on obtaining authorization signatures:

### With Known Private Keys
```typescript
const authorization = await walletClient.signAuthorization({
  account,
  contractAddress: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  chainId: baseSepolia.id,
  nonce: 0
});
```

### With Embedded Wallets
For Privy, Dynamic, and Turnkey integrations, consult the [ZeroDev 7702 documentation](https://7702.zerodev.app/) for wallet-specific implementation details.

## Bundler Requirements

Functions that use EIP-7702 smart accounts require a bundler RPC endpoint. We recommend using ZeroDev's bundler service, but other compatible bundlers can be found in the [ZeroDev infrastructure documentation](https://docs.zerodev.app/meta-infra/rpcs).

## Best Practices

- Always use `preProcess` before encryption
- Use `list` to look up the `dataIdentifier` for a given piece of encrypted data
- Verify ownership before performing management operations
- Use proxy execution for API keys
- Check operation results for success status
- Use proper authorization signatures for all blockchain operations
- Configure bundler RPC endpoints for EIP-7702 operations

## Compatibility

- ✅ Wallets with known private keys
- ✅ Embedded wallets (Privy, Dynamic, Turnkey)
- ❌ Injected wallet providers (MetaMask, WalletConnect, etc.)

## See Also

- [Glossary](./glossary.md) - Complete type definitions and interfaces
- [ZeroDev 7702 Documentation](https://7702.zerodev.app/) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/eip7702/signAuthorization) - For authorization signature details