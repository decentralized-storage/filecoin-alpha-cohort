# getDataInfo

Retrieves information about a specific piece of encrypted data.

## Signature

```typescript
async function getDataInfo(
  dataIdentifier: string,
  debug?: boolean,
  apiUrl?: string
): Promise<DataInfo | null>
```

## Description

The getDataInfo function retrieves detailed information about a specific piece of data that has been encrypted using Keypo. This function checks if the data has been deleted and, if not, retrieves comprehensive metadata including ownership information, access permissions, and file details. The function can be used to retrieve information for any encrypted data, regardless of ownership.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIdentifier | string | Yes | The unique identifier of the data to look up. |
| debug | boolean | No | When set to true, enables debug statements during the lookup process. Default is false. |
| apiUrl | string | No | Custom API URL to use for the request. Defaults to 'https://api.keypo.io'. |

## Returns

Promise<DataInfo | null> - A Promise that resolves to an object containing detailed information about the specified data, or null if the data has been deleted or doesn't exist.

## DataInfo Structure

```typescript
{
  cid: string,                     // IPFS CID of encrypted data
  dataContractAddress: string,     // Smart contract address managing access
  dataMetadata: {                  // Metadata associated with the data
    name: string,                  // Human-readable name for the data
    type: string,                  // The detected type of the input data
    mimeType?: string,             // The detected MIME type (present for File/Blob input)
    subtype?: string,              // Additional type information (e.g., 'bigint', 'base64')
    userMetaData?: string          // Any custom metadata provided during preprocessing
  },
  owner: string,                   // The wallet address that owns this data
  users: string[]                  // Array of wallet addresses that have been granted access
}
```

## Examples

```typescript
import { getDataInfo } from "@keypo/typescript-sdk";

const dataId = "ec67b6f8fd39025e7fe39e2d3aea42e765acc2728af2ebd2301bdf940c5b76ab"

// Get detailed information about the specific data
const dataInfo = await getDataInfo(dataId);

if (dataInfo === null) {
  console.log('Data has been deleted or does not exist');
} else {
  console.log('Data info:', dataInfo);
  // Example output:
  // {
  //   cid: "QmHashString...",
  //   dataContractAddress: "0x1234...",
  //   dataMetadata: {
  //     name: "OpenAI API Key",
  //     type: "string",
  //     userMetaData: "{\"customField\":\"value\"}"
  //   },
  //   owner: "0x2529254cC1d40b77198c94e51C554A88734Efeb7",
  //   users: ["0x1234...", "0x5678..."]
  // }

  // Check ownership status
  if (dataInfo.owner === wallet.address) {
    console.log("You own this data");
  } else {
    console.log(`This data is owned by ${dataInfo.owner}`);
  }

  // Check if you have access
  if (dataInfo.users.includes(wallet.address.toLowerCase())) {
    console.log("You have access to this data");
  }

  // Check total number of users with access
  console.log(`Total users with access: ${dataInfo.users.length}`);
}
```

## Notes

- Returns `null` if the data has been deleted or doesn't exist.
- The function retrieves all users who have been granted access to the data (excluding the owner).
- The `users` array contains wallet addresses that have been shared access to the data. It does not include the data owner's address.
- The `name` field in metadata is for human readability. It is not necessarily unique and can be duplicated across different data items.
- The `owner` field indicates the wallet address that has full control over the data.
- The `userMetaData` field is returned as a JSON stringified string, not as an object.
- When debug is enabled, the function will log detailed information about the API calls and responses.

## See Also

- [list](list.md) - For retrieving information about all accessible data
- [search](search.md) - For searching encrypted data by name
- [encrypt](../encryption/encrypt.md) - For encrypting data
- [encryptForProxy](../encryption/encryptForProxy.md) - For encrypting API keys
- [share](share.md) - For sharing access to encrypted data with other wallets
- [delete](delete.md) - For deleting encrypted data

Last updated on July 2, 2025