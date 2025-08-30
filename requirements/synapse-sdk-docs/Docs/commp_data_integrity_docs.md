# CommP and Data Integrity

## Relevant Source Files

This page covers the CommP (Piece Commitment) calculation and data integrity validation utilities in the Synapse SDK. These functions handle cryptographic piece commitments for Filecoin storage, supporting both synchronous and streaming calculation methods, as well as download validation workflows.

For broader storage operations including upload/download workflows, see **StorageService**.  
For proof of data possession verification, see **PDP (Proof of Data Possession)**.

## CommP Format Overview

The SDK supports both legacy CommPv1 and newer CommPv2 piece commitment formats, with automatic conversion between them for smart contract compatibility.

### CommP Format Comparison

| Format | Codec | Multihash | Structure | Contract Usage |
|--------|-------|-----------|-----------|----------------|
| **CommPv1** | `fil-commitment-unsealed` (0xf101) | `sha2-256-trunc254-padded` (0x1012) | 32-byte digest only | Direct compatibility |
| **CommPv2** | `raw` (0x55) | `fr32-sha256-trunc254-padbintree` (0x1011) | `uvarint padding | uint8 height | 32 byte root data` | Requires extraction |

### CommPv2 Structure

**Format Details:**
- `uvarint padding` - Variable length padding information
- `uint8 height` - Tree height indicator  
- `32-byte root data` - Cryptographic root hash

**Capabilities:**
- Size embedded in CID
- Supports up to 32 GiB (height 30)
- Contract Integration: Solidity `RootData.cid` (32 bytes)

**Sources:** `AGENTS.md` 93-118, `src/commp/commp.ts` 112-122

## Core CommP Calculation

The SDK provides synchronous CommP calculation for data blobs and validation utilities for ensuring proper CommP format compliance.

### Calculation Functions

**Input Processing:**
- `Uint8Array data` → Core Functions → Output
- `CommP string` → Core Functions → Output  
- `CID object` → Core Functions → Output

**Core Functions:**
- `calculate()` - Process input data
- `asCommP()` - Format conversion

**Internal Processing:**
1. `Hasher.create()` - Initialize hasher
2. `hasher.write()` chunks - Process data in chunks
3. `hasher.digest()` - Generate digest
4. `commPv2ToCommPv1()` - Convert format

**Output:**
- `CommP (LegacyPieceLink)` - Final CommP result
- `parseCommP()` / `isValidCommP()` - Validation utilities
- `CommP | null` - Validation result

**Sources:** `src/commp/commp.ts` 91-141, `src/commp/commp.ts` 56-83

### Size Calculation Utilities

The SDK provides utilities for calculating proper piece sizes with Fr32 padding considerations:

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `toZeroPaddedSize()` | Calculate zero-padding needed | Payload size | Zero-padded size |
| `toPieceSize()` | Round up to power-of-2 piece size | Payload size | Piece size (multiple of 256) |

**Sources:** `src/commp/commp.ts` 36-48

## Streaming CommP Calculation

For large files, the SDK provides a streaming approach that calculates CommP without buffering entire datasets in memory.

### CommP Streaming Architecture

**Stream Setup:**
1. `createCommPStream()` - Initialize stream
2. `Hasher.create()` - Create hasher
3. `TransformStream` - Set up transform pipeline

**Stream Processing:**
1. **Input Chunk** → `transform()` method
2. `hasher.write(chunk)` - Process chunk
3. `controller.enqueue(chunk)` - Pass through chunk
4. **Output Chunk** - Continue stream

**Stream Completion:**
1. `flush()` method - Finalize processing
2. `hasher.digest()` - Generate final digest
3. `commPv2ToCommPv1()` - Convert format
4. `getCommP()` method - Return result

**Sources:** `src/commp/commp.ts` 144-179

### Streaming Usage Pattern

The streaming CommP calculator returns an object with two components:

- **`stream`**: A `TransformStream<Uint8Array, Uint8Array>` that passes data through while calculating CommP
- **`getCommP()`**: A function that returns the calculated CommP after stream completion (returns `null` until finished)

**Sources:** `src/commp/commp.ts` 149-178

## Data Validation and Downloads

The CommP system integrates with download operations to ensure data integrity through CommP validation.

### Download Validation Flow

**Sequence:**
1. Client: `downloadAndValidateCommP(expectedCommP)`
2. Data Stream: "Start download stream"  
3. CommP Calculator: `createCommPStream()`
4. **Loop for each chunk:**
   - Data Stream: "Stream chunk through"
   - CommP Calculator: Process chunk
   - Data Stream: "Pass chunk to client"
5. Data Stream: "End stream"
6. CommP Calculator: `getCommP()` result
7. CommP Validator: "Compare with expectedCommP"
8. **Result:**
   - **If CommP matches:** "Data validated successfully"
   - **If CommP mismatch:** "Throw validation error"

**Sources:** `src/commp/index.ts` 14-16, `AGENTS.md` 294

## Smart Contract Integration

CommP calculations must be compatible with Solidity smart contracts, which expect 32-byte digests rather than full CID structures.

### Contract Data Format

**SDK CommP Processing:**
- **CommPv2 Digest:** Variable length
- **Extract:** last 32 bytes → `digest.bytes.subarray(-32)`
- **Result:** 32-byte root digest

**Smart Contract:**
- **Contract Operations:** `Cids.Cid cid` (32 bytes) → `RootData` struct
- **Fields:** `uint64 rawSize`
- **Usage:** `PDPVerifier.addRoots()`, Pandora callback validation

**Sources:** `AGENTS.md` 104-118, `AGENTS.md` 232-237

## Module Exports and API Surface

The CommP module provides a clean API surface for all piece commitment operations, with both synchronous and streaming interfaces available to suit different use cases and performance requirements.

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/4.5-commp-and-data-integrity*