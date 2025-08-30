import { DataMetadata, TypedArray, BrowserFile, BrowserBlob } from './utils/types';

// Check if we're in a browser environment where File and Blob are available
const isBrowser = typeof window !== 'undefined' && typeof File !== 'undefined' && typeof Blob !== 'undefined';

/**
 * Prepares data for encryption by converting it to a Uint8 byte array and setting appropriate metadata.
 * Supports multiple input types including files, strings, numbers, and objects.
 */
export async function preProcess(
  dataIn: BrowserFile | BrowserBlob | ArrayBuffer | Buffer | string | number | bigint | boolean | object | null | undefined | TypedArray,
  name: string,
  debug?: boolean,
  metadataIn?: Record<string, any>
): Promise<{ dataOut: Uint8Array; metadataOut: DataMetadata }> {
  let dataOut: Uint8Array;
  const metadataOut: DataMetadata = {
    name,
    type: 'unknown',
    userMetaData: metadataIn
  };

  if (debug) {
    console.log('preProcess input:', {
      name,
      type: typeof dataIn,
      isFile: isBrowser && dataIn instanceof File,
      isBlob: isBrowser && dataIn instanceof Blob,
      isArrayBuffer: dataIn instanceof ArrayBuffer,
      isBuffer: Buffer.isBuffer(dataIn),
      isTypedArray: ArrayBuffer.isView(dataIn),
      constructor: dataIn?.constructor?.name,
      value: isBrowser && dataIn instanceof File ? dataIn.name : dataIn
    });
  }

  if (dataIn === null || dataIn === undefined) {
    dataOut = new Uint8Array();
    metadataOut.type = 'null';
  } else if (isBrowser && (dataIn instanceof File || dataIn instanceof Blob)) {
    const arrayBuffer = await dataIn.arrayBuffer();
    dataOut = new Uint8Array(arrayBuffer);
    metadataOut.type = 'file';
    metadataOut.mimeType = dataIn instanceof File ? dataIn.type : dataIn.type;
  } else if (dataIn instanceof ArrayBuffer || Buffer.isBuffer(dataIn) || ArrayBuffer.isView(dataIn)) {
    if (ArrayBuffer.isView(dataIn)) {
      dataOut = new Uint8Array(dataIn.buffer, dataIn.byteOffset, dataIn.byteLength);
    } else {
      dataOut = new Uint8Array(dataIn);
    }
    metadataOut.type = Buffer.isBuffer(dataIn) ? 'buffer' : ArrayBuffer.isView(dataIn) ? 'typedarray' : 'arraybuffer';
    if (ArrayBuffer.isView(dataIn)) {
      metadataOut.arrayType = dataIn.constructor.name;
    }
  } else if (typeof dataIn === 'string') {
    dataOut = new TextEncoder().encode(dataIn);
    metadataOut.type = 'string';
  } else if (typeof dataIn === 'number' || typeof dataIn === 'bigint') {
    dataOut = new TextEncoder().encode(dataIn.toString());
    metadataOut.type = 'number';
    if (typeof dataIn === 'bigint') {
      metadataOut.subtype = 'bigint';
    }
  } else if (typeof dataIn === 'boolean') {
    dataOut = new TextEncoder().encode(dataIn.toString());
    metadataOut.type = 'boolean';
  } else if (typeof dataIn === 'object') {
    if (dataIn instanceof Map) {
      dataOut = new TextEncoder().encode(JSON.stringify(Object.fromEntries(dataIn)));
      metadataOut.subtype = 'map';
    } else if (dataIn instanceof Set) {
      dataOut = new TextEncoder().encode(JSON.stringify(Array.from(dataIn)));
      metadataOut.subtype = 'set';
    } else {
      dataOut = new TextEncoder().encode(JSON.stringify(dataIn));
      metadataOut.subtype = 'json';
    }
    metadataOut.type = 'object';
  } else {
    throw new Error(`Unsupported data type: ${typeof dataIn}`);
  }

  if (debug) {
    console.log('preProcess output:', {
      dataLength: dataOut.length,
      metadata: metadataOut
    });
  }

  return { dataOut, metadataOut };
} 