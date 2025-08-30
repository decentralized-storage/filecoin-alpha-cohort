# postProcess

Restores decrypted data to its original format using the metadata that was stored during preProcess/encryption. This function is the inverse operation of [preProcess](preProcess.md), converting the standardized Uint8Array format back to the original data type.

## Signature

```typescript
function postProcess<T extends File | Blob | ArrayBuffer | Buffer | string | number | bigint | boolean | object | null | undefined | TypedArray>(
  dataIn: Uint8Array,
  metadataIn: DataMetadata,
  debug?: boolean
): T
```

## Description

The postProcess function converts decrypted data back to its original format using the metadata that was generated during preprocessing. It automatically detects the appropriate conversion method based on the metadata type information and handles all supported data types including files, strings, numbers, and objects.

The generic type parameter `T` allows you to specify the expected return type, providing better type safety and IDE support. The function will return the data in the specified type if it matches the metadata, or throw an error if the types don't match.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIn | Uint8Array | Yes | The decrypted data as a Uint8 byte array (from `decrypt.decryptedData`). |
| metadataIn | DataMetadata | Yes | The metadata object that was stored with the encrypted data (from `decrypt.metadata`). |
| debug | boolean | No | When set to `true`, enables debug statements during the post-processing. Default is `false`. |

## Returns

The function returns the data in its original format, which could be any of the supported types:

- **File**, **Blob**, **ArrayBuffer**, **Buffer** - For binary data
- **string** - For text data, including Base64 and JSON strings
- **number**, **bigint** - For numeric values
- **boolean** - For boolean values
- **object** - For JavaScript objects, Maps, etc.
- **null**, **undefined** - For empty or undefined values
- **TypedArray** - For typed array data (Int32Array, Uint8Array, etc.)

## Examples

### Complete Decrypt and Restore Workflow

```typescript
import { decrypt, postProcess } from "@keypo/typescript-sdk";

// First decrypt the data to get both the data and its metadata
const { decryptedData, metadata } = await decrypt(
  dataId,
  wallet,
  config.decryptConfig
);

// Example 1: Restore a file with type safety
const originalFile = postProcess<File>(decryptedData, metadata, true); // enable debug
// Returns a File object with the original content and MIME type

// Example 2: Restore a string with type safety
const originalText = postProcess<string>(decryptedData, metadata);
// Returns the original string content

// Example 3: Restore a JSON object with type safety
interface Config {
  key: string;
  nested: { data: boolean };
}
const originalJson = postProcess<Config>(decryptedData, metadata);
// Returns the original object with all properties intact and type checking

// Example 4: Restore a Buffer with type safety (Node.js environment)
const originalBuffer = postProcess<Buffer>(decryptedData, metadata);
// Returns a Node.js Buffer with the original binary data
```

### Working with Different Data Types

```typescript
import { init, decrypt, postProcess } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

async function restoreData(dataIdentifier: string) {
  // Setup
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const config = await init("https://api.keypo.io");
  
  // Decrypt
  const { decryptedData, metadata } = await decrypt(
    dataIdentifier,
    wallet,
    config.decryptConfig
  );
  
  // Restore based on the original type
  switch (metadata.type) {
    case 'string':
      const text = postProcess<string>(decryptedData, metadata);
      console.log('Restored text:', text);
      break;
      
    case 'file':
      const file = postProcess<File>(decryptedData, metadata);
      console.log('Restored file:', file.name, file.size);
      break;
      
    case 'object':
      const obj = postProcess<object>(decryptedData, metadata);
      console.log('Restored object:', obj);
      break;
      
    case 'number':
      if (metadata.subtype === 'bigint') {
        const bigNum = postProcess<bigint>(decryptedData, metadata);
        console.log('Restored bigint:', bigNum);
      } else {
        const num = postProcess<number>(decryptedData, metadata);
        console.log('Restored number:', num);
      }
      break;
      
    case 'typedarray':
      // TypedArray restoration preserves the exact array type
      const typedArray = postProcess<TypedArray>(decryptedData, metadata);
      console.log('Restored typed array:', metadata.arrayType, typedArray);
      break;
      
    default:
      // Generic restoration without type specification
      const restored = postProcess(decryptedData, metadata);
      console.log('Restored data:', restored);
  }
}
```

### File Handling Example

```typescript
async function handleEncryptedFile(fileDataId: string) {
  const { decryptedData, metadata } = await decrypt(
    fileDataId,
    wallet,
    config.decryptConfig
  );
  
  // Restore as File object
  const restoredFile = postProcess<File>(decryptedData, metadata);
  
  // Use the restored file
  console.log(`File name: ${restoredFile.name}`);
  console.log(`File size: ${restoredFile.size} bytes`);
  console.log(`MIME type: ${restoredFile.type}`);
  
  // Create download link in browser
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(restoredFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = restoredFile.name;
    link.click();
    URL.revokeObjectURL(url);
  }
}
```

### JSON Configuration Example

```typescript
interface AppConfig {
  apiKeys: {
    openai: string;
    stripe: string;
  };
  settings: {
    debug: boolean;
    timeout: number;
  };
}

async function loadEncryptedConfig(configDataId: string): Promise<AppConfig> {
  const { decryptedData, metadata } = await decrypt(
    configDataId,
    wallet,
    config.decryptConfig
  );
  
  // Restore with type safety
  const config = postProcess<AppConfig>(decryptedData, metadata);
  
  // TypeScript knows the structure now
  console.log(`OpenAI Key: ${config.apiKeys.openai}`);
  console.log(`Debug mode: ${config.settings.debug}`);
  
  return config;
}
```

