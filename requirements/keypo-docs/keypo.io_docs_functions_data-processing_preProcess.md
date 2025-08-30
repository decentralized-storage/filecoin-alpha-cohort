# preProcess

Prepares data for encryption by converting it to a Uint8 byte array and setting appropriate metadata. Supports multiple input types including files, strings, numbers, and objects.

## Signature

```typescript
async function preProcess(
  dataIn: File | Blob | ArrayBuffer | Buffer | string | number | bigint | boolean,
  name: string,
  debug?: boolean,
  metadataIn?: Record<string, any>
): Promise<{ dataOut: Uint8Array, metadataOut: DataMetadata }>
```

## Description

The preProcess function converts various data types to a standardized Uint8 byte array format required for encryption. It automatically detects the input type and applies the appropriate conversion method. The function also generates metadata including detected data type and optional user-defined metadata.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIn | Multiple types | Yes | The data to be processed for encryption. Supported types include: File, Blob, ArrayBuffer, Buffer (binary data), string (text, Base64, JSON strings), number, bigint (numeric values), object (JavaScript objects, Maps, Sets), TypedArrays (Int32Array, Uint8Array, etc.), boolean, null, undefined (basic types) |
| name | string | Yes | An identifier used to index data you have access to. This name is preserved in the metadata and used for human readability. |
| debug | boolean | No | When set to true, enables debug statements during the preprocessing. Default is false. |
| metadataIn | Record<string, any> | No | Optional user defined JSON object with additional metadata. This metadata is merged with the automatically generated metadata and preserved throughout the encryption/decryption cycle. Can be used for post-processing on the decrypted data. |

## Returns

A Promise that resolves to an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| dataOut | Uint8Array | The processed data as a Uint8 byte array ready for encryption. This standardized format ensures consistent handling during the encryption process. |
| metadataOut | DataMetadata | Metadata object containing essential information about the data. This metadata must be preserved and passed to the decryption process to ensure proper reconstruction of the original data, but as long as encrypt is used in tandem with preprocess, the user does not need to manually preserve the metadata. |

## DataMetadata Structure

```typescript
{
  name: string,        // The identifier provided during preprocessing
  type: string,        // The detected type of the input data (e.g., 'file', 'string')
  mimeType?: string,   // The detected MIME type of the data (present for File/Blob)
  subtype?: string,    // Additional type information (e.g., 'bigint' for numbers)
  arrayType?: string,  // For TypedArrays, specifies the specific array type (e.g., 'Uint8Array')
  userMetaData?: any   // Any custom metadata provided during preprocessing
}
```

## Examples

```typescript
// import relevant libraries
import { preProcess } from "@keypo/typescript-sdk"

// Example with a file
const file = new File([new Blob(['file content'])], 'test.txt');
const { dataOut, metadataOut } = await keypo.preProcess(file, 'document1', true, {
  category: 'important',
  tags: ['confidential']
}); // enable debug logs
// metadataOut will be:
// {
//   name: 'document1',
//   type: 'file',
//   mimeType: 'text/plain',
//   userMetaData: { category: 'important', tags: ['confidential'] }
// }

// Example with a string
const textData = 'Secret message';
const { dataOut, metadataOut } = await keypo.preProcess(textData, 'message1');
// metadataOut will be:
// {
//   name: 'message1',
//   type: 'string'
// }

// Example with a JSON object
const jsonData = { key: 'value', nested: { data: true } };
const { dataOut, metadataOut } = await keypo.preProcess(jsonData, 'config1');
// metadataOut will be:
// {
//   name: 'config1',
//   type: 'object',
//   subtype: 'json'
// }

// Example with a Map
const mapData = new Map([['key1', 'value1'], ['key2', 'value2']]);
const { dataOut, metadataOut } = await keypo.preProcess(mapData, 'map-data');
// metadataOut will be:
// {
//   name: 'map-data',
//   type: 'object',
//   subtype: 'map'
// }

// Example with a Set
const setData = new Set(['item1', 'item2', 'item3']);
const { dataOut, metadataOut } = await keypo.preProcess(setData, 'set-data');
// metadataOut will be:
// {
//   name: 'set-data',
//   type: 'object',
//   subtype: 'set'
// }

// Example with a TypedArray
const arrayData = new Uint8Array([1, 2, 3, 4, 5]);
const { dataOut, metadataOut } = await keypo.preProcess(arrayData, 'array-data');
// metadataOut will be:
// {
//   name: 'array-data',
//   type: 'typedarray',
//   arrayType: 'Uint8Array'
// }
```

## Type Handling

| Input Type | Processing Behavior | Metadata Type | Subtype |
|------------|-------------------|---------------|---------|
| File, Blob | Read as binary data with proper MIME type detection | 'file' | - |
| ArrayBuffer | Used directly as binary data | 'arraybuffer' | - |
| Buffer | Used directly as binary data | 'buffer' | - |
| TypedArray | Used directly as binary data | 'typedarray' | Constructor name in arrayType |
| string | Encoded as UTF-8 text | 'string' | - |
| number | Converted to string then to binary | 'number' | - |
| bigint | Converted to string then to binary | 'number' | 'bigint' |
| boolean | Converted to "true"/"false" string then to binary | 'boolean' | - |
| object | JSON stringified then encoded as UTF-8 | 'object' | 'json' |
| Map | Converted to object then JSON stringified | 'object' | 'map' |
| Set | Converted to array then JSON stringified | 'object' | 'set' |
| null, undefined | Converted to empty array | 'null' | - |

## Notes

- The function automatically detects the input data type and applies the appropriate conversion.
- For files and blobs, the MIME type is automatically detected and preserved.
- When processing JSON objects, they are stringified before conversion.
- TypedArrays preserve their specific type information in the arrayType metadata field.
- The generated metadata is essential for both the encryption process and later decryption/reconstruction of the data. The generated metadata is automatically preserved if used per the encryption/decryption flow defined in the flow diagrams.
- All metadata must be preserved and passed to the decryption process to ensure proper data reconstruction.
- When debug is enabled, the function will log detailed information about the input data and output metadata.

## See Also

- [postProcess](../data-processing/postProcess.md) - Restores data to its original format
- [encrypt](../encryption/encrypt.md) - Encrypts the processed data
- [encryptForProxy](../encryption/encryptForProxy.md) - Encrypts API keys for proxy execution

Last updated on July 3, 2025