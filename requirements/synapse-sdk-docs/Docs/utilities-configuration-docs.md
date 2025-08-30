# Utilities and Configuration

**FilOzone/synapse-sdk Documentation**

---

## Overview

This document covers the utility functions, constants, and configuration helpers that support the Synapse SDK's core functionality. These utilities provide essential building blocks for network configuration, time calculations, data validation, and error handling throughout the SDK.

The utilities are organized into several key areas: network constants and contract addresses, Filecoin epoch and time calculations, data size validation, blockchain operation timeouts, and helper functions for piece URL construction and error handling. For information about the main SDK classes and their interactions, see Core Architecture.

## Utility Module Structure

The SDK's utility functions are organized in a modular structure that provides both low-level constants and higher-level helper functions to other SDK components.

### Utility Module Organization

```
utils Module
├── utils/index.ts (Main Export Point)
├── constants.ts (Network & Contract Constants)
├── epoch.ts (Time & Epoch Calculations)
├── errors.js (Error Creation)
└── piece.js (URL Construction)
    │
    ├─── Core Utilities ─────────────────┐
    │                                    │
    ├── Epoch Functions                  │
    │   ├── epochToDate()                │
    │   ├── dateToEpoch()                │
    │   ├── timeUntilEpoch()             │
    │   └── calculateLastProofDate()     │
    │                                    │
    └── Constant Categories              │
        ├── TOKENS (USDFC, FIL)          │
        ├── CHAIN_IDS                    │
        │   ├── mainnet: 314             │
        │   └── calibration: 314159      │
        ├── CONTRACT_ADDRESSES           │
        │   ├── USDFC                    │
        │   ├── PAYMENTS                 │
        │   ├── PANDORA_SERVICE          │
        │   └── PDP_VERIFIER             │
        ├── CONTRACT_ABIS                │
        │   ├── ERC20                    │
        │   ├── PAYMENTS                 │
        │   ├── PANDORA_SERVICE          │
        │   └── PDP_VERIFIER             │
        ├── TIME_CONSTANTS               │
        │   └── EPOCH_DURATION           │
        │   └── EPOCHS_PER_DAY           │
        └── SIZE_CONSTANTS               │
            ├── KiB, MiB, GiB, TiB       │
            └── MAX_UPLOAD_SIZE          │
                    │
                    ├─── SDK Components ──┐
                    │                     │
                    ├── Synapse Class
                    ├── PaymentsService
                    ├── PandoraService
                    └── StorageService
```

## Network Configuration System

The SDK uses a comprehensive configuration system that defines network parameters, contract addresses, and operational constants for different Filecoin networks.

### Network Configuration Architecture

```
Network Configuration
├── FilecoinNetworkType ('mainnet' | 'calibration')
├── Network Constants
│   ├── CHAIN_IDS
│   │   ├── mainnet: 314
│   │   └── calibration: 314159
│   ├── RPC_URLS (HTTP & WebSocket endpoints)
│   └── GENESIS_TIMESTAMPS
│       ├── mainnet: 1598306400
│       └── calibration: 1667326380
├── Contract System
│   ├── USDFC Token
│   │   ├── mainnet: 0x80B98d3aa...
│   │   └── calibration: 0xb3042734b...
│   ├── PAYMENTS Contract
│   │   └── calibration: 0x0E690D3e6...
│   ├── PANDORA_SERVICE
│   │   └── calibration: 0xf49ba5eaC...
│   └── PDP_VERIFIER
│       └── calibration: 0x5A23b7df8...
└── ABIs
    ├── ERC20 ABI (balanceOf, approve, transfer)
    ├── PAYMENTS ABI (deposit, withdraw, accounts)
    ├── PANDORA_SERVICE ABI (registerServiceProvider, getServicePrice)
    └── PDP_VERIFIER ABI (getNextRootId, proofSetLive)
        │
        └─── Usage in SDK ────────────┐
                                      │
            ├── Contract Initialization
            ├── Network Operations
            └── Synapse.create()
```

## Epoch and Time Calculations

The SDK provides comprehensive utilities for converting between Filecoin epochs and standard time formats, essential for proof scheduling and blockchain operations.

### Epoch Calculation Flow

```
Time Inputs                    Conversion Functions              Time Constants
├── JavaScript Date ─────────► dateToEpoch() ──────────────────► EPOCH_DURATION: 30 seconds
├── Filecoin Epoch Number ───► epochToDate() ──────────────────► EPOCHS_PER_DAY: 2880n
└── FilecoinNetworkType ─────► timeUntilEpoch() ───────────────► EPOCHS_PER_MONTH: 86400n
                               calculateLastProofDate() ────────► GENESIS_TIMESTAMPS
                                      │                              │
                                      └─── Applications ─────────────┘
                                           ├── Proof Set Scheduling
                                           ├── Payment Period Calculations
                                           └── Piece Status Reports
```

### Key Functions

| Function | Input | Output | Purpose |
|----------|-------|---------|---------|
| **dateToEpoch()** | Date, Network | Epoch Number | Date → Epoch conversion |
| **epochToDate()** | Epoch, Network | JavaScript Date | Epoch → Date conversion |
| **timeUntilEpoch()** | Future Epoch, Network | Time Breakdown | Calculate time difference |
| **calculateLastProofDate()** | Challenge Epoch, Period, Network | Date | PDP proof timing |

## Data Size and Timing Constants

The SDK defines strict limits and timing parameters for blockchain operations and data handling to ensure reliable performance across the Filecoin network.

### Constants Reference Table

