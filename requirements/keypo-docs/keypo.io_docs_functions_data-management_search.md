# search

Searches for encrypted data accessible to a wallet by filtering on the name field in metadata.

## Signature

```typescript
async function search(
  searchTerm: string,
  address: string,
  debug?: boolean
): Promise<{ [dataIdentifier: string]: DataInfo }>
```

## Description

The search function retrieves information about all data that has been encrypted using Keypo and is accessible to the specified wallet, filtering the results to only include data whose name field in metadata contains the search term. The function only returns data that the wallet has permission to access, either because it owns the data or because it has been shared with the wallet. The function provides ownership information for each matching piece of data.

The search is performed by first retrieving all accessible data using the [list](list.md) function, then filtering the results based on the search term.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| searchTerm | string | Yes | The term to search for in the name field of metadata. The search is case-insensitive. |
| address | string | Yes | The wallet address to check for accessible encrypted data. |
| debug | boolean | No | When set to `true`, enables debug statements during the search process. Default is `false`. |

## Returns

`Promise<{ [dataIdentifier: string]: DataInfo }>` - A Promise that resolves to a mapping of all matching data that the wallet has access to, where each key is the data identifier and the value contains the data information.

## DataInfo Structure

```typescript
{
  cid: string,                    // IPFS CID of encrypted data
  dataContractAddress: string,    // Smart contract address managing access
  dataIdentifier: string,         // Unique identifier for the data
  dataMetadata: {                 // Metadata associated with the data
    name: string,                 // Human-readable name for the data
    type: string,                 // The detected type of the input data
    mimeType?: string,            // The detected MIME type (present for File/Blob input)
    subtype?: string,             // Additional type information (e.g., 'bigint', 'base64')
    userMetaData?: string         // Any custom metadata provided during preprocessing
  },
  owner: string,                  // The wallet address that owns this data
  isAccessMinted: boolean         // Whether this data was accessed through a minted permission
}
```

## Examples

### Basic Search

```typescript
import { search } from "@keypo/typescript-sdk";

// Search for data with "api" in the name
const matchingData = await search("api", wallet.address, true); // enable debug logs
console.log('Matching data:', matchingData);

// Example output:
// {
//   "0c1c25886ec87526df14b0264778e399801a3f6b7521b71e1d6f89a4884f45ee": {
//     cid: "QmHashString...",
//     dataContractAddress: "0x1234...",
//     dataIdentifier: "0c1c25886ec87526df14b0264778e399801a3f6b7521b71e1d6f89a4884f45ee",
//     dataMetadata: {
//       name: "OpenAI API Key",
//       type: "string",
//       userMetaData: "{\"customField\":\"value\"}"
//     },
//     owner: "0x1234...",
//     isAccessMinted: false
//   },
//   "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab": {
//     cid: "QmAnotherHash...",
//     dataContractAddress: "0x5678...",
//     dataIdentifier: "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab",
//     dataMetadata: {
//       name: "Stripe API Key",
//       type: "string"
//     },
//     owner: "0x5678...",
//     isAccessMinted: true
//   }
// }
```

### Process Search Results

```typescript
import { search } from "@keypo/typescript-sdk";

// Check ownership status for each matching item
const results = await search("config", wallet.address);

Object.entries(results).forEach(([dataId, info]) => {
  if (info.owner === wallet.address) {
    console.log(`You own ${info.dataMetadata.name}`);
  } else {
    console.log(`${info.dataMetadata.name} is owned by ${info.owner}`);
  }

  // Check access method
  if (info.isAccessMinted) {
    console.log(`${info.dataMetadata.name} was accessed through a minted permission`);
  } else {
    console.log(`${info.dataMetadata.name} was directly shared or owned`);
  }
});
```

### Search for Specific Data Types

```typescript
// Search for API keys
const apiKeys = await search("API key", wallet.address);
console.log(`Found ${Object.keys(apiKeys).length} API keys`);

// Search for configuration files
const configs = await search("config", wallet.address);
console.log('Configuration files:', configs);

// Search for credentials
const credentials = await search("credential", wallet.address);
console.log('Credentials:', credentials);
```

### Complete Search and Decrypt Workflow

```typescript
import { search, decrypt, postProcess } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

async function findAndDecryptData(searchTerm: string, walletAddress: string) {
  try {
    // Search for matching data
    const results = await search(searchTerm, walletAddress, true);
    
    if (Object.keys(results).length === 0) {
      console.log(`No data found matching "${searchTerm}"`);
      return;
    }
    
    console.log(`Found ${Object.keys(results).length} items matching "${searchTerm}"`);
    
    // Setup wallet for decryption
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const config = await init("https://api.keypo.io");
    
    // Decrypt the first matching item
    const firstDataId = Object.keys(results)[0];
    const dataInfo = results[firstDataId];
    
    console.log(`Decrypting: ${dataInfo.dataMetadata.name}`);
    
    const { decryptedData, metadata } = await decrypt(
      firstDataId,
      wallet,
      config.decryptConfig
    );
    
    const originalData = postProcess(decryptedData, metadata);
    
    console.log('Decrypted data:', originalData);
    return originalData;
    
  } catch (error) {
    console.error('Search and decrypt failed:', error);
    throw error;
  }
}

// Usage
await findAndDecryptData("OpenAI", wallet.address);
```

