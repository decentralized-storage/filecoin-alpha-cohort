import { DataMetadata, TypedArray, BrowserFile, BrowserBlob } from './utils/types';

// Check if we're in a browser environment where File and Blob are available
const isBrowser = typeof window !== 'undefined' && typeof File !== 'undefined' && typeof Blob !== 'undefined';

/**
 * Restores decrypted data to its original format using the metadata that was stored during encryption.
 * This function is the inverse operation of preProcess, converting the standardized Uint8Array format back to the original data type.
 */
export function postProcess<T extends BrowserFile | BrowserBlob | ArrayBuffer | Buffer | string | number | bigint | boolean | object | null | undefined | TypedArray>(
  dataIn: Uint8Array,
  metadataIn: DataMetadata,
  debug?: boolean
): T {
  if (debug) {
    console.log('postProcess input:', {
      dataLength: dataIn.length,
      metadata: metadataIn
    });
  }

  // Handle null type
  if (metadataIn.type === 'null') {
    return null as T;
  }

  // Handle binary data types
  if (metadataIn.type === 'file') {
    if (!isBrowser) {
      // In Node.js, return a Buffer instead of File/Blob
      return Buffer.from(dataIn) as T;
    }
    
    const blob = new Blob([dataIn], { type: metadataIn.mimeType || 'application/octet-stream' });
    
    // Always create a File if we have a name in metadata
    if (metadataIn.name) {
      return new File([blob], metadataIn.name, { type: blob.type }) as T;
    }
    
    return blob as T;
  }

  if (metadataIn.type === 'buffer') {
    return Buffer.from(dataIn) as T;
  }

  if (metadataIn.type === 'arraybuffer') {
    return dataIn.buffer as T;
  }

  if (metadataIn.type === 'typedarray') {
    const ArrayType = global[metadataIn.arrayType as keyof typeof global] as new (buffer: ArrayBuffer) => TypedArray;
    if (ArrayType) {
      return new ArrayType(dataIn.buffer) as T;
    }
    throw new Error(`Unsupported TypedArray type: ${metadataIn.arrayType}`);
  }

  // Handle string types
  if (metadataIn.type === 'string') {
    const text = new TextDecoder().decode(dataIn);
    if (metadataIn.subtype === 'base64') {
      // Convert the Uint8Array to base64 string
      const base64String = Buffer.from(dataIn).toString('base64');
      return base64String as T;
    }
    return text as T;
  }

  // Handle number types
  if (metadataIn.type === 'number') {
    const text = new TextDecoder().decode(dataIn);
    if (metadataIn.subtype === 'bigint') {
      return BigInt(text) as T;
    }
    return Number(text) as T;
  }

  // Handle boolean type
  if (metadataIn.type === 'boolean') {
    const text = new TextDecoder().decode(dataIn);
    return (text === 'true') as T;
  }

  // Handle object types
  if (metadataIn.type === 'object') {
    const text = new TextDecoder().decode(dataIn);
    const parsed = JSON.parse(text);
    
    if (metadataIn.subtype === 'map') {
      return new Map(Object.entries(parsed)) as T;
    }
    
    if (metadataIn.subtype === 'set') {
      return new Set(parsed) as T;
    }
    
    return parsed as T;
  }

  throw new Error(`Unsupported metadata type: ${metadataIn.type}`);
} 