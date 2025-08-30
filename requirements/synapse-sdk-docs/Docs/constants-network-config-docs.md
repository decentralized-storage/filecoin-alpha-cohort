# Constants and Network Configuration

**FilOzone/synapse-sdk Documentation**

---

## Overview

This page documents the centralized constants and network configuration system used throughout the Synapse SDK. The constants module provides network-specific contract addresses, ABIs, timing parameters, size limits, and other configuration values that enable the SDK to operate across different Filecoin networks.

For information about epoch calculations and time utilities that use these constants, see Epoch and Time Utilities. For details about the main Synapse class that consumes these configurations, see Synapse Class.

## Network Configuration System

The Synapse SDK supports multiple Filecoin networks through a centralized configuration system. The `FilecoinNetworkType` defines supported networks, with corresponding chain IDs, RPC endpoints, and genesis timestamps.

### Network Type Hierarchy

```
Network Types
├── FilecoinNetworkType
    ├── mainnet
    └── calibration
        │
        ├─── Network Properties ─────────────┐
        │                                    │
        ├── CHAIN_IDS                        │
        │   ├── 314 (mainnet)                │
        │   └── 314159 (calibration)         │
        ├── RPC_URLS                         │
        │   ├── api.node.glif.io             │
        │   └── api.calibration.node.glif.io │
        └── GENESIS_TIMESTAMPS               │
            ├── 1598306400 (mainnet)         │
            └── 1667326380 (calibration)     │
```

The network configuration provides chain-specific parameters:

| Network | Chain ID | HTTP RPC | Genesis Timestamp |
|---------|----------|----------|------------------|
| **mainnet** | 314 | https://api.node.glif.io/rpc/v1 | 1598306400 (Aug 24, 2020) |
| **calibration** | 314159 | https://api.calibration.node.glif.io/rpc/v1 | 1667326380 (Nov 1, 2022) |

## Contract System Configuration

The SDK interacts with multiple smart contracts across different networks. Contract addresses and ABIs are managed centrally to ensure consistency and enable network switching.

### Contract Address Mapping

```
Network Addresses
├── Contract Types
    ├── USDFC Token
    ├── PAYMENTS Contract  
    ├── PANDORA_SERVICE Contract
    └── PDP_VERIFIER Contract
        │
        ├─── Mainnet Addresses ────────┐
        │   ├── 0x80B98d3aa09ffff255c3... (USDFC)
        │   ├── 0x0E690D3e60B0576D01...   (PAYMENTS)
        │   ├── 0xf49ba5eaCdFD5EE3744...  (PANDORA_SERVICE)
        │   └── 0x5A23b7df87f59A291C26... (PDP_VERIFIER)
        │
        └─── Calibration Addresses ────┐
            ├── 0xb3042734b608a1B16e9... (USDFC)
            ├── TBD (PAYMENTS)
            ├── TBD (PANDORA_SERVICE)
            └── TBD (PDP_VERIFIER)
```

### Contract ABI System

The SDK includes comprehensive ABIs for all contract interactions:

| Contract | Key Functions | Purpose |
|----------|---------------|---------|
| **ERC20** | `balanceOf`, `approve`, `allowance` | Token operations |
| **PAYMENTS** | `deposit`, `withdraw`, `setOperatorApproval` | Payment management |
| **PANDORA_SERVICE** | `registerServiceProvider`, `getClientProofSets` | Provider and proof set management |
| **PDP_VERIFIER** | `getNextRootId`, `proofSetLive` | Proof verification |

## Timing and Size Limits

The SDK defines critical timing parameters for blockchain operations and data size constraints that align with Filecoin network capabilities and PDP system requirements.

### Timing Configuration

