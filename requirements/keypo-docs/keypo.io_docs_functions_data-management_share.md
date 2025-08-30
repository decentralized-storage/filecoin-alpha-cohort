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

The shareData function allows you to grant access to encrypted data to other wallets. This is useful when you want to share your encrypted data with other users while maintaining control over who can access it. The function requires the wallet that originally encrypted the data or has sharing permissions.

**Important**: This function uses EIP-7702 smart accounts powered by ZeroDev to make the experience gasless to the end user, which requires an authorization signature. This will not work with injected wallet providers like MetaMask, but is compatible with wallets where the private key is available or with embedded wallets such as Privy, Dynamic, and Turnkey.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIdentifier | string | Yes | The unique identifier of the encrypted data to share. |
| walletClient | Client<Transport, Chain, Account> | Yes | The viem wallet client with the account that has permission to share the data. |
| recipientAddresses | string[] | Yes | Array of wallet addresses to grant access to. |
| config | ShareConfig | Yes | Configuration object containing contract addresses and RPC endpoints. |
| authorization | any | Yes | The EIP-7702 authorization signature. See [signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) for details. |
| debug | boolean | No | When set to `true`, enables debug statements during the sharing process. Default is `false`. |

## ShareConfig Structure

**Note**: use [init](init.md) to automatically load the config.

```typescript
{
  permissionsRegistryContractAddress: string, // Address of the permissions registry
  bundlerRpcUrl: string                      // RPC URL for the bundler (recommended ZeroDev)
}
```

## Returns

`Promise<void>` - A Promise that resolves when the sharing operation is completed.

## Examples

### Basic Usage

```typescript
// import relevant libraries
import { init, shareData } from "@keypo/typescript-sdk";
import { http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

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

await shareData(
  dataId,
  walletClient,
  recipientAddresses,
  config.shareConfig,
  authorization,
  true // enable debug logs
);

console.log('Data shared successfully');
```

### Complete Sharing Workflow

```typescript
import { init, shareData, list, search } from "@keypo/typescript-sdk";
import { http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

async function shareMyData() {
  try {
    // Setup configuration
    const config = await init("https://api.keypo.io");
    
    // Setup wallet
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.RPC_URL)
    });
    
    const authorization = await walletClient.signAuthorization({
      contractAddress: config.kernelAddress as `0x${string}`,
    });

    // Find data to share (search for API keys)
    const apiKeys = await search("API key", account.address);
    
    if (Object.keys(apiKeys).length === 0) {
      console.log("No API keys found to share");
      return;
    }
    
    // Get the first API key
    const dataId = Object.keys(apiKeys)[0];
    const dataInfo = apiKeys[dataId];
    
    console.log(`Sharing: ${dataInfo.dataMetadata.name}`);
    
    // Recipients who will get access
    const recipients = [
      "0x742d35Cc4Bf4Cc5f6Bc5A5CE7e5e8feBb6BA0Cfe",
      "0x742d35Cc4Bf4Cc5f6Bc5A5CE7e5e8feBb6BA0Cfe"
    ];
    
    // Share the data
    await shareData(
      dataId,
      walletClient,
      recipients,
      config.shareConfig,
      authorization,
      true // Enable debug mode
    );
    
    console.log(`Successfully shared ${dataInfo.dataMetadata.name} with ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Sharing failed:', error);
    throw error;
  }
}
```

### Share Multiple Data Items

```typescript
async function shareMultipleItems(dataIds: string[], recipients: string[]) {
  const config = await init("https://api.keypo.io");
  
  // Setup wallet client
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });
  
  const authorization = await walletClient.signAuthorization({
    contractAddress: config.kernelAddress as `0x${string}`,
  });

  // Share each data item
  for (const dataId of dataIds) {
    try {
      await shareData(
        dataId,
        walletClient,
        recipients,
        config.shareConfig,
        authorization
      );
      
      console.log(`Shared data ${dataId} successfully`);
      
    } catch (error) {
      console.error(`Failed to share data ${dataId}:`, error);
    }
  }
}

// Usage
const dataToShare = ["0x123...", "0x456...", "0x789..."];
const teamMembers = ["0xabc...", "0xdef..."];
await shareMultipleItems(dataToShare, teamMembers);
```

### Share with Team Management

```typescript
interface TeamMember {
  address: string;
  name: string;
  role: string;
}

