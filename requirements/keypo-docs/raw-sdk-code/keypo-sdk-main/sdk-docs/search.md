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

The `search` function retrieves information about all data that has been encrypted using Keypo and is accessible to the specified wallet, filtering the results to only include data whose name field in metadata contains the search term. The function only returns data that the wallet has permission to access, either because it owns the data or because it has been shared with the wallet. The function provides ownership information for each matching piece of data.

The search is performed by first retrieving all accessible data using the `list` function, then filtering the results based on the search term.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `searchTerm` | `string` | Yes | The term to search for in the name field of metadata. The search is case-insensitive. |
| `address` | `string` | Yes | The wallet address to check for accessible encrypted data. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the search process. Default is `false`. |

## Returns

`Promise<{ [dataIdentifier: string]: DataInfo }>` - A Promise that resolves to a mapping of all matching data that the wallet has access to, where each key is the data identifier and the value contains the data information.

### DataInfo Structure

```typescript
{
  cid: string,              // IPFS CID of encrypted data
  dataContractAddress: string, // Smart contract address managing access
  dataIdentifier: string,   // Unique identifier for the data
  dataMetadata: {           // Metadata associated with the data
    name: string,           // Human-readable name for the data
    type: string,           // The detected type of the input data
    mimeType?: string,      // The detected MIME type (present for File/Blob inputs)
    subtype?: string,       // Additional type information (e.g., 'bigint', 'base64', 'json')
    userMetaData?: string   // Any custom metadata provided during preprocessing (JSON stringified)
  },
  owner: string,            // The wallet address that owns this data
  isAccessMinted: boolean   // Whether this data was accessed through a minted permission
}
```

## Examples

```typescript
// Search for data with "api" in the name
const matchingData = await keypo.search("api", wallet.address, true); // enable debug logs
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

// Check ownership status for each matching item
Object.entries(matchingData).forEach(([dataId, info]) => {
  if (info.owner === wallet.address) {
    console.log(`You own ${info.dataMetadata.name}`);
  } else {
    console.log(`${info.dataMetadata.name} is owned by ${info.owner}`);
  }
  
  // Check access method
  if (info.isAccessMinted) {
    console.log(`${info.dataMetadata.name} was accessed through a minted permission`);
  }
});
```

## Notes

- The search is case-insensitive and uses substring matching
- The search term can match any part of the name field
- The function internally uses the `list` function to retrieve all accessible data before filtering
- The function only returns data that the wallet has permission to access
- Each piece of data has a unique `dataIdentifier` that should be used for operations
- The `name` field in metadata is for human readability, it is not required to be unique and can be duplicated across different data items
- The `owner` field indicates the wallet address that has full control over the data
- The `isAccessMinted` field indicates whether the data was accessed through a minted permission rather than direct ownership
- The `userMetaData` field is returned as a JSON stringified string, not as an object
- Use the `dataIdentifier` for all operations that require a unique identifier
- When debug is enabled, the function will log detailed information about the search process, including the search term, address, total files found, and matching files

## Implementation Details

The function works by:
1. Calling the `list` function to retrieve all accessible data for the wallet
2. Converting the search term to lowercase for case-insensitive comparison
3. Filtering the results to only include files whose name contains the search term
4. Returning the filtered results in the same format as the `list` function

## See Also

- [list](./list.md) - For retrieving information about all accessible data
- [getDataInfo](./getDataInfo.md) - For retrieving information about a specific piece of data
- [encrypt](./encrypt.md) - For encrypting data
- [encryptForProxy](./encryptForProxy.md) - For encrypting API keys 