```
Blockchain Timing
├── EPOCH_DURATION: 30s
├── TRANSACTION_PROPAGATION_TIMEOUT_MS: [value]
├── TRANSACTION_PROPAGATION_POLL_INTERVAL_MS: [value]
└── TRANSACTION_CONFIRMATIONS: 1

Epoch Calculations
├── EPOCHS_PER_DAY: 2880
├── EPOCHS_PER_MONTH: 86400
└── DEFAULT_LOCKUP_DAYS: 10

Polling Intervals
├── PROOF_SET_CREATION_POLL_INTERVAL_MS: 2000
├── PIECE_PARKING_POLL_INTERVAL_MS: 5000
└── ROOT_ADDITION_POLL_INTERVAL_MS: 1000

Operation Timeouts
├── PROOF_SET_CREATION_TIMEOUT_MS: 420000
├── PIECE_PARKING_TIMEOUT_MS: 420000
└── ROOT_ADDITION_TIMEOUT_MS: 420000
```

### Size Constraints

The SDK enforces data size limits that align with PDP system capabilities:

| Constraint | Value | Purpose |
|------------|-------|---------|
| **MAX_UPLOAD_SIZE** | 200 MiB | Current PDP upload limitation |
| **MIN_UPLOAD_SIZE** | 65 bytes | Minimum for CommP calculation |
| **Storage unit constants** | KiB, MiB, GiB, TiB | Standardized size calculations |

## Token and Multihash Configuration

The SDK standardizes token identifiers and multihash formats used throughout the Filecoin storage system.

### Token System

```
Token Types                Token Usage
├── TOKENS                 ├── PaymentsService
    ├── USDFC ─────────────────► PandoraService
    └── FIL ───────────────────► Contract Calls
```

### Multihash Standards

The SDK uses Filecoin-specific multihash formats for data integrity:

- **SHA2_256_TRUNC254_PADDED**: Used for CommP (piece commitment) calculations
- Ensures compatibility with Filecoin's content addressing system

## Constants Usage Throughout SDK

The constants module serves as the single source of truth for configuration across all SDK services:

```
Constants Module (src/utils/constants.ts)
├── CHAIN_IDS, RPC_URLS
├── CONTRACT_ADDRESSES, CONTRACT_ABIS  
├── TIMING_CONSTANTS, TIME_CONSTANTS
└── SIZE_CONSTANTS
    │
    ├─── SDK Services ──────────────┐
    │                               │
    ├── Utility Functions
    ├── PaymentsService
    ├── PandoraService
    └── Contract Calls
```

## Configuration Categories

### Network Configuration
- Chain IDs for network identification
- RPC endpoints for blockchain communication
- Genesis timestamps for epoch calculations

### Contract Configuration
- Smart contract addresses for each network
- Comprehensive ABIs for contract interactions
- Standardized function signatures

### Timing Configuration
- Blockchain operation timeouts
- Polling intervals for status checks
- Epoch-based calculations
- Transaction confirmation requirements

### Size Configuration
- Upload size limits for PDP system
- Storage unit standardization
- Data validation constraints

### Token Configuration
- Standardized token identifiers
- Payment system integration
- Cross-network token support

### Data Integrity Configuration
- Multihash format specifications
- CommP calculation standards
- Filecoin compatibility requirements

## Integration Patterns

### Network Switching
The constants system enables seamless network switching by providing:
- Environment-specific contract addresses
- Network-appropriate RPC endpoints
- Correct genesis timestamps for epoch calculations

### Service Configuration
SDK services consume constants for:
- Contract interaction configuration
- Timeout and polling parameter setup
- Size limit enforcement
- Token operation standardization

### Development vs Production
The dual network support facilitates:
- Development testing on calibration network
- Production deployment on mainnet
- Consistent behavior across environments
- Easy environment switching

## Best Practices

### Constant Usage
- Always use centralized constants rather than hardcoded values
- Reference appropriate network-specific configurations
- Validate constants before use in critical operations

### Network Configuration
- Verify network compatibility before operations
- Handle network-specific differences gracefully
- Use appropriate timeouts for each network

### Contract Integration
- Use provided ABIs for all contract interactions
- Verify contract addresses for target network
- Handle contract upgrade scenarios

---

**Sources:**
- `src/utils/constants.ts` (lines 18-21, 141-150, 250-259, 264-296, 26-106, 111-136, 155-187, 192-245, 10-13, 301-306)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/7.1-constants-and-network-configuration