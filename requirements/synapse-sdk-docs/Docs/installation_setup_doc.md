# Installation and Setup

## Relevant source files

This document covers the installation of the Synapse SDK package, dependency management, environment configuration, and initial setup procedures. For configuration options and API usage patterns, see Configuration Options. For usage examples with the main Synapse class, see Basic Usage Examples.

## Package Installation

The Synapse SDK is distributed as an npm package with modular exports supporting both Node.js and browser environments.

### NPM Installation

```bash
npm install @filoz/synapse-sdk ethers
```

The SDK requires ethers v6 as a peer dependency for blockchain interactions. The package exports are structured for selective imports:

### Package Structure

```
@filoz/synapse-sdk Package Root
├── Main Export
│   └── dist/index.js - Synapse Class Main API
├── CommP Module
│   └── dist/commp/index.js - calculate(), asCommP(), createCommPStream()
├── PDP Module
│   └── dist/pdp/index.js - PDPServer, PDPAuthHelper, PDPVerifier
├── Payments Module
│   └── dist/payments/index.js - PaymentsService Class
├── Pandora Module
│   └── dist/pandora/index.js - PandoraService Class
└── Browser Bundle
    └── dist/browser/synapse-sdk.min.js - UMD/ESM Bundles
```

**Sources**: `package.json` 8-33

### Import Patterns

The package supports both full SDK imports and selective module imports:

```javascript
// Full SDK import
import { Synapse, RPC_URLS, TOKENS } from '@filoz/synapse-sdk'

// Selective module imports
import { PaymentsService } from '@filoz/synapse-sdk/payments'
import { calculate, asCommP } from '@filoz/synapse-sdk/commp'
import { PDPServer, PDPAuthHelper } from '@filoz/synapse-sdk/pdp'
import { PandoraService } from '@filoz/synapse-sdk/pandora'
```

**Sources**: `package.json` 8-33, `README.md` 66-67

## Dependencies and Requirements

### Runtime Dependencies

The SDK has minimal runtime dependencies focused on blockchain and data handling:

| Dependency | Version | Purpose |
|---|---|---|
| **ethers** | ^6.14.3 | Blockchain interaction, wallet management |
| **@web3-storage/data-segment** | ^5.3.0 | CommP calculation, data segmentation |
| **multiformats** | ^13.3.6 | CID handling, data encoding |

**Sources**: `package.json` 63-67

### Environment Requirements

