# Data Retrieval Chain

## Relevant Source Files

This document covers the data retrieval chain system, which provides multiple strategies for downloading stored pieces from the Filecoin network. The system implements a layered approach with CDN optimization, provider discovery, and fallback mechanisms to ensure reliable data access.

For information about data upload and storage operations, see **StorageService**.  
For details about CommP calculation and validation, see **CommP and Data Integrity**.

## Architecture Overview

The data retrieval chain is built around the **PieceRetriever** interface and implements multiple retrieval strategies that can be chained together for reliability and performance.

### Retrieval Strategy Hierarchy

The system implements a multi-layered approach:

**Client Application**
↓
**Retrieval Chain**
- **FilCdnRetriever** (CDN Optimization Layer)
  - When `withCDN=true`
  - CDN failure triggers fallback
- **ChainRetriever** (Provider Discovery & Fetching)
  - All providers fail triggers fallback
- **Child PieceRetriever** (Optional Fallback)

**Data Sources:**
- **FilCDN Network**: `filcdn.io` / `calibration.filcdn.io`
- **Storage Providers**: Storage Provider 1-N (Curio Nodes)

**Sources:** `src/retriever/filcdn.ts` 1-51, `src/retriever/chain.ts` 1-122

### Core Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **PieceRetriever** | Interface for piece retrieval | `src/types.js` |
| **FilCdnRetriever** | CDN-first retrieval with fallback | `src/retriever/filcdn.ts` 10-51 |
| **ChainRetriever** | Provider discovery and multi-provider fetching | `src/retriever/chain.ts` 13-122 |
| **fetchPiecesFromProviders** | Utility for racing multiple providers | `src/retriever/utils.js` |
| **Download validation** | CommP validation during download | `src/commp/download.ts` 31-101 |

**Sources:** `src/retriever/filcdn.ts` 10-14, `src/retriever/chain.ts` 13-17

## ChainRetriever Implementation

The ChainRetriever class is the core component that discovers storage providers and coordinates piece retrieval across multiple providers.

### Provider Discovery Flow

**Two discovery modes:**

#### Specific Provider Address
1. Client → ChainRetriever: `fetchPiece(commP, client, {providerAddress})`
2. ChainRetriever → PandoraService: `getProviderIdByAddress(address)`
3. PandoraService → Provider: `providerId`
4. ChainRetriever → PandoraService: `getApprovedProvider(providerId)`
5. PandoraService → ChainRetriever: `ApprovedProviderInfo`
6. ChainRetriever → Provider: `fetchPiecesFromProviders()`
7. Provider → ChainRetriever: `Response`

#### Multiple Provider Discovery
1. Client → ChainRetriever: `fetchPiece(commP, client)`
2. ChainRetriever → PandoraService: `getClientProofSetsWithDetails(client)`
3. PandoraService → ChainRetriever: `EnhancedProofSetInfo[]`
4. ChainRetriever: Filter live proof sets with roots
5. ChainRetriever → PandoraService: `getProviderIdByAddress()` for each payee
6. ChainRetriever → PandoraService: `getApprovedProvider()` for each id
7. PandoraService → ChainRetriever: `ApprovedProviderInfo[]`
8. ChainRetriever → Provider: `fetchPiecesFromProviders()`
9. Provider → ChainRetriever: `Response`

**Sources:** `src/retriever/chain.ts` 25-71, `src/retriever/chain.ts` 73-120

### Key Methods

The **ChainRetriever** exposes these primary methods:

- **`findProviders(client, providerAddress?)`** - Discovers available providers for a client
  - If `providerAddress` is specified, validates and returns that single provider  
    `src/retriever/chain.ts` 29-41
  - Otherwise queries proof sets to find all providers with client data  
    `src/retriever/chain.ts` 43-70

- **`fetchPiece(commP, client, options?)`** - Main retrieval method
  - Discovers providers using `findProviders` `src/retriever/chain.ts` 93-99
  - Attempts parallel fetches using `fetchPiecesFromProviders` `src/retriever/chain.ts` 107-113
  - Falls back to child retriever on failure `src/retriever/chain.ts` 79-88

**Sources:** `src/retriever/chain.ts` 25-71, `src/retriever/chain.ts` 73-120

## FilCdnRetriever CDN Layer