async function shareWithTeam(
  dataIdentifier: string, 
  teamMembers: TeamMember[],
  dataName?: string
) {
  try {
    const config = await init("https://api.keypo.io");
    
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });
    
    const authorization = await walletClient.signAuthorization({
      contractAddress: config.kernelAddress as `0x${string}`,
    });

    // Extract just the addresses
    const addresses = teamMembers.map(member => member.address);
    
    console.log(`Sharing ${dataName || 'data'} with team:`);
    teamMembers.forEach(member => {
      console.log(`- ${member.name} (${member.role}): ${member.address}`);
    });
    
    await shareData(
      dataIdentifier,
      walletClient,
      addresses,
      config.shareConfig,
      authorization,
      true
    );
    
    console.log('Successfully shared with entire team!');
    
  } catch (error) {
    console.error('Team sharing failed:', error);
    throw error;
  }
}

// Usage
const myTeam: TeamMember[] = [
  { address: "0x123...", name: "Alice", role: "Developer" },
  { address: "0x456...", name: "Bob", role: "Designer" },
  { address: "0x789...", name: "Charlie", role: "Manager" }
];

await shareWithTeam("dataId123", myTeam, "OpenAI API Key");
```

### Conditional Sharing Based on Data Type

```typescript
async function shareBasedOnDataType(walletAddress: string, recipients: string[]) {
  const config = await init("https://api.keypo.io");
  
  // Get all owned data
  const allData = await list(walletAddress);
  
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });
  
  const authorization = await walletClient.signAuthorization({
    contractAddress: config.kernelAddress as `0x${string}`,
  });

  // Share different data types with different groups
  for (const [dataId, info] of Object.entries(allData)) {
    // Only share data we own
    if (info.owner !== walletAddress) continue;
    
    let shouldShare = false;
    let shareWith = recipients;
    
    // Determine sharing logic based on data name/type
    if (info.dataMetadata.name.toLowerCase().includes('config')) {
      // Share config files with developers only
      shareWith = recipients.slice(0, 2); // First 2 recipients
      shouldShare = true;
    } else if (info.dataMetadata.name.toLowerCase().includes('api')) {
      // Share API keys with all team members
      shouldShare = true;
    }
    
    if (shouldShare) {
      try {
        await shareData(
          dataId,
          walletClient,
          shareWith,
          config.shareConfig,
          authorization
        );
        
        console.log(`Shared ${info.dataMetadata.name} with ${shareWith.length} recipients`);
        
      } catch (error) {
        console.error(`Failed to share ${info.dataMetadata.name}:`, error);
      }
    }
  }
}
```

## With Embedded Wallets

Keypo works with the following embedded wallets: Privy, Dynamic and Turnkey.

You need to pass the embedded wallet as Viem wallet client to the share function in order for it to work properly. Please consult the embedded wallet's documentation on guidelines for how to do that.

### Privy Integration Example

```typescript
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';