### Working with TypedArrays

```typescript
async function handleTypedArrayData(dataId: string) {
  const { decryptedData, metadata } = await decrypt(dataId, wallet, config.decryptConfig);
  
  // The exact typed array type is preserved
  if (metadata.arrayType === 'Float32Array') {
    const floatArray = postProcess<Float32Array>(decryptedData, metadata);
    console.log('Float32 data:', floatArray);
    
    // Use for mathematical operations
    const sum = floatArray.reduce((a, b) => a + b, 0);
    console.log('Sum:', sum);
    
  } else if (metadata.arrayType === 'Uint8Array') {
    const byteArray = postProcess<Uint8Array>(decryptedData, metadata);
    console.log('Byte data:', byteArray);
    
    // Convert to hex string
    const hex = Array.from(byteArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log('Hex:', hex);
  }
}
```

### Error Handling

```typescript
function safePostProcess<T>(
  decryptedData: Uint8Array,
  metadata: DataMetadata,
  expectedType: string
): T | null {
  try {
    // Verify the type matches expectations
    if (metadata.type !== expectedType) {
      throw new Error(`Expected ${expectedType}, got ${metadata.type}`);
    }
    
    const restored = postProcess<T>(decryptedData, metadata, true);
    return restored;
    
  } catch (error) {
    console.error('Post-processing failed:', error.message);
    
    if (error.message.includes('Type mismatch')) {
      console.error('The specified type does not match the metadata');
    } else if (error.message.includes('Corrupted data')) {
      console.error('The decrypted data appears to be corrupted');
    } else if (error.message.includes('Unsupported type')) {
      console.error('This data type is not supported for restoration');
    }
    
    return null;
  }
}
```

## Type Restoration Logic

The function uses the following metadata fields to determine how to restore the data:

1. **type** - The primary type of the original data
2. **subtype** - Additional type information (e.g., 'bigint' for numbers, 'base64' for strings, 'map'/'set' for objects)
3. **mimeType** - For files and blobs, ensures proper MIME type handling
4. **arrayType** - For TypedArrays, specifies the exact array type to restore
5. **name** - For files, used to create a File object with the original filename

### Type Mapping

| Metadata Type | Restored Type | Notes |
|---------------|---------------|-------|
| `"string"` | `string` | Handles plain text, Base64, and JSON strings |
| `"number"` | `number` or `bigint` | Uses `subtype` to determine exact numeric type |
| `"boolean"` | `boolean` | Restores true/false values |
| `"object"` | `object` | Preserves Maps, Sets, and plain objects |
| `"file"` | `File` or `Blob` | Creates File if name exists, otherwise Blob |
| `"blob"` | `Blob` | Restores with proper MIME type |
| `"buffer"` | `Buffer` | Node.js Buffer objects |
| `"arraybuffer"` | `ArrayBuffer` | Raw binary data |
| `"typedarray"` | `TypedArray` | Uses `arrayType` for exact type |
| `"null"` | `null` | Null values |
| `"undefined"` | `undefined` | Undefined values |

## Performance Considerations

- **Memory usage**: Large files are kept in memory during restoration
- **Type checking**: Generic type parameters provide compile-time safety without runtime overhead
- **Binary data**: Efficient handling of large binary data through typed arrays
- **Object reconstruction**: Complex objects with nested structures are fully restored

## Browser vs Node.js Compatibility

### Browser Environment
```typescript
// File objects are properly restored with download capability
const file = postProcess<File>(decryptedData, metadata);

// Blob URLs can be created for immediate use
const url = URL.createObjectURL(file);
```

### Node.js Environment
```typescript
// Buffer objects work seamlessly
const buffer = postProcess<Buffer>(decryptedData, metadata);

// File system operations
import fs from 'fs';
fs.writeFileSync('restored-file.txt', buffer);
```

## Notes

- The function is designed to be the exact inverse of [preProcess](preProcess.md)
- All data types supported by preProcess can be restored by postProcess
- For files, if a `name` is present in metadata, a File object is created; otherwise, a Blob is returned
- For objects, the original structure is maintained, including Map and Set objects
- For TypedArrays, the exact array type is restored using the `arrayType` metadata
- For Buffers (Node.js), the binary data is preserved
- For base64 strings, the data is properly converted back to base64 format
- The metadata from [decrypt](../data-access/decrypt.md) contains all necessary information for proper restoration
- The function will throw an error if the requested type doesn't match the metadata or if an unsupported type is encountered
- When debug is enabled, the function will log the input data length and metadata for troubleshooting

## Common Use Cases

### Document Management
```typescript
// Restore encrypted documents
const document = postProcess<File>(decryptedData, metadata);
```

### Configuration Storage
```typescript
// Restore application settings
const settings = postProcess<AppSettings>(decryptedData, metadata);
```

### API Key Management
```typescript
// Restore encrypted API keys
const apiKey = postProcess<string>(decryptedData, metadata);
```

### Binary Data Processing
```typescript
// Restore image or media data
const imageData = postProcess<Uint8Array>(decryptedData, metadata);
```

## See Also

- [preProcess](preProcess.md) - Prepares data for encryption
- [decrypt](../data-access/decrypt.md) - Decrypts the data and provides metadata for post-processing
- [encrypt](../encryption/encrypt.md) - Encrypts preprocessed data
- [Glossary](../../glossary.md) - For detailed information about DataMetadata structure

Last updated on July 3, 2025

# Keypo SDK Documentation