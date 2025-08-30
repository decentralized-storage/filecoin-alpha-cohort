# Epoch and Time Utilities

**FilOzone/synapse-sdk Documentation**

---

## Overview

This document covers the Filecoin epoch and time conversion utilities provided by the Synapse SDK. These utilities enable conversion between Filecoin blockchain epochs and standard JavaScript Date objects, as well as specialized time calculations for proof scheduling and validation workflows.

The utilities support both Filecoin mainnet and calibration test networks, handling their different genesis timestamps and providing accurate time conversions for storage provider operations and proof of data possession (PDP) scheduling.

For information about PDP system components and proof verification, see 4.2. For network configuration constants, see 7.1.

## Core Epoch Conversion System

The epoch utilities are built around Filecoin's time system, where each epoch represents a 30-second period on the blockchain. The system provides bidirectional conversion between epochs and standard time formats.

### System Architecture

```
Network Constants                    Input/Output Types
├── TIME_CONSTANTS.EPOCH            ├── FilecoinNetworkType
├── GENESIS_TIMESTAMPS.cal          ├── JavaScript Date
└── GENESIS_TIMESTAMPS.mainnet      ├── Epoch Number
    │                               └── Time Breakdown Object
    │
    ├─── Epoch Utilities ───────────────────┐
    │                                       │
    ├── epochToDate()
    ├── getGenesisTimestamp()
    ├── dateToEpoch()
    ├── timeUntilEpoch()
    └── calculateLastProofDate()
```

## Primary Conversion Functions

### Basic Epoch-Date Conversion

The core conversion functions handle the fundamental transformation between Filecoin epochs and JavaScript Date objects:

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| **epochToDate** | Convert epoch to Date | `epoch: number`, `network: FilecoinNetworkType` | `Date` |
| **dateToEpoch** | Convert Date to epoch | `date: Date`, `network: FilecoinNetworkType` | `number` |
| **getGenesisTimestamp** | Get network genesis time | `network: FilecoinNetworkType` | `number` |

### Conversion Logic

The conversion logic uses the formula:

- **Epoch to Date**: `timestamp = genesisTimestamp + (epoch × epochDuration)`
- **Date to Epoch**: `epoch = floor((timestamp - genesisTimestamp) / epochDuration)`

### Example Calculation

```
Input: Epoch 120, Network: mainnet

Genesis Timestamp: 1598306400
Epoch Duration: 30 seconds
Calculation: 1598306400 + (120 × 30)
Result: Date(1598310000000)
```

## Time Calculation Utilities

The `timeUntilEpoch` function provides detailed time breakdowns for epoch differences:

### Return Object Structure

```javascript
{
    futureEpoch: 1120,
    currentEpoch: 1000,
    epochDifference: 120,
    seconds: 3600,
    epochs: 120,
    seconds: 3600,
    minutes: 60,
    hours: 1,
    days: 0.042
}
```

### Time Breakdown Flow

```
futureEpoch: 1120  ──┐
                     ├── epochDifference: 120 ──┐
currentEpoch: 1000  ──┘                        │
                                               │
                                               ├── seconds: 3600 ──┐
                                               │                   │
                                               │                   ├── minutes: 60
                                               │                   │
                                               │                   ├── hours: 1
                                               │                   │
                                               │                   └── days: 0.042
                                               │
                                               └── Return Object
                                                   ├── epochs: 120
                                                   ├── seconds: 3600
                                                   ├── minutes: 60
                                                   ├── hours: 1
                                                   └── days: 0.042
```

## Proof Timing Calculations

### Last Proof Date Calculation

The `calculateLastProofDate` function determines when the last proof should have been submitted based on the proof set schedule. This is critical for PDP system monitoring and compliance checking.

#### Function Logic Flow