### Search with Multiple Terms

```typescript
// Search for multiple terms and combine results
async function searchMultipleTerms(terms: string[], walletAddress: string) {
  const allResults = {};
  
  for (const term of terms) {
    const results = await search(term, walletAddress);
    Object.assign(allResults, results);
  }
  
  // Remove duplicates (objects with same dataIdentifier)
  const uniqueResults = {};
  Object.entries(allResults).forEach(([dataId, info]) => {
    if (!uniqueResults[dataId]) {
      uniqueResults[dataId] = info;
    }
  });
  
  return uniqueResults;
}

// Search for various API-related data
const apiData = await searchMultipleTerms([
  "API",
  "key", 
  "token",
  "credential"
], wallet.address);

console.log(`Found ${Object.keys(apiData).length} API-related items`);
```

### Search and Organize Results

```typescript
async function organizeSearchResults(searchTerm: string, walletAddress: string) {
  const results = await search(searchTerm, walletAddress);
  
  const organized = {
    owned: [],
    shared: [],
    minted: [],
    byType: {}
  };
  
  Object.entries(results).forEach(([dataId, info]) => {
    const item = { dataId, ...info };
    
    // Organize by ownership
    if (info.owner === walletAddress) {
      organized.owned.push(item);
    } else if (info.isAccessMinted) {
      organized.minted.push(item);
    } else {
      organized.shared.push(item);
    }
    
    // Organize by type
    const type = info.dataMetadata.type;
    if (!organized.byType[type]) {
      organized.byType[type] = [];
    }
    organized.byType[type].push(item);
  });
  
  return organized;
}

const organized = await organizeSearchResults("config", wallet.address);
console.log('Organized results:', organized);
```

## Error Handling

```typescript
try {
  const results = await search("my-data", wallet.address);
  
  if (Object.keys(results).length === 0) {
    console.log('No matching data found');
  } else {
    console.log(`Found ${Object.keys(results).length} matching items`);
  }
  
} catch (error) {
  if (error.message.includes('Invalid address')) {
    console.error('The wallet address is invalid');
  } else if (error.message.includes('Network error')) {
    console.error('Unable to connect to Keypo API');
  } else {
    console.error('Search operation failed:', error.message);
  }
}
```

## Search Behavior

### Case Sensitivity
- The search is **case-insensitive**
- "API" will match "api", "Api", "API", etc.

### Matching Algorithm
- Uses **substring matching**
- The search term can match any part of the name field
- "key" will match "API Key", "My Private Key", "keystore", etc.

### Search Scope
- Only searches the `name` field in data metadata
- Does not search other metadata fields like `type`, `userMetaData`, etc.
- Only returns data the wallet has access to (owned or shared)

## Performance Considerations

- **Network calls**: The function makes API calls to retrieve all accessible data first
- **Client-side filtering**: Filtering is performed locally after data retrieval
- **Large datasets**: Performance may be slower for wallets with access to many data items
- **Caching**: Consider caching search results for frequently used terms

## Use Cases

### API Key Management
```typescript
// Find all API keys
const apiKeys = await search("api", wallet.address);
console.log('Available API keys:', Object.keys(apiKeys).map(id => 
  apiKeys[id].dataMetadata.name
));
```

### Configuration File Discovery
```typescript
// Find configuration files
const configs = await search("config", wallet.address);
console.log('Configuration files found:', configs);
```

### Data Organization
```typescript
// Find data by project
const projectData = await search("project-alpha", wallet.address);
```

## Notes

- The search is case-insensitive and uses substring matching
- The search term can match any part of the name field
- The function internally uses the [list](list.md) function to retrieve all accessible data before filtering
- The function only returns data that the wallet has permission to access
- Each piece of data has a unique `dataIdentifier` that should be used for decryption or proxy execution
- The `name` field in metadata is for human readability; it is not required to be unique and can be duplicated across different data items
- The `owner` field indicates the wallet address that has full control over the data
- The `isAccessMinted` field indicates whether the data was accessed through a minted permission rather than direct ownership
- The `userMetaData` field is returned as a JSON stringified string, not as an object
- Use the `dataIdentifier` for all operations that require a unique identifier
- When debug is enabled, the function will log detailed information about the search process, including the search term, address, total files found, and matching files

## See Also

- [list](list.md) - For retrieving all accessible data with advanced filtering options
- [getDataInfo](getDataInfo.md) - For retrieving detailed information about specific data
- [decrypt](../data-access/decrypt.md) - For decrypting found data
- [proxyExecute](../data-access/proxyExecute.md) - For executing API calls with found API keys
- [encrypt](../encryption/encrypt.md) - For encrypting new data
- [share](share.md) - For sharing data with other wallets

Last updated on July 2, 2025

# Keypo SDK Documentation