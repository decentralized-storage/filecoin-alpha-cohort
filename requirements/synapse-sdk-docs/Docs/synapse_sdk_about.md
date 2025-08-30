# Synapse SDK Documentation

## What is Synapse SDK

This document explains the purpose, architecture, and core components of the Synapse SDK - a JavaScript/TypeScript interface for interacting with Filecoin Synapse, a smart-contract marketplace for storage services in the Filecoin ecosystem. For installation and basic usage examples, see Getting Started. For detailed component documentation, see Core Architecture.

### Purpose and Scope

The Synapse SDK serves as a developer-friendly JavaScript/TypeScript interface to Filecoin Synapse, enabling applications to interact with decentralized storage services through smart contracts. The SDK abstracts the complexity of blockchain interactions, proof-of-data-possession (PDP) protocols, and storage provider coordination while maintaining flexibility for advanced use cases.

The SDK operates within the Filecoin ecosystem as a client-side library that communicates with storage providers running Curio nodes, which in turn interact with on-chain smart contracts for verification and payment processing.

**Sources:** README.md 1-15, AGENTS.md 5-11

### System Architecture Overview

The SDK integrates with multiple components in the Filecoin ecosystem:

- **Client Applications:** Web Applications, Node.js Applications, CLI Tools
- **Synapse SDK:** Main interface layer (`@filoz/synapse-sdk`)
- **Storage Providers:** Curio Nodes with HTTP API endpoints
- **Smart Contracts:** 
  - PDPVerifier Contract: `0x5A23b7df87f59A291C26`
  - Pandora Contract: `0xf49ba5eaCdFD5EE3744`
  - Payments Contract: `0x0E690D3e60B0576D01`
  - USDFC Token: `0xb3042734b608a1B16e9`

**Sources:** README.md 5-15, AGENTS.md 127-163, src/utils/constants.ts

### SDK Design Philosophy

The Synapse SDK follows a dual-approach architecture that balances simplicity with flexibility:

| Approach | Target Users | Implementation |
|----------|--------------|----------------|
| **Simple Golden Path** | Application developers seeking quick integration | Synapse class with sensible defaults |
| **Composable Components** | Advanced users needing fine-grained control | Individual service imports and configuration |

### Core Components and Their Responsibilities

The SDK is organized into several key layers:

#### Main Synapse Class

The Synapse class in `src/synapse.ts` serves as the primary entry point with minimal surface area:

- **Factory Pattern:** `Synapse.create(options)` for async initialization
- **Payment Access:** `synapse.payments` property exposing PaymentsService
- **Storage Creation:** `createStorage()` method returning StorageService instances
- **Network Validation:** Strict validation supporting only Filecoin mainnet and calibration networks

#### Service Layer Components

| Component | File Location | Primary Responsibilities |
|-----------|---------------|-------------------------|
| **PaymentsService** | `src/payments/service.ts` | USDFC token operations, deposits, withdrawals, service approvals |
| **StorageService** | `src/storage/service.ts` | Upload/download operations, proof set management, CommP validation |
| **PandoraService** | `src/pandora/service.ts` | Storage cost calculations, allowance checking, proof set coordination |

#### PDP Protocol Components

| Component | File Location | Protocol Role |
|-----------|---------------|---------------|
| **PDPAuthHelper** | `src/pdp/auth.ts` | EIP-712 signature generation for authenticated operations |
| **PDPServer** | `src/pdp/server.ts` | HTTP client for Curio storage provider APIs |
| **PDPVerifier** | `src/pdp/verifier.ts` | Smart contract interface for on-chain proof verification |

**Sources:** src/synapse.ts, src/payments/service.ts, src/storage/service.ts, src/pandora/service.ts, AGENTS.md 15-21

### Integration with Filecoin Ecosystem

#### Data Flow and Smart Contract Integration

The SDK orchestrates complex workflows between client applications and the Filecoin ecosystem:

**Upload Operation Flow:**
1. `storage.upload(data)` - Calculate CommP
2. `POST /pdp/piece` - Upload data to Curio storage provider
3. Store piece, create pdp_piecerefs
4. Sign EIP-712 addRoots operation
5. `POST /pdp/proof-sets/{id}/roots` - Submit proof
6. `addRoots(signature as extraData)` - Contract validation
7. PDPListener callback processes payment via rails

**Download Operation Flow:**
1. `synapse.download(commp)` - Query providers via SubgraphService
2. `GET /pdp/piece/` - Retrieve data from storage provider
3. Return piece data stream
4. Validate CommP matches expected
5. Return validated data

**Sources:** AGENTS.md 222-286, src/storage/service.ts, src/pdp/server.ts

### Network and Token Support

The SDK operates on Filecoin networks with specific contract addresses defined in `src/utils/constants.ts`:

| Network | Chain ID | USDFC Token Address | Key Contracts |
|---------|----------|-------------------|---------------|
| **Calibration Testnet** | 314159 | `0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0` | Pandora, Payments, PDPVerifier |
| **Mainnet** | 314 | `0x80B98d3aa09ffff255c3ba4A241111Ff1262F045` | Production contracts |

**Payment Token Integration:**
- Primary payment currency: USDFC (USD Filecoin token)
- Balance operations: FIL and USDFC wallet balance checking
- All amounts handled as `bigint` to avoid floating-point precision issues

**Sources:** src/utils/constants.ts, README.md 793-800, AGENTS.md 80-84

## Package Structure

## NPM Package Exports

The Synapse SDK is published as `@filoz/synapse-sdk` and uses Node.js package exports to provide both a main entry point and granular submodule access. The package structure allows developers to import either the complete SDK or individual modules.

### Main Package Export

The primary SDK interface is exported from the root package:

