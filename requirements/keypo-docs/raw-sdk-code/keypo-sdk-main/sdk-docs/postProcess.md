# postProcess

Restores decrypted data to its original format using the metadata that was stored during encryption. This function is the inverse operation of `preProcess`, converting the standardized Uint8Array format back to the original data type.

## Signature

```typescript
function postProcess<T extends File | Blob | ArrayBuffer | Buffer | string | number | bigint | boolean | object | null | undefined | TypedArray>(
  dataIn: Uint8Array,
  metadataIn: DataMetadata,
  debug?: boolean
): T
```

## Description

The `postProcess` function converts decrypted data back to its original format using the metadata that was generated during preprocessing. It automatically detects the appropriate conversion method based on the metadata type information and handles all supported data types including files, strings, numbers, and objects.

The generic type parameter `T` allows you to specify the expected return type, providing better type safety and IDE support. The function will return the data in the specified type if it matches the metadata, or throw an error if the types don't match.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataIn` | `Uint8Array` | Yes | The decrypted data as a Uint8 byte array (from `decrypt.decryptedData`). |
| `metadataIn` | `DataMetadata` | Yes | The metadata object that was stored with the encrypted data (from `decrypt.metadata`). |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the post-processing. Default is `false`. |

## Returns

The function returns the data in its original format, which could be any of the supported types:

- `File`, `Blob`, `ArrayBuffer`, `Buffer` - For binary data
- `string` - For text data, including Base64 and JSON strings
- `number`, `bigint` - For numeric values
- `boolean` - For boolean values
- `object` - For JavaScript objects, Maps, etc.
- `null`, `undefined` - For empty or undefined values
- `TypedArray` - For typed array data (Int32Array, Uint8Array, etc.)

## Examples

```typescript
// First decrypt the data to get both the data and its metadata
const { decryptedData, metadata } = await keypo.decrypt('dataIdentifier', wallet);

// Example 1: Restore a file with type safety
const originalFile = keypo.postProcess<File>(decryptedData, metadata, true); // enable debug logs
// Returns a File object with the original content and MIME type

// Example 2: Restore a string with type safety
const originalText = keypo.postProcess<string>(decryptedData, metadata);
// Returns the original string content

// Example 3: Restore a JSON object with type safety
interface Config {
  key: string;
  nested: { data: boolean };
}
const originalJson = keypo.postProcess<Config>(decryptedData, metadata);
// Returns the original object with all properties intact and type checking

// Example 4: Restore a Buffer with type safety (Node.js environment)
const originalBuffer = keypo.postProcess<Buffer>(decryptedData, metadata);
// Returns a Node.js Buffer with the original binary data
```

## Type Restoration Logic

The function uses the following metadata fields to determine how to restore the data:

1. `type` - The primary type of the original data
2. `subtype` - Additional type information (e.g., 'bigint' for numbers, 'base64' for strings, 'map'/'set' for objects)
3. `mimeType` - For files and blobs, ensures proper MIME type handling
4. `arrayType` - For TypedArrays, specifies the exact array type to restore
5. `name` - For files, used to create a File object with the original filename

## Notes

- The function is designed to be the exact inverse of `preProcess`
- All data types supported by `preProcess` can be restored by `postProcess`
- The function maintains type safety and data integrity throughout the restoration process
- For files, if a `name` is present in metadata, a File object is created; otherwise, a Blob is returned
- For objects, the original structure is maintained, including Map and Set objects
- For TypedArrays, the exact array type is restored using the `arrayType` metadata
- For Buffers (Node.js), the binary data is preserved
- For base64 strings, the data is properly converted back to base64 format
- The metadata from `decrypt` contains all necessary information for proper restoration
- Using the generic type parameter provides compile-time type safety
- The function will throw an error if the requested type doesn't match the metadata or if an unsupported type is encountered
- When debug is enabled, the function will log the input data length and metadata for troubleshooting

## See Also

- [preProcess](./preProcess.md) - Prepares data for encryption
- [decrypt](./decrypt.md) - Decrypts the data and provides metadata for post-processing