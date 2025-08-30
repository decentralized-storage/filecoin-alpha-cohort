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

The list function retrieves information about all data that has been encrypted using Keypo and is accessible to the specified wallet. This includes both data that the wallet owns and data that has been shared with the wallet. The function provides comprehensive information including ownership status, access permissions, and metadata for each piece of data.

The function supports advanced filtering, sorting, and pagination capabilities to help manage large datasets efficiently.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | The wallet address to check for accessible encrypted data. |
| debug | boolean | No | When set to `true`, enables debug statements during the listing process. Default is `false`. |
| apiUrl | string | No | Custom API URL to use for the request. Defaults to 'https://api.keypo.io'. |
| filter | object | No | Optional filtering, sorting, and pagination configuration. |

## Filter Configuration

```typescript
{
  filterBy?: {
    field: string;          // Field to filter by (e.g., 'name', 'type')
    value: string | number | boolean; // Value to filter for
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith'; // Filter operator
  };
  sortBy?: {
    field: string;          // Field to sort by (e.g., 'name', 'type')
    direction?: 'asc' | 'desc'; // Sort direction (default: 'asc')
  };
  pagination?: {
    pageSize?: number;      // Number of items per page
    maxPages?: number;      // Maximum number of pages
  };
}
```

## Returns

`Promise<{ [dataIdentifier: string]: DataInfo }>` - A Promise that resolves to a mapping of all accessible data, where each key is the data identifier and the value contains the data information.

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

### Basic Usage

```typescript
import { list } from "@keypo/typescript-sdk";

// Get information about all accessible data for a wallet
const allDataInfo = await list(wallet.address, true); // enable debug logs
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
const filteredData = await list(wallet.address, false, undefined, {
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

### Advanced Filtering Examples

```typescript
// Find all data owned by the current wallet
const ownedData = await list(wallet.address, false, undefined, {
  filterBy: {
    field: 'owner',
    value: wallet.address,
    operator: 'equals'
  }
});

// Find all string data types
const stringData = await list(wallet.address, false, undefined, {
  filterBy: {
    field: 'type',
    value: 'string',
    operator: 'equals'
  }
});

// Find data with names starting with "Config"
const configData = await list(wallet.address, false, undefined, {
  filterBy: {
    field: 'name',
    value: 'Config',
    operator: 'startsWith'
  },
  sortBy: {
    field: 'name',
    direction: 'asc'
  }
});
```

### Complete Data Management Example

```typescript
import { list, getDataInfo, search } from "@keypo/typescript-sdk";