| Constant Category | Key Constants | Values | Purpose |
|-------------------|---------------|---------|---------|
| **Data Sizes** | `MAX_UPLOAD_SIZE` | 200 MiB | Current PDP upload limit |
|  | `MIN_UPLOAD_SIZE` | 65 bytes | Minimum for CommP calculation |
|  | Size units | `KiB`, `MiB`, `GiB`, `TiB` | Binary size calculations |
| **Time Periods** | `EPOCH_DURATION` | 30 seconds | Filecoin epoch length |
|  | `EPOCHS_PER_DAY` | 2880 | Daily epoch count |
|  | `DEFAULT_LOCKUP_DAYS` | 10 days | Payment lockup period |
| **Operation Timeouts** | `PROOF_SET_CREATION_TIMEOUT_MS` | 7 minutes | Proof set setup limit |
|  | `PIECE_PARKING_TIMEOUT_MS` | 7 minutes | Upload completion limit |
|  | `TRANSACTION_PROPAGATION_TIMEOUT_MS` | 30 seconds | TX propagation wait |
| **Polling Intervals** | `PROOF_SET_CREATION_POLL_INTERVAL_MS` | 2 seconds | Blockchain polling rate |
|  | `PIECE_PARKING_POLL_INTERVAL_MS` | 5 seconds | Upload status polling |

## Utility Function Integration

The utility functions integrate throughout the SDK to provide consistent error handling, URL construction, and validation across all components.

### Utility Function Usage Patterns

```
SDK Components Using Utilities

├── URL Construction
│   ├── constructPieceUrl() - Build piece URLs
│   └── constructFindPieceUrl() - Build search URLs
├── Error Handling
│   ├── createError() - Standardized error creation
│   └── Error types with causes
└── Validation Utilities
    ├── Size limit validation (MIN_UPLOAD_SIZE ≤ size ≤ MAX_UPLOAD_SIZE)
    ├── Timeout validation (Using TIMING_CONSTANTS)
    └── Network parameter validation (Using CHAIN_IDS, CONTRACT_ADDRESSES)
        │
        ├─── Component Integration ─────────────────┐
        │                                           │
        ├── StorageService                          │
        │   ├── Size validation                     │
        │   ├── URL construction                    │
        │   └── Timeout handling                    │
        ├── PaymentsService                         │
        │   ├── Network validation                  │
        │   ├── Error handling                      │
        │   └── Time calculations                   │
        ├── PandoraService                          │
        │   ├── Contract addresses                  │
        │   ├── ABI constants                       │
        │   └── Error handling                      │
        └── PDP Components                          │
            ├── Epoch calculations                  │
            ├── Timeout constants                   │
            └── URL construction                    │
```

## Configuration Best Practices

The SDK's utility system follows several key patterns for maintainable and reliable configuration:

### Typed Constants

All constants use TypeScript's `as const` assertions and satisfy type constraints to ensure type safety at compile time. Network-specific configurations use mapped types to guarantee completeness across all supported networks.

### Hierarchical Organization

Constants are grouped by functional area (`TOKENS`, `CONTRACT_ABIS`, `TIME_CONSTANTS`) and further subdivided by specific use cases. This organization makes it easy to locate and update related configuration values.

### Environment-Specific Values

The system supports both mainnet and calibration testnet configurations through the `FilecoinNetworkType` enum with dedicated constant maps for network-specific values like:

- Chain IDs and RPC endpoints
- Contract deployment addresses
- Genesis timestamps for epoch calculations
- Network-specific operational parameters

### Error Handling Standards

Utility functions provide:
- **Standardized Error Creation**: Consistent error types across all SDK components
- **Error Context**: Detailed error information with causes and suggestions
- **Type-Safe Validation**: Compile-time validation of configuration parameters

### URL Construction Patterns

URL utilities follow consistent patterns:
- **Base URL Configuration**: Centralized endpoint management
- **Parameter Encoding**: Standardized query parameter handling
- **Network Routing**: Automatic network-specific URL generation

### Validation Utilities

Built-in validation ensures:
- **Size Constraints**: Automatic enforcement of upload limits
- **Network Compatibility**: Validation of network-specific parameters
- **Timeout Management**: Consistent timeout handling across operations

## Integration Examples

### Network Configuration Usage

```javascript
import { CHAIN_IDS, CONTRACT_ADDRESSES } from '@filoz/synapse-sdk';

// Network-specific contract address resolution
const contractAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[network];
const chainId = CHAIN_IDS[network];
```

### Epoch Calculation Usage

```javascript
import { epochToDate, calculateLastProofDate } from '@filoz/synapse-sdk';

// Convert epoch to human-readable date
const proofDueDate = epochToDate(challengeEpoch, 'mainnet');

// Calculate proof deadline
const lastProofDate = calculateLastProofDate(
    nextChallengeEpoch, 
    maxProvingPeriod, 
    'mainnet'
);
```

### Size Validation Usage

```javascript
import { MAX_UPLOAD_SIZE, MIN_UPLOAD_SIZE } from '@filoz/synapse-sdk';

// Validate upload size
if (fileSize > MAX_UPLOAD_SIZE || fileSize < MIN_UPLOAD_SIZE) {
    throw new Error('File size out of allowed range');
}
```

---

**Sources:**
- `src/utils/index.ts` (lines 1-5)
- `src/utils/constants.ts` (lines 1-307, 16-21, 250-259, 264-296, 26-106, 154-187, 192-245, 111-136)
- `src/utils/epoch.ts` (lines 1-97, 14-33, 76-96)
- `utils/example-piece-status.js` (lines 104-239)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/7-utilities-and-configuration