#### Node.js Environment
- **ESM Support Required**: import syntax, package.json type: module
- **TypeScript Support**: dist/*.d.ts

#### Browser Environment  
- **Modern ES6+ Support**: UMD/ESM Bundles in dist/browser/
- **ethers.js Integration**: Provider/Signer Pattern

The SDK requires environments with ES Module support. The `package.json` specifies `"type": "module"`, making all JavaScript files ES modules by default.

**Sources**: `package.json` 5, `package.json` 29-33

## Build System Configuration

### Development Build Process

The SDK uses TypeScript compilation with webpack bundling for browser compatibility:

```
src/ TypeScript Files
    ↓
tsc (TypeScript Compiler)
    ↓
dist/ Node.js Modules
    ↓
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ webpack --config            │  │ webpack --config            │
│ webpack.config.esm.cjs      │  │ webpack.config.cjs          │
│ ESM Bundle                  │  │ UMD Bundle                  │
└─────────────────────────────┘  └─────────────────────────────┘
    ↓                                ↓
dist/browser/synapse-sdk.esm.js  dist/browser/synapse-sdk.min.js
```

**Sources**: `package.json` 36-37, `package.json` 47

### Build Commands

| Command | Purpose |
|---|---|
| **npm run build** | Compile TypeScript to `dist/` |
| **npm run build:browser** | Build + create browser bundles |
| **npm run watch** | Watch mode TypeScript compilation |
| **npm run clean** | Remove `dist/` directory |

**Sources**: `package.json` 35-47

## Initial Setup Patterns

### Basic Initialization

The Synapse class serves as the main entry point with multiple initialization patterns:

#### Initialization Flow
```
Synapse.create()
Static Factory Method
    ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Private Key   │  │ Provider      │  │ Signer        │
│ Setup         │  │ Setup         │  │ Setup         │
│ {privateKey:  │  │ {provider:    │  │ {signer:      │
│ string}       │  │ ethers.       │  │ ethers.       │
│               │  │ Provider}     │  │ Signer}       │
└───────────────┘  └───────────────┘  └───────────────┘
    ↓                      ↓                      ↓
        └─────────────────────────────────────────────┘
                            ↓
                Network Configuration
                rpcURL, authorization
                            ↓
                    Synapse Instance
                payments, createStorage()
```

**Sources**: `README.md` 69-73, `README.md` 196-228

### Network Configuration

The SDK provides predefined RPC endpoints and supports custom configuration:

```javascript
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk'

// Using predefined endpoints
const synapse = await Synapse.create({
 privateKey: '0x...',
 rpcURL: RPC_URLS.calibration.websocket
})

// Custom RPC with authorization
const synapse = await Synapse.create({
 privateKey: '0x...',
 rpcURL: 'https://api.node.glif.io/rpc/v1',
 authorization: 'Bearer YOUR_GLIF_TOKEN'
})
```

**Sources**: `README.md` 764-788

## Browser Environment Setup

### Bundle Integration

The SDK provides browser-optimized bundles for different integration patterns:

#### Browser Integration Flow
```
Browser Integration
    ↓
┌─────────────────┐    ┌─────────────────┐
│ ESM Bundle      │    │ UMD Bundle      │
│ synapse-        │    │ synapse-        │
│ sdk.esm.js      │    │ sdk.min.js      │
└─────────────────┘    └─────────────────┘
    ↓                           ↓
import { Synapse } from              MetaMask Integration
'./synapse-sdk.esm.js'              ethers.BrowserProvider
```

**Sources**: `package.json` 29-33

### MetaMask Integration Pattern

```javascript
import { Synapse } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

// Browser provider integration
const provider = new ethers.BrowserProvider(window.ethereum)
const synapse = await Synapse.create({ provider })
```

**Sources**: `README.md` 117-123

### Network Addition for MetaMask

The SDK supports programmatic network addition for Filecoin networks:

```javascript
// Add Filecoin Mainnet to MetaMask
await window.ethereum.request({
 method: 'wallet_addEthereumChain',
 params: [{
 chainId: '0x13A', // 314 for mainnet
 chainName: 'Filecoin',
 nativeCurrency: { name: 'FIL', symbol: 'FIL', decimals: 18 },
 rpcUrls: ['https://api.node.glif.io/rpc/v1'],
 blockExplorerUrls: ['https://filfox.info/en']
 }]
})
```

**Sources**: `README.md` 814-825

## Testing and Development Setup

### Test Configuration

The SDK uses a comprehensive testing setup with both Node.js and browser testing:

#### Test Suite Flow
```
npm test
Complete Test Suite
    ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ts-standard │  │ npm run     │  │ mocha       │  │ polendina   │
│ Code        │  │ build       │  │ Node.js     │  │ Browser     │
│ Linting     │  │ TypeScript  │  │ Tests       │  │ Tests       │
│             │  │ Compilation │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                         ↓
                dist/test/**/*.js
```

**Sources**: `package.json` 39-45, `.github/workflows/test-and-release.yml` 22-24

### Development Commands

| Command | Purpose |
|---|---|
| **npm test** | Run complete test suite |
| **npm run test:node** | Node.js tests only |
| **npm run test:browser** | Browser tests only |
| **npm run lint** | Code linting |
| **npm run lint:fix** | Auto-fix linting issues |

**Sources**: `package.json` 39-45

The setup process ensures the SDK works consistently across Node.js and browser environments with proper TypeScript support and comprehensive testing coverage.

---

*Document source: FilOzone/synapse-sdk Installation and Setup Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/2.1-installation-and-setup*  
*Generated on: August 26, 2025*