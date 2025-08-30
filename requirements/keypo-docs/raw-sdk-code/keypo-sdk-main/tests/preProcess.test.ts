import { preProcess } from '../src/preProcess';
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

describe('preProcess', () => {
  // Helper function to check metadata structure
  const validateMetadata = (metadata: DataMetadata, expectedType: string) => {
    expect(metadata).toHaveProperty('name');
    expect(metadata).toHaveProperty('type', expectedType);
    expect(metadata).toHaveProperty('userMetaData');
  };

  test('handles null input', async () => {
    const { dataOut, metadataOut } = await preProcess(null, 'null-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(dataOut.length).toBe(0);
    validateMetadata(metadataOut, 'null');
  });

  test('handles string input', async () => {
    const testString = 'Hello, World!';
    const { dataOut, metadataOut } = await preProcess(testString, 'string-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(dataOut)).toBe(testString);
    validateMetadata(metadataOut, 'string');
  });

  test('handles base64 string input', async () => {
    const base64String = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
    const { dataOut, metadataOut } = await preProcess(base64String, 'base64-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.subtype).toBe('base64');
    validateMetadata(metadataOut, 'string');
  });

  test('handles number input', async () => {
    const testNumber = 42;
    const { dataOut, metadataOut } = await preProcess(testNumber, 'number-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(dataOut)).toBe('42');
    validateMetadata(metadataOut, 'number');
  });

  test('handles bigint input', async () => {
    const testBigInt = BigInt(9007199254740991);
    const { dataOut, metadataOut } = await preProcess(testBigInt, 'bigint-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.subtype).toBe('bigint');
    validateMetadata(metadataOut, 'number');
  });

  test('handles boolean input', async () => {
    const { dataOut, metadataOut } = await preProcess(true, 'boolean-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(dataOut)).toBe('true');
    validateMetadata(metadataOut, 'boolean');
  });

  test('handles object input', async () => {
    const testObject = { key: 'value', nested: { data: 123 } };
    const { dataOut, metadataOut } = await preProcess(testObject, 'object-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(JSON.parse(new TextDecoder().decode(dataOut))).toEqual(testObject);
    expect(metadataOut.subtype).toBe('json');
    validateMetadata(metadataOut, 'object');
  });

  test('handles Map input', async () => {
    const testMap = new Map<string, string | { data: number }>([['key', 'value'], ['nested', { data: 123 }]]);
    const { dataOut, metadataOut } = await preProcess(testMap, 'map-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.subtype).toBe('map');
    validateMetadata(metadataOut, 'object');
  });

  test('handles Set input', async () => {
    const testSet = new Set([1, 2, 3, 4, 5]);
    const { dataOut, metadataOut } = await preProcess(testSet, 'set-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.subtype).toBe('set');
    validateMetadata(metadataOut, 'object');
  });

  test('handles ArrayBuffer input', async () => {
    const buffer = new ArrayBuffer(8);
    const { dataOut, metadataOut } = await preProcess(buffer, 'arraybuffer-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(dataOut.length).toBe(8);
    validateMetadata(metadataOut, 'arraybuffer');
  });

  test('handles TypedArray input', async () => {
    const typedArray = new Uint8Array([1, 2, 3, 4, 5]);
    const { dataOut, metadataOut } = await preProcess(typedArray, 'typedarray-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.arrayType).toBe('Uint8Array');
    validateMetadata(metadataOut, 'typedarray');
  });

  test('handles File input', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const { dataOut, metadataOut } = await preProcess(file, 'file-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.mimeType).toBe('text/plain');
    validateMetadata(metadataOut, 'file');
  });

  test('handles Blob input', async () => {
    const blob = new Blob(['test content'], { type: 'text/plain' });
    const { dataOut, metadataOut } = await preProcess(blob, 'blob-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(metadataOut.mimeType).toBe('text/plain');
    validateMetadata(metadataOut, 'file');
  });

  test('handles Buffer input', async () => {
    const buffer = Buffer.from('Hello, Buffer!');
    const { dataOut, metadataOut } = await preProcess(buffer, 'buffer-test');
    expect(dataOut).toBeInstanceOf(Uint8Array);
    expect(dataOut.length).toBe(buffer.length);
    expect(new TextDecoder().decode(dataOut)).toBe('Hello, Buffer!');
    validateMetadata(metadataOut, 'buffer');
  });

  test('includes user metadata', async () => {
    const userMeta = { category: 'test', tags: ['unit', 'preprocess'] };
    const { metadataOut } = await preProcess('test', 'metadata-test', false, userMeta);
    expect(metadataOut.userMetaData).toEqual(userMeta);
  });

  test('handles debug mode', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await preProcess('test', 'debug-test', true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
}); 