The FilCdnRetriever provides CDN optimization by attempting CDN retrieval before falling back to the base retriever.

### CDN Configuration

**Network Configuration:**
- **Mainnet**: `filcdn.io`
- **Calibration**: `calibration.filcdn.io`

**CDN Behavior:**
- **`withCDN=true`**: Attempt CDN first
- **`withCDN=false`**: Skip CDN entirely

**Sources:** `src/retriever/filcdn.ts` 16-20, `src/retriever/filcdn.ts` 22-49

### CDN URL Construction

The CDN constructs URLs using the pattern: `https://{client}.{hostname}/{commP}`

- **Mainnet**: `https://{client}.filcdn.io/{commP}` `src/retriever/filcdn.ts` 17-18
- **Calibration**: `https://{client}.calibration.filcdn.io/{commP}` `src/retriever/filcdn.ts` 19

### Fallback Logic

The CDN retriever implements a graceful degradation strategy:

1. **CDN Success** (`status 200`): Return CDN response immediately  
   `src/retriever/filcdn.ts` 35-36

2. **Payment Required** (`status 402`): Log warning and fall back  
   `src/retriever/filcdn.ts` 37-38

3. **Other HTTP Error**: Log warning and fall back  
   `src/retriever/filcdn.ts` 39-41

4. **Network Error**: Log warning and fall back  
   `src/retriever/filcdn.ts` 42-44

5. **Fallback**: Use base retriever  
   `src/retriever/filcdn.ts` 47-48

**Sources:** `src/retriever/filcdn.ts` 31-49

## Provider Discovery Mechanisms

The system uses multiple mechanisms to discover providers that can serve requested pieces.

### Proof Set-Based Discovery

**Discovery Process:**
1. **Client Address** input
2. **Proof Set Query**: `getClientProofSetsWithDetails()`
3. **Filter**: `isLive && currentRootCount > 0`
4. **Extract unique payee addresses**
5. **Provider Resolution**: 
   - `getProviderIdByAddress()` for each payee
   - `getApprovedProvider()` for each id
6. **Result**: `ApprovedProviderInfo[]`

**Sources:** `src/retriever/chain.ts` 44-70

### Direct Provider Specification

When a specific provider address is provided, the system:

1. Validates provider exists using `getProviderIdByAddress()` `src/retriever/chain.ts` 31-32
2. Retrieves provider info using `getApprovedProvider()` `src/retriever/chain.ts` 39
3. Returns single-item provider array `src/retriever/chain.ts` 40

**Sources:** `src/retriever/chain.ts` 29-41

## Multi-Provider Retrieval Strategy

The system implements parallel provider fetching with intelligent racing to optimize retrieval speed and reliability.

### Parallel Fetch Architecture

**Provider Racing Process:**
1. ChainRetriever: `fetchPiecesFromProviders(providers, commP)`
2. **Parallel execution:**
   - Provider 1: `GET /pdp/piece?commP=...`
   - Provider 2: `GET /pdp/piece?commP=...`
   - Provider N: `GET /pdp/piece?commP=...`
3. **Result scenarios:**
   - **First Success Wins**: One provider returns `200 OK` → `GET /piece/{commP}` → `Response with data` → `Successful Response`
   - **All Providers Fail**: `404 Not Found`, `500 Error` → `AggregateError`

The system uses **Promise.any()** semantics to wait for the first successful response rather than the first settled promise, ensuring that fast-failing providers don't prevent slower successful providers from completing.

**Sources:** `src/retriever/chain.ts` 107-113, `src/test/retriever-chain.test.ts` 132-208

## Fallback Chain Strategy

The retrieval system implements a comprehensive fallback strategy to ensure data availability even when primary methods fail.

### Fallback Decision Tree

```
fetchPiece() called
       ↓
withCDN enabled?
    ↙       ↘
  Yes        No
    ↓         ↓
Try CDN fetch → Discover providers
    ↓
CDN success?
  ↙       ↘
Yes        No
 ↓          ↓
Return CDN → Discover providers
response
```

The decision tree ensures that:
- CDN is attempted first when enabled
- Provider discovery occurs when CDN fails or is disabled
- Multiple fallback layers provide redundancy

**Sources:** `src/test/retriever-chain.test.ts` 133-208

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/4.4-data-retrieval-chain*