```
nextChallengeEpoch === 0? ──[No]──► lastProofEpoch = nextChallengeEpoch - maxProvingPeriod
         │
        [Yes]
         │
      return null
         
lastProofEpoch <= 0? ──[No]──► epochToDate(lastProofEpoch, network) ──► return Date
         │
        [Yes]
         │
      return null
```

#### Function Scenarios

The function handles three scenarios:

- **No proofs scheduled**: Returns `null` when `nextChallengeEpoch` is 0
- **First proving period**: Returns `null` when calculated epoch is non-positive  
- **Active proving**: Returns the Date when the last proof should have been submitted

## Network Support and Constants Integration

The epoch utilities support both Filecoin networks through integration with network-specific constants:

| Network | Genesis Timestamp | Usage |
|---------|------------------|--------|
| **mainnet** | `GENESIS_TIMESTAMPS.mainnet` | Production Filecoin network |
| **calibration** | `GENESIS_TIMESTAMPS.calibration` | Test network for development |

All calculations use `TIME_CONSTANTS.EPOCH_DURATION` (30 seconds) as the standard epoch length across both networks.

## Applications and Integration

### SDK Integration Architecture

```
Network Configuration
├── constants.js
    ├── TIME_CONSTANTS
    └── GENESIS_TIMESTAMPS
        │
        ├─── Epoch Functions ───────────┐
        │                               │
        ├── dateToEpoch()
        ├── calculateLastProofDate()
        └── epochToDate()
                │
                ├─── Applications ──────────┐
                │                           │
                ├── StorageService
                ├── Piece Status Checking
                └── Proof Scheduling
```

### Use Cases

#### Storage Operations
- **Piece Status Tracking**: Convert blockchain epochs to human-readable dates for storage piece lifecycle management
- **Deal Expiration**: Calculate when storage deals expire based on epoch numbers from smart contracts
- **Storage Monitoring**: Track storage provider performance across time periods

#### Proof System Integration
- **Proof Scheduling**: Determine when proofs are due based on proof set configurations
- **Compliance Monitoring**: Check if storage providers are submitting proofs on schedule
- **Challenge Validation**: Verify proof submission timing against challenge epochs

#### Network Operations
- **Cross-Network Compatibility**: Handle epoch conversions for both mainnet and calibration networks
- **Development Testing**: Use calibration network timestamps for testing proof workflows
- **Production Deployment**: Accurate mainnet epoch handling for live storage operations

### Common Usage Patterns

#### Converting Current Time to Epoch
```javascript
import { dateToEpoch } from '@filoz/synapse-sdk';

const currentEpoch = dateToEpoch(new Date(), 'mainnet');
```

#### Calculating Time Until Future Epoch  
```javascript
import { timeUntilEpoch } from '@filoz/synapse-sdk';

const timeBreakdown = timeUntilEpoch(futureEpoch, 'mainnet');
console.log(`${timeBreakdown.hours} hours until epoch ${futureEpoch}`);
```

#### Proof Deadline Calculation
```javascript
import { calculateLastProofDate } from '@filoz/synapse-sdk';

const lastProofDate = calculateLastProofDate(
    nextChallengeEpoch,
    maxProvingPeriod, 
    'mainnet'
);

if (lastProofDate) {
    console.log(`Last proof was due: ${lastProofDate.toISOString()}`);
}
```

## Technical Implementation Details

### Precision and Accuracy
- Uses integer arithmetic for epoch calculations to avoid floating-point errors
- Handles edge cases around network genesis times
- Provides consistent results across different JavaScript environments

### Error Handling
- Validates network type parameters
- Handles negative epoch values appropriately
- Returns `null` for invalid proof timing scenarios

### Performance Considerations
- Lightweight calculations with minimal computational overhead
- No external dependencies beyond standard JavaScript Date objects
- Suitable for high-frequency operations in storage monitoring

---

**Sources:**
- `src/utils/epoch.ts` (lines 1-97, 14-33, 50-67, 76-96)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/7.2-epoch-and-time-utilities