# Configuration

This page covers all configuration options and default values for the Keypo SDK.

## Default Configuration Values

Below are the default addresses and identifiers for the baseSepolia test network.

### Network Configuration

- **ChainId**: 84532
- **Chain**: baseSepolia
- **KeypoApiUrl**: https://api.keypo.io

### Contract Addresses

- **RegistryContractAddress**: 0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE
- **DefaultValidationContractAddress**: 0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C

### Protocol Configuration

- **DefaultLitActionCID**: QmZSXvjHKYxM3hsfQcA3WDji2usjvk9Tv6R6t9HSbTRjNw
- **GetFileDataByOwnerSubGraph**: https://gateway.thegraph.com/api/subgraphs/id/3DYoVYkrq6vHDufNpczKRWrPCkhoope Kz4o3sYkhK229

## Configuration Objects

Different SDK functions require specific configuration objects. Here are the structures and their required fields:

### EncryptConfig

Used by the encrypt function:

```typescript
{
  apiUrl: string,                   // API endpoint for encryption service
  validatorAddress: string,         // Address of the validator contract
  registryContractAddress: string,  // Address of the registry contract
  bundlerRpcUrl: string            // RPC URL for the bundler
}
```

Example:

```typescript
const encryptForProxyConfig = {
  apiUrl: 'https://api.keypo.io',
  validatorAddress: '0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C',
  registryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  zerodevRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID',
  proxyAddress: '0xYOUR_PROXY_CONTRACT_ADDRESS'
};
```

### DecryptConfig

Used by the decrypt function:

```typescript
{
  registryContractAddress: string,  // Address of the registry contract
  chain: string,                   // Chain identifier
  expiration: string,              // Expiration time for access (ISO time)
  apiUrl: string                   // API endpoint for decryption service
}
```

Example:

```typescript
const decryptConfig = {
  registryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  chain: 'baseSepolia',
  expiration: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  apiUrl: 'https://api.keypo.io'
};
```

### ShareConfig

Used by the shareData function:

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry
  bundlerRpcUrl: string                      // RPC URL for the bundler
}
```

Example:

```typescript
const shareConfig = {
  permissionsRegistryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  bundlerRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID'
};
```

### DeleteConfig

Used by the deleteData function:

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry
  bundlerRpcUrl: string                      // RPC URL for the bundler
}
```

Example:

```typescript
const deleteConfig = {
  permissionsRegistryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  bundlerRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID'
};
```

## Authorization Requirements

Most functions require EIP-7702 authorization signatures. Here's how to configure them:

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

For Privy, Dynamic, and Turnkey integrations, consult the [ZeroDev 7702 documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) for wallet-specific implementation details.

## Bundler Requirements

Functions that use EIP-7702 smart accounts require a bundler RPC endpoint. We recommend using ZeroDev's bundler service.

### ZeroDev Configuration

