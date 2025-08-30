# Getting Started

## Relevant source files

This page provides an overview of installing and initially configuring the Synapse SDK for Filecoin storage operations. It covers the essential concepts and workflow for your first interactions with the SDK, from installation through your first storage operation.

For detailed installation instructions and configuration options, see Installation and Setup. For comprehensive code examples, see Basic Usage Examples. For advanced configuration scenarios, see Configuration Options.

## Overview and Core Concepts

The Synapse SDK provides a JavaScript/TypeScript interface to Filecoin Synapse, a smart-contract marketplace for decentralized storage services. The SDK is designed with two usage patterns: a high-level Synapse class for streamlined operations, and individual composable components for advanced use cases.

### SDK Entry Points and Core Classes

The following diagram shows the primary classes and interfaces developers interact with when getting started:

#### Primary Entry Points
- **Synapse.create()** - Main factory method
- **Synapse Class** - Core orchestrator

#### Configuration
- **SynapseOptions Interface** - Configuration options
- **RPC_URLS Constants** - Predefined endpoints
- **CONTRACT_ADDRESSES Constants** - Network-specific addresses

#### Core Services
- **PaymentsService** - Token operations and approvals
- **StorageService** - Upload/download operations

#### Network Support
- **Filecoin Mainnet (314)** - Production environment
- **Calibration Testnet (314159)** - Development/testing

**Sources**: `README.md` 196-228, `src/synapse.ts`, `src/utils/constants.ts`, `src/types.ts`

## Getting Started Workflow

The typical getting started workflow follows this sequence:

### Complete Workflow Phases

#### Installation & Setup Phase
1. **Developer** → **Synapse SDK**: `npm install @filoz/synapse-sdk ethers`
2. **Developer** → **Synapse SDK**: `Synapse.create(options)`
3. **Synapse SDK** → **Filecoin Network**: Validate network connection
4. **Synapse SDK** → **Developer**: Synapse instance

#### Payment Setup Phase
5. **Developer** → **PaymentsService**: `deposit(amount, TOKENS.USDFC)`
6. **PaymentsService** → **Filecoin Network**: Submit deposit transaction
7. **Developer** → **PaymentsService**: `approveService(pandoraAddress, ...)`
8. **PaymentsService** → **Filecoin Network**: Submit approval transaction

#### Storage Operations Phase
9. **Developer** → **StorageService**: `createStorage(options?)`
10. **StorageService** → **Filecoin Network**: Initialize StorageService
11. **StorageService** → **Filecoin Network**: Select provider & proof set
12. **StorageService** → **Developer**: StorageService instance
13. **Developer** → **StorageService**: `upload(data)`
14. **StorageService** → **Filecoin Network**: Upload to storage provider
15. **Developer** → **StorageService**: `download(commp)`
16. **StorageService** → **Filecoin Network**: Retrieve from storage provider

**Sources**: `README.md` 62-113, `utils/example-storage-e2e.js` 58-251

## Installation Overview

The SDK requires Node.js 18+ or a modern browser environment and has ethers v6 as a peer dependency:

```bash
npm install @filoz/synapse-sdk ethers
```

The SDK supports multiple distribution formats:

- **CommonJS/ESM**: Standard Node.js imports via `dist/index.js`
- **Browser UMD**: Global `window.SynapseSDK` via `dist/browser/synapse-sdk.min.js`
- **Browser ESM**: ES module imports via `dist/browser/synapse-sdk.esm.js`

**Sources**: `README.md` 16-22, `package.json`

## Core Configuration Concepts

### Wallet Integration Options

The SDK supports three mutually exclusive wallet configuration patterns:

| Configuration | Use Case | Example |
|---|---|---|
| **privateKey** | Server-side, automated operations | Node.js applications, scripts |
| **provider** | Browser wallets, user interactions | MetaMask, WalletConnect |
| **signer** | External signer integration | Hardware wallets, custom signers |

### Network Configuration

The SDK supports two Filecoin networks with built-in constants:

| Network | Chain ID | Usage | Constants |
|---|---|---|---|
| **Mainnet** | 314 | Production | `RPC_URLS.mainnet.*` |
| **Calibration** | 314159 | Testing/Development | `RPC_URLS.calibration.*` |

Network-specific contract addresses are automatically resolved through `CONTRACT_ADDRESSES` constants.

**Sources**: `README.md` 196-228, `src/utils/constants.ts`

## Essential Services Overview

### PaymentsService

Accessed via `synapse.payments`, this service handles:

- **Token Operations**: USDFC deposits, withdrawals, balance checks
- **Service Approvals**: Authorize Pandora service for automated payments
- **Account Management**: Monitor funds, lockups, and allowances

Key methods include `deposit()`, `withdraw()`, `approveService()`, and `balance()`.

### StorageService

Created via `synapse.createStorage()`, this service provides:

- **Data Operations**: Upload and download operations with CommP validation
- **Provider Integration**: Automatic provider selection and proof set management
- **Cost Management**: Preflight checks and allowance validation

Key methods include `upload()`, `providerDownload()`, and `preflightUpload()`.

**Sources**: `README.md` 231-261, `src/payments/service.ts`, `src/storage/service.ts`

## Payment Setup Requirements

Before performing storage operations, developers must complete a payment setup workflow:

### Required Setup Steps

The payment setup involves three smart contracts and specific steps:

#### Setup Flow
1. **deposit() USDFC tokens** → **USDFC Token Contract**
2. **approveService() Pandora contract** → **Payments Contract**  
3. **Check allowances sufficient** → **Pandora Service Contract**

This ensures that the user has sufficient USDFC tokens deposited and has authorized the Pandora service to manage payments for storage operations.

**Sources**: `README.md` 94-113, `README.md` 167-191

---

*Document source: FilOzone/synapse-sdk Getting Started Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/2-getting-started*  
*Generated on: August 26, 2025*