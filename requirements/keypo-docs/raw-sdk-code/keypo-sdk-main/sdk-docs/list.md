# list

Retrieves information about all encrypted data accessible to a specific wallet, including ownership status, with optional filtering and pagination.

## Signature

```typescript
async function list(
  address: string,
  debug?: boolean,
  apiUrl?: string,
  filter?: {
    filterBy?: {
      field: string;
      value: string | number | boolean;
      operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith';
    };
    sortBy?: {
      field: string;
      direction?: 'asc' | 'desc';
    };
    pagination?: {
      pageSize?: number;
      maxPages?: number;
    };
  }
): Promise<{ [dataIdentifier: string]: DataInfo }>
```

## Description

The `list` function retrieves information about all data that has been encrypted using Keypo and is accessible to the specified wallet. This includes both data that the wallet owns and data that has been shared with the wallet. The function provides comprehensive information including ownership status, access permissions, and metadata for each piece of data.

The function supports advanced filtering, sorting, and pagination capabilities to help manage large datasets efficiently.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | `string` | Yes | The wallet address to check for accessible encrypted data. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the listing process. Default is `false`. |
| `apiUrl` | `string` | No | Custom API URL to use for the request. Defaults to `'https://api.keypo.io'`. |
| `filter` | `object` | No | Optional filtering, sorting, and pagination configuration. |

### Filter Configuration

```typescript
{
  filterBy?: {
    field: string;                                    // Field to filter by (e.g., 'name', 'type')
    value: string | number | boolean;                 // Value to filter for
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith'; // Filter operator (default: 'equals')
  };
  sortBy?: {
    field: string;                                    // Field to sort by (e.g., 'name', 'type')
    direction?: 'asc' | 'desc';                       // Sort direction (default: 'asc')
  };
  pagination?: {
    pageSize?: number;                                // Number of items per page (default: 100)
    maxPages?: number;                                // Maximum number of pages to fetch (default: Infinity)
  };
}
```

## Returns

`Promise<{ [dataIdentifier: string]: DataInfo }>` - A Promise that resolves to a mapping of all accessible data, where each key is the data identifier and the value contains the data information.

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

### Basic Usage

```typescript
// Get information about all accessible data for a wallet
const allDataInfo = await keypo.list(wallet.address, true); // enable debug logs
console.log('All accessible data:', allDataInfo);

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
//   }
// }

// Check ownership status for each item
Object.entries(allDataInfo).forEach(([dataId, info]) => {
  if (info.owner === wallet.address) {
    console.log(`You own ${info.dataMetadata.name}`);
  } else {
    console.log(`${info.dataMetadata.name} is owned by ${info.owner}`);
  }
});
```

### With Filtering and Sorting

```typescript
// Filter data by name containing "API" and sort by name
const filteredData = await keypo.list(wallet.address, false, undefined, {
  filterBy: {
    field: 'name',
    value: 'API',
    operator: 'contains'
  },
  sortBy: {
    field: 'name',
    direction: 'asc'
  },
  pagination: {
    pageSize: 50,
    maxPages: 5
  }
});

console.log('Filtered data:', filteredData);
```

### With Custom API URL

```typescript
// Use a custom API endpoint
const customData = await keypo.list(
  wallet.address,
  true,
  'https://custom-api.keypo.io'
);
```

## Filter Operators

- **equals** (default): Exact match
- **contains**: Substring match (case-insensitive)
- **startsWith**: Prefix match (case-insensitive)
- **endsWith**: Suffix match (case-insensitive)

## Notes

- The function fetches data from both owner and minter endpoints to get complete access information.
- Deleted files are automatically filtered out from the results.
- The function supports pagination to handle large datasets efficiently.
- Each piece of data has a unique `dataIdentifier` that should be used for operations.
- The `name` field in metadata is for human readability, it is not required to be unique and can be duplicated across different data items.
- The `owner` field indicates the wallet address that has full control over the data.
- The `isAccessMinted` field indicates whether the data was accessed through a minted permission rather than direct ownership.
- The `userMetaData` field is returned as a JSON stringified string, not as an object.
- When debug is enabled, the function will log detailed information about the API calls, pagination, and processing steps.
- The function makes multiple API calls to gather complete information about all accessible data.

## API Endpoints Used

The function makes calls to the following endpoints:
- `/graph/filesByOwner` - Retrieves files owned by the specified address
- `/graph/filesByMinter` - Retrieves files shared with the specified address
- `/graph/isDeleted` - Checks if files have been deleted

## See Also

- [getDataInfo](./getDataInfo.md) - For retrieving information about a specific piece of data
- [search](./search.md) - For finding data identifiers filtered by the name metadata field
- [encrypt](./encrypt.md) - For encrypting data
- [encryptForProxy](./encryptForProxy.md) - For encrypting API keys 