async function manageMyData(walletAddress: string) {
  try {
    // Get all accessible data
    const allData = await list(walletAddress);
    
    console.log(`Found ${Object.keys(allData).length} accessible data items`);
    
    // Separate owned vs shared data
    const ownedData = [];
    const sharedData = [];
    
    Object.entries(allData).forEach(([dataId, info]) => {
      if (info.owner === walletAddress) {
        ownedData.push({ dataId, ...info });
      } else {
        sharedData.push({ dataId, ...info });
      }
    });
    
    console.log(`You own ${ownedData.length} items`);
    console.log(`${sharedData.length} items have been shared with you`);
    
    // List all API keys
    const apiKeys = await list(walletAddress, false, undefined, {
      filterBy: {
        field: 'name',
        value: 'API',
        operator: 'contains'
      }
    });
    
    console.log(`Found ${Object.keys(apiKeys).length} API keys`);
    
    // Get detailed info for first API key
    if (Object.keys(apiKeys).length > 0) {
      const firstApiKeyId = Object.keys(apiKeys)[0];
      const detailedInfo = await getDataInfo(firstApiKeyId);
      console.log('Detailed API key info:', detailedInfo);
    }
    
  } catch (error) {
    console.error('Data management failed:', error);
  }
}
```

### Pagination Example

```typescript
// Handle large datasets with pagination
async function getAllDataPaginated(walletAddress: string) {
  let allData = {};
  let page = 1;
  const pageSize = 100;
  
  while (page <= 10) { // Limit to 10 pages max
    const pageData = await list(walletAddress, false, undefined, {
      pagination: {
        pageSize: pageSize,
        maxPages: 1
      },
      sortBy: {
        field: 'name',
        direction: 'asc'
      }
    });
    
    if (Object.keys(pageData).length === 0) {
      break; // No more data
    }
    
    allData = { ...allData, ...pageData };
    page++;
  }
  
  return allData;
}
```

## Filter Operators

- **equals** (default): Exact match
- **contains**: Substring match (case-insensitive)
- **startsWith**: Prefix match (case-insensitive)
- **endsWith**: Suffix match (case-insensitive)

## Filterable Fields

The following fields can be used for filtering:

- **name**: Human-readable name of the data
- **type**: Data type (e.g., 'string', 'file', 'object')
- **owner**: Wallet address that owns the data
- **mimeType**: MIME type for file/blob data
- **subtype**: Additional type information
- **userMetaData**: Custom metadata (searches within JSON string)

## Sortable Fields

The following fields can be used for sorting:

- **name**: Sort by human-readable name
- **type**: Sort by data type
- **owner**: Sort by owner address
- **timestamp**: Sort by creation time (if available)

## Error Handling

```typescript
try {
  const dataList = await list(walletAddress, false, undefined, {
    filterBy: {
      field: 'name',
      value: 'test',
      operator: 'contains'
    }
  });
  
  console.log('Data retrieved successfully:', dataList);
  
} catch (error) {
  if (error.message.includes('Invalid address')) {
    console.error('The wallet address is invalid');
  } else if (error.message.includes('Network error')) {
    console.error('Unable to connect to Keypo API');
  } else {
    console.error('List operation failed:', error.message);
  }
}
```

## Notes

- Deleted files are automatically filtered out from the results.
- The function supports pagination to handle large datasets efficiently.
- Each piece of data has a unique `dataIdentifier` that should be used for operations.
- The `name` field in metadata is for human readability; it is not required to be unique and can be duplicated across different data items.
- The `owner` field indicates the wallet address that has full control over the data.
- The `isAccessMinted` field indicates whether the data was shared with the user's wallet vs. owned.
- The `userMetaData` field is returned as a JSON stringified string, not as an object.
- When debug is enabled, the function will log detailed information about the API calls, pagination, and processing steps.

## Performance Considerations

- **Large datasets**: Use pagination to avoid memory issues with large result sets
- **Filtering**: Apply filters to reduce network traffic and processing time
- **Caching**: Consider caching results locally for frequently accessed data lists
- **Rate limiting**: Be mindful of API rate limits when making frequent requests

## Use Cases

### Data Organization

```typescript
// Organize data by type
const dataByType = {};
const allData = await list(walletAddress);

Object.entries(allData).forEach(([dataId, info]) => {
  const type = info.dataMetadata.type;
  if (!dataByType[type]) {
    dataByType[type] = [];
  }
  dataByType[type].push({ dataId, ...info });
});

console.log('Data organized by type:', dataByType);
```

### Access Control Audit

```typescript
// Audit access permissions
const allData = await list(walletAddress);
const accessAudit = {
  owned: [],
  shared: [],
  minted: []
};

Object.entries(allData).forEach(([dataId, info]) => {
  if (info.owner === walletAddress) {
    accessAudit.owned.push({ dataId, name: info.dataMetadata.name });
  } else if (info.isAccessMinted) {
    accessAudit.minted.push({ dataId, name: info.dataMetadata.name, owner: info.owner });
  } else {
    accessAudit.shared.push({ dataId, name: info.dataMetadata.name, owner: info.owner });
  }
});

console.log('Access audit:', accessAudit);
```

## See Also

- [getDataInfo](getDataInfo.md) - For retrieving information about a specific piece of data
- [search](search.md) - For finding data identifiers filtered by the name metadata field
- [encrypt](../encryption/encrypt.md) - For encrypting data
- [encryptForProxy](../encryption/encryptForProxy.md) - For encrypting API keys
- [share](share.md) - For sharing data with other wallets
- [delete](delete.md) - For permanently deleting data

Last updated on July 2, 2025

# Keypo SDK Documentation