1. Sign up at [ZeroDev](https://zerodev.app)
2. Create a new project
3. Get your project ID
4. Use the RPC URL format: `https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID`

### Alternative Bundlers

Other compatible bundlers can be found in the [ZeroDev infrastructure documentation](https://docs.zerodev.app/smart-accounts/infrastructure). The SDK works with any account abstraction bundler/paymaster including:

- **Biconomy**: For alternative account abstraction solutions
- **Alchemy**: Account Kit compatible bundlers
- **Custom bundlers**: Any EIP-4337 compatible bundler

## Environment Setup

### Development Configuration

For development and testing:

```typescript
const devConfig = {
  apiUrl: 'https://api.keypo.io',
  validatorAddress: '0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C',
  registryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  bundlerRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/YOUR_DEV_PROJECT_ID'
};
```

### Production Configuration

For production environments, ensure you:

1. Use production bundler endpoints
2. Configure proper error handling
3. Set appropriate expiration times
4. Monitor contract addresses for updates

## Network Configuration

### Base Sepolia Testnet

The SDK currently operates on Base Sepolia testnet:

- **Network Name**: Base Sepolia
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org/

### Adding Base Sepolia to MetaMask

```javascript
// Network configuration for MetaMask
const baseSepoliaNetwork = {
  chainId: '0x14a34', // 84532 in hex
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org/'],
};
```

## API Endpoints

### Primary Endpoints

- **Main API**: https://api.keypo.io
- **SubGraph**: https://gateway.thegraph.com/api/subgraphs/id/3DYoVYkrq6vHDufNpczKRWrPCkhoope Kz4o3sYkhK229

### Endpoint Functions

Different functions use different API endpoints:

- **Encryption operations**: `/encrypt`, `/encryptForProxy`
- **Decryption operations**: `/decrypt`, `/proxyExecute`
- **Data management**: `/graph/filesByOwner`, `/graph/filesByMinter`
- **Metadata retrieval**: `/graph/fileMetadata`, `/graph/isDeleted`

## Common Configuration Patterns

### Complete Setup Example

```typescript
// 1. Set up wallet client
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http()
});

// 2. Configuration objects
const baseConfig = {
  apiUrl: 'https://api.keypo.io',
  validatorAddress: '0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C',
  registryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  bundlerRpcUrl: `https://rpc.zerodev.app/api/v2/bundler/${process.env.ZERODEV_PROJECT_ID}`
};

// 3. Get authorization
const authorization = await walletClient.signAuthorization({
  account,
  contractAddress: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  chainId: baseSepolia.id,
  nonce: 0
});

// 4. Ready to use SDK functions
const { dataOut, metadataOut } = keypo.preProcess(data, 'my-data');
const result = await keypo.encrypt(dataOut, walletClient, metadataOut, authorization, baseConfig);
```

## Environment Variables

Consider using environment variables for configuration:

```bash
# .env file
PRIVATE_KEY=0x...
ZERODEV_PROJECT_ID=your_project_id
KEYPO_API_URL=https://api.keypo.io
REGISTRY_CONTRACT_ADDRESS=0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE
VALIDATOR_CONTRACT_ADDRESS=0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C
```

## Troubleshooting

### Common Configuration Issues

1. **Invalid bundler URL**: Ensure your ZeroDev project ID is correct
2. **Network mismatch**: Verify all contracts are on Base Sepolia
3. **Authorization errors**: Check that the authorization contract address is correct
4. **API timeouts**: Confirm API endpoints are reachable

### Debug Configuration

Enable debug mode in SDK functions to troubleshoot configuration issues:

```typescript
const result = await keypo.encrypt(
  dataOut,
  walletClient,
  metadataOut,
  authorization,
  config,
  true // Enable debug logging
);
```

## Security Considerations

### Configuration Security

- **Never commit private keys**: Use environment variables or secure key management
- **Validate contract addresses**: Ensure you're using correct, verified contracts
- **Monitor for updates**: Contract addresses may change with protocol upgrades
- **Use HTTPS**: Always use secure endpoints for API calls

### Access Control

- **Least privilege**: Only grant necessary permissions
- **Regular audits**: Periodically review data access using list function
- **Secure storage**: Protect configuration files and environment variables

## EncryptForProxyConfig

Used by the encryptForProxy function:

```typescript
{
  apiUrl: string,                   // API endpoint for encryption service
  validatorAddress: string,         // Address of the validator contract
  registryContractAddress: string,  // Address of the registry contract
  zerodevRpcUrl: string,           // RPC URL for the bundler
  proxyAddress: string             // Address of the proxy contract that will execute
}
```

Example:

```typescript
const encryptForProxyConfig = {
  apiUrl: 'https://api.keypo.io',
  validatorAddress: '0x35ADB6b999AbcD5C9CdF2262c7190C7b96ABcE4C',
  registryContractAddress: '0x8370eE1a51B5F31cc10E2f4d786Ff20198B10BBE',
  zerodevRpcUrl: 'https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID',
  proxyAddress: '0xYOUR_PROXY_CONTRACT_ADDRESS'
};
```

Last updated on June 21, 2025