function ShareWithPrivy({ dataId, recipients }) {
  const { wallets } = useWallets();
  
  const shareData = async () => {
    const wallet = wallets[0]; // Get the first wallet
    
    // Create wallet client from Privy wallet
    const walletClient = createWalletClient({
      account: wallet.address,
      chain: baseSepolia,
      transport: custom(wallet.getEthereumProvider())
    });
    
    const authorization = await walletClient.signAuthorization({
      contractAddress: config.kernelAddress as `0x${string}`,
    });
    
    await shareData(
      dataId,
      walletClient, 
      recipients,
      config.shareConfig,
      authorization
    );
  };
  
  return <button onClick={shareData}>Share Data</button>;
}
```

## Authorization Requirements

This function requires an EIP-7702 authorization signature. The authorization must be signed by the account that has permission to share the data.

### Getting Authorization Signatures

#### With Known Private Keys

```typescript
const authorization = await walletClient.signAuthorization({
  contractAddress: config.kernelAddress as `0x${string}`, // Kernel V3.3 implementation
});
```

#### With Embedded Wallets

For Privy, Dynamic, and Turnkey integrations, consult the [ZeroDev 7702 documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) for wallet-specific implementation details.

## Error Handling

```typescript
try {
  await shareData(
    dataIdentifier,
    walletClient,
    recipientAddresses,
    config.shareConfig,
    authorization
  );
  
  console.log('Data shared successfully');
  
} catch (error) {
  if (error.message.includes('Permission denied')) {
    console.error('You do not have permission to share this data');
  } else if (error.message.includes('Invalid recipient')) {
    console.error('One or more recipient addresses are invalid');
  } else if (error.message.includes('Data not found')) {
    console.error('The specified data identifier does not exist');
  } else {
    console.error('Sharing operation failed:', error.message);
  }
}
```

## Access Control

### Permission Requirements

To share data, the wallet must:

1. **Own the data**: Be the original wallet that encrypted the data, OR
2. **Have sharing permissions**: Have been granted sharing permissions by the owner

### Sharing Limitations

- Only data owners can grant sharing permissions initially
- Recipients receive read-only access to the data
- Recipients cannot further share the data unless explicitly granted sharing permissions
- Access can be revoked by the data owner at any time

## Performance Considerations

- **Gas costs**: While gasless for users, sharing operations consume gas through ZeroDev bundling
- **Multiple recipients**: Sharing with multiple recipients in one transaction is more efficient than individual transactions
- **Batch operations**: Consider batching multiple sharing operations when possible
- **Network delays**: On-chain operations may take time to confirm

## Security Considerations

### Recipient Validation

```typescript
// Validate recipient addresses before sharing
function validateAddresses(addresses: string[]): boolean {
  return addresses.every(address => {
    // Check if it's a valid Ethereum address
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  });
}

const recipients = ["0x123...", "0x456..."];
if (!validateAddresses(recipients)) {
  throw new Error("Invalid recipient addresses provided");
}
```

### Access Auditing

```typescript
// Log sharing activities for audit purposes
async function auditableShare(
  dataId: string,
  recipients: string[],
  reason: string
) {
  console.log(`Sharing data ${dataId} with ${recipients.length} recipients`);
  console.log(`Reason: ${reason}`);
  console.log(`Recipients: ${recipients.join(', ')}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  await shareData(dataId, walletClient, recipients, config.shareConfig, authorization);
  
  console.log(`Sharing completed successfully at ${new Date().toISOString()}`);
}
```

## Notes

- The function requires the wallet to be the same wallet that encrypted the data originally.
- Use [list](list.md) or [search](search.md) to find the data identifier for data you want to share.
- The function can share with multiple recipients in a single transaction.
- The sharing operation is performed on-chain using EIP-7702 smart accounts and is gasless.
- Debug mode will log transaction details and receipts for troubleshooting.
- Recipients will be able to access the shared data using the [decrypt](../data-access/decrypt.md) function.
- Shared access permissions are managed on-chain and can be verified using [getDataInfo](getDataInfo.md).

## Use Cases

### Team Collaboration

```typescript
// Share project resources with team members
await shareData(
  projectConfigId,
  walletClient,
  teamMemberAddresses,
  config.shareConfig,
  authorization
);
```

### API Key Distribution

```typescript
// Share API keys with authorized developers
const apiKeys = await search("API", ownerAddress);
for (const [dataId, info] of Object.entries(apiKeys)) {
  await shareData(dataId, walletClient, developerAddresses, config.shareConfig, authorization);
}
```

### Temporary Access Grants

```typescript
// Share sensitive data with contractors for limited time
await shareData(
  sensitiveDataId,
  walletClient,
  contractorAddresses,
  config.shareConfig,
  authorization
);

// Note: Access can be revoked later using access management functions
```

## See Also

- [list](list.md) - For finding data identifiers
- [search](search.md) - For finding data identifiers filtered by the name metadata field
- [encrypt](../encryption/encrypt.md) - For encrypting data
- [encryptForProxy](../encryption/encryptForProxy.md) - For encrypting API keys
- [getDataInfo](getDataInfo.md) - For checking data access permissions
- [delete](delete.md) - For permanently deleting shared data
- [ZeroDev 7702 Documentation](https://docs.zerodev.app/smart-accounts/signers/eip-7702) - For EIP-7702 integration guides
- [Viem signAuthorization](https://viem.sh/docs/actions/wallet/signAuthorization) - For authorization signature details

Last updated on July 3, 2025

# Keypo SDK Documentation