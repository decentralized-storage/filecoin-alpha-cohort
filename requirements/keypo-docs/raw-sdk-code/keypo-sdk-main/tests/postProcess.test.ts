import { postProcess } from '../src/postProcess';
import { DataMetadata } from '../src/utils/types';

// Mock File and Blob for Node environment
global.File = class MockFile {
  name: string;
  type: string;
  content: string;
  constructor(content: string[], name: string, options: { type: string }) {
    this.name = name;
    this.type = options.type;
    this.content = content.join('');
  }
  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

global.Blob = class MockBlob {
  type: string;
  content: string;
  constructor(content: string[], options: { type: string }) {
    this.type = options.type;
    this.content = content.join('');
  }
  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('postProcess', () => {
  // Helper function to check metadata structure
  const validateMetadata = (metadata: DataMetadata, expectedType: string) => {
    expect(metadata).toHaveProperty('name');
    expect(metadata).toHaveProperty('type', expectedType);
    expect(metadata).toHaveProperty('userMetaData');
  };

  test('handles null input', () => {
    const dataIn = new Uint8Array();
    const metadataIn: DataMetadata = {
      name: 'null-test',
      type: 'null',
      userMetaData: undefined
    };
    const result = postProcess<null>(dataIn, metadataIn);
    expect(result).toBeNull();
  });

  test('handles string input', () => {
    const text = 'Hello, World!';
    const dataIn = new TextEncoder().encode(text);
    const metadataIn: DataMetadata = {
      name: 'string-test',
      type: 'string',
      userMetaData: undefined
    };
    const result = postProcess<string>(dataIn, metadataIn);
    expect(result).toBe(text);
  });

  test('handles base64 string input', () => {
    const base64String = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
    const dataIn = new TextEncoder().encode(base64String);
    const metadataIn: DataMetadata = {
      name: 'base64-test',
      type: 'string',
      subtype: 'base64',
      userMetaData: undefined
    };
    const result = postProcess<string>(dataIn, metadataIn);
    expect(result).toBe(base64String);
  });

  test('handles number input', () => {
    const number = 42;
    const dataIn = new TextEncoder().encode(number.toString());
    const metadataIn: DataMetadata = {
      name: 'number-test',
      type: 'number',
      userMetaData: undefined
    };
    const result = postProcess<number>(dataIn, metadataIn);
    expect(result).toBe(number);
  });

  test('handles bigint input', () => {
    const bigInt = BigInt(9007199254740991);
    const dataIn = new TextEncoder().encode(bigInt.toString());
    const metadataIn: DataMetadata = {
      name: 'bigint-test',
      type: 'number',
      subtype: 'bigint',
      userMetaData: undefined
    };
    const result = postProcess<bigint>(dataIn, metadataIn);
    expect(result).toBe(bigInt);
  });

  test('handles boolean input', () => {
    const dataIn = new TextEncoder().encode('true');
    const metadataIn: DataMetadata = {
      name: 'boolean-test',
      type: 'boolean',
      userMetaData: undefined
    };
    const result = postProcess<boolean>(dataIn, metadataIn);
    expect(result).toBe(true);
  });

  test('handles object input', () => {
    const obj = { key: 'value', nested: { data: 123 } };
    const dataIn = new TextEncoder().encode(JSON.stringify(obj));
    const metadataIn: DataMetadata = {
      name: 'object-test',
      type: 'object',
      subtype: 'json',
      userMetaData: undefined
    };
    const result = postProcess<typeof obj>(dataIn, metadataIn);
    expect(result).toEqual(obj);
  });

  test('handles Map input', () => {
    const map = new Map<string, string | { data: number }>([
      ['key', 'value'],
      ['nested', { data: 123 }]
    ]);
    const dataIn = new TextEncoder().encode(JSON.stringify(Object.fromEntries(map)));
    const metadataIn: DataMetadata = {
      name: 'map-test',
      type: 'object',
      subtype: 'map',
      userMetaData: undefined
    };
    const result = postProcess<Map<string, string | { data: number }>>(dataIn, metadataIn);
    expect(result).toBeInstanceOf(Map);
    expect(Array.from(result.entries())).toEqual(Array.from(map.entries()));
  });

  test('handles Set input', () => {
    const set = new Set([1, 2, 3, 4, 5]);
    const dataIn = new TextEncoder().encode(JSON.stringify(Array.from(set)));
    const metadataIn: DataMetadata = {
      name: 'set-test',
      type: 'object',
      subtype: 'set',
      userMetaData: undefined
    };
    const result = postProcess<Set<number>>(dataIn, metadataIn);
    expect(result).toBeInstanceOf(Set);
    expect(Array.from(result)).toEqual(Array.from(set));
  });

  test('handles ArrayBuffer input', () => {
    const buffer = new ArrayBuffer(8);
    const dataIn = new Uint8Array(buffer);
    const metadataIn: DataMetadata = {
      name: 'arraybuffer-test',
      type: 'arraybuffer',
      userMetaData: undefined
    };
    const result = postProcess<ArrayBuffer>(dataIn, metadataIn);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(8);
  });

  test('handles TypedArray input', () => {
    const typedArray = new Uint8Array([1, 2, 3, 4, 5]);
    const dataIn = new Uint8Array(typedArray.buffer);
    const metadataIn: DataMetadata = {
      name: 'typedarray-test',
      type: 'typedarray',
      arrayType: 'Uint8Array',
      userMetaData: undefined
    };
    const result = postProcess<Uint8Array>(dataIn, metadataIn);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual(Array.from(typedArray));
  });

  test('handles Buffer input', () => {
    const buffer = Buffer.from('Hello, Buffer!');
    const dataIn = new Uint8Array(buffer);
    const metadataIn: DataMetadata = {
      name: 'buffer-test',
      type: 'buffer',
      userMetaData: undefined
    };
    const result = postProcess<Buffer>(dataIn, metadataIn);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe('Hello, Buffer!');
  });

  test('handles File input in browser environment', () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const dataIn = new Uint8Array(new TextEncoder().encode('test content'));
    const metadataIn: DataMetadata = {
      name: 'file-test',
      type: 'file',
      mimeType: 'text/plain',
      userMetaData: undefined
    };
    const result = postProcess<File>(dataIn, metadataIn);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('file-test');  // Should use metadata name
    expect(result.type).toBe('text/plain');
  });

  test('handles Blob input', () => {
    const blob = new Blob(['test content'], { type: 'text/plain' });
    const dataIn = new Uint8Array(new TextEncoder().encode('test content'));
    const metadataIn: DataMetadata = {
      name: 'blob-test',
      type: 'file',
      mimeType: 'text/plain',
      userMetaData: undefined
    };
    const result = postProcess<Blob>(dataIn, metadataIn);
    expect(result).toBeInstanceOf(File); // Always returns File if name is present
    expect(result.type).toBe('text/plain');
    expect((result as File).name).toBe('blob-test');
  });

  test('includes user metadata', () => {
    const userMeta = { category: 'test', tags: ['unit', 'postprocess'] };
    const dataIn = new Uint8Array();
    const metadataIn: DataMetadata = {
      name: 'metadata-test',
      type: 'null',
      userMetaData: userMeta
    };
    const result = postProcess<null>(dataIn, metadataIn);
    expect(metadataIn.userMetaData).toEqual(userMeta);
  });

  test('handles debug mode', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const dataIn = new Uint8Array();
    const metadataIn: DataMetadata = {
      name: 'debug-test',
      type: 'null',
      userMetaData: undefined
    };
    postProcess<null>(dataIn, metadataIn, true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('throws error for unsupported type', () => {
    const dataIn = new Uint8Array();
    const metadataIn: DataMetadata = {
      name: 'invalid-test',
      type: 'invalid-type',
      userMetaData: undefined
    };
    expect(() => postProcess(dataIn, metadataIn)).toThrow('Unsupported metadata type: invalid-type');
  });
}); 