```javascript
import { Synapse } from '@filoz/synapse-sdk'
```

This provides access to the main Synapse class and all exported types and utilities.

### Submodule Exports

Individual modules can be imported directly to reduce bundle size:

| Export Path | Purpose | Main Classes |
|-------------|---------|--------------|
| `@filoz/synapse-sdk/commp` | CommP calculation utilities | `calculate()`, `createCommPStream()` |
| `@filoz/synapse-sdk/pdp` | Proof of Data Possession | `PDPServer`, `PDPAuthHelper` |
| `@filoz/synapse-sdk/payments` | Payment operations | `PaymentsService` |
| `@filoz/synapse-sdk/pandora` | Storage coordination | `PandoraService` |
| `@filoz/synapse-sdk/browser` | Browser-specific builds | UMD and ESM bundles |

**Sources:** package.json 8-34

## Module Architecture Diagram

The SDK follows a modular architecture with clear separation between browser support, core modules, and utility functions.

**Sources:** package.json 8-34, src/index.ts 1-13

## Source Module Organization

The SDK source code is organized into focused modules that align with the npm package exports:

### Core Modules

| Source Structure | NPM Package | Purpose |
|------------------|-------------|---------|
| `src/index.ts` | Main entry exports | Main entry exports |
| `src/commp/` | `./commp` | CommP utilities |
| `src/pdp/` | `./pdp` | PDP components |
| `src/payments/` | `./payments` | PaymentsService |
| `src/pandora/` | `./pandora` | PandoraService |
| `src/storage/` | - | StorageService |
| `src/utils/` | - | Shared utilities |
| `src/types.ts` | - | Type definitions |

### Package Distribution Structure

| Submodule Exports | Browser Support |
|-------------------|-----------------|
| `dist/index.js`, `dist/index.d.ts` | - |
| `dist/commp/index.js`, `dist/commp/index.d.ts` | - |
| `dist/pdp/index.js`, `dist/pdp/index.d.ts` | - |
| `dist/payments/index.js`, `dist/payments/index.d.ts` | - |
| `dist/pandora/index.js`, `dist/pandora/index.d.ts` | - |
| `./browser` (ESM) | `dist/browser/synapse-sdk.esm.js` |
| `./browser` (UMD) | `dist/browser/synapse-sdk.min.js` |

**Sources:** src/index.ts 5-12

## Build System and Distribution

The SDK uses a multi-stage build process to support different deployment targets:

### Build Pipeline

| Stage | Command | Output | Purpose |
|-------|---------|--------|---------|
| TypeScript Compilation | `tsc` | `dist/` directory | Compile TS to JS with type definitions |
| Browser Bundle (ESM) | `webpack --config webpack.config.esm.cjs` | `dist/browser/synapse-sdk.esm.js` | ES6 module for modern browsers |
| Browser Bundle (UMD) | `webpack --config webpack.config.cjs` | `dist/browser/synapse-sdk.min.js` | Universal module for script tags |

### Package Distribution Structure

#### src/ Directory Structure

**Utility Modules:**
- `commp/` - `calculate()`, `createCommPStream()`
- `index.ts` - Main exports
- `types.ts` - TypeScript interfaces
- `synapse.ts` - Main Synapse class

**Service Modules:**
- `payments/` - PaymentsService, USDFC operations
- `pandora/` - PandoraService, Storage coordination
- `storage/` - StorageService, Upload/download
- `pdp/` - PDPServer, PDPAuthHelper
- `utils/` - Shared utilities, Constants
- `subgraph/` - Provider discovery

**Sources:** src/index.ts 5-12

## Environment Support

The SDK supports multiple JavaScript environments through different distribution formats:

### Node.js Support

- **Module Type:** ESM (`"type": "module"`)
- **Main Entry:** `dist/index.js`
- **TypeScript Support:** Full type definitions included
- **Import Style:** `import { Synapse } from '@filoz/synapse-sdk'`

### Browser Support

The SDK provides two browser bundle formats:

| Format | File | Use Case | Import Method |
|--------|------|----------|---------------|
| ESM | `synapse-sdk.esm.js` | Modern bundlers, ES6 imports | `import { Synapse } from '@filoz/synapse-sdk/browser'` |
| UMD | `synapse-sdk.min.js` | Script tags, legacy environments | `<script>` tag, global `SynapseSDK` |

### Published Package Structure

#### Package Metadata
- `package.json` - Export definitions
- `LICENSE.md` - Apache-2.0 OR MIT
- `CHANGELOG.md` - Release history

#### Browser Bundles
- `dist/browser/synapse-sdk.esm.js` - ES6 Module
- `dist/browser/synapse-sdk.min.js` - Universal Module

#### Compiled JavaScript
**Module Distributions:**
- `dist/commp/index.js`, `dist/commp/index.d.ts`
- `dist/pdp/index.js`, `dist/pdp/index.d.ts`
- `dist/payments/index.js`, `dist/payments/index.d.ts`
- `dist/pandora/index.js`, `dist/pandora/index.d.ts`
- `dist/index.js` - Main entry point
- `dist/index.d.ts` - TypeScript definitions

**Sources:** package.json 35-47, package.json 6-7

## Dependencies and External Integration

The SDK has a minimal dependency footprint focused on blockchain and data handling:

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ethers` | ^6.14.3 | Ethereum blockchain interactions |
| `@web3-storage/data-segment` | ^5.3.0 | Data segmentation for CommP |
| `multiformats` | ^13.3.6 | Content addressing and encoding |

### Development Dependencies

The build system relies on:

- **TypeScript** (^5.8.3): Type checking and compilation
- **Webpack** (^5.99.9): Browser bundle creation
- **Mocha + Chai**: Testing framework

**Sources:** package.json 29-33, package.json 5