# Synapse Class

## Relevant source files

The Synapse class serves as the main entry point and orchestration layer for the Synapse SDK. It provides a high-level interface for interacting with Filecoin storage services, managing authentication, network configuration, and service coordination. This class abstracts the complexity of managing multiple underlying services while providing a streamlined developer experience.

For information about individual service components, see Service Architecture. For payment-specific operations, see PaymentsService. For storage operations, see StorageService.

## Architecture and Service Orchestration

The Synapse class acts as a facade that coordinates multiple specialized services. It manages the lifecycle and configuration of these services while providing unified access patterns.

### Service Coordination Architecture

The Synapse class orchestrates the following components:

#### High-Level Operations
- `createStorage()`
- `download()`
- `getProviderInfo()`
- `getStorageInfo()`

#### Core Services
- **PaymentsService** (`_payments`)
- **PandoraService** (`_pandoraService`)
- **PieceRetriever** (`_pieceRetriever`)

#### Network Context
- **FilecoinNetworkType** (`_network`)
- **Pandora Address** (`_pandoraAddress`)
- **CDN Configuration** (`_withCDN`)

#### Authentication Layer
- **ethers.Provider** (`_provider`)
- **ethers.Signer** (`_signer`)
- **ethers.NonceManager** (optional wrapper)

**Sources**: `src/synapse.ts` 24-33, `src/synapse.ts` 184-207

## Initialization Flow

The Synapse class uses a static factory method pattern to handle complex asynchronous initialization. The `create` method validates configuration, sets up authentication, detects network parameters, and initializes all dependent services.

### Initialization Patterns

The initialization follows this sequence:

1. **SynapseOptions** input
2. **Validate options** (lines 41-47)
3. **Initialize provider/signer** (lines 49-108)
   - **Alternative flows**:
     - `[privateKey + rpcURL]`: Create JsonRpcProvider/WebSocketProvider → Create Wallet + NonceManager
     - `[provider]`: Get signer from provider
     - `[signer]`: Use provided signer
4. **Detect network** (lines 111-131)
   - Check chainId (314 or 314159)
5. **Initialize services** (lines 134-170)
   - Create PandoraService
   - Setup PieceRetriever chain
   - Configure SubgraphRetriever (optional)
   - Add FilCdnRetriever wrapper
6. **new Synapse()** (lines 172-181)
7. **Initialize PaymentsService** (line 198)
8. **Return configured Synapse instance**

**Sources**: `src/synapse.ts` 39-182

## Configuration Options

The `SynapseOptions` interface defines three mutually exclusive authentication methods:

| Authentication Method | Required Fields | Use Case |
|---|---|---|
| **privateKey** | `privateKey`, `rpcURL` | Server-side applications, scripts |
| **provider** | `provider` | Browser applications with MetaMask |
| **signer** | `signer` | Custom wallet integrations |

**Sources**: `src/synapse.ts` 41-47, `src/types.ts` 199-228

## Network Detection and Validation

The class automatically detects the Filecoin network based on chain ID and validates that only supported networks (mainnet: 314, calibration: 314159) are used:

```javascript
// Network detection logic
const chainId = Number(ethersNetwork.chainId)
if (chainId === CHAIN_IDS.mainnet) {
 network = 'mainnet'
} else if (chainId === CHAIN_IDS.calibration) {
 network = 'calibration'
} else {
 throw new Error(`Unsupported network with chain ID ${chainId}`)
}
```

**Sources**: `src/synapse.ts` 111-131

## Service Management

The Synapse class manages three primary service categories: payments, storage coordination, and data retrieval. Each service is initialized during construction and accessible through specific interfaces.

### Service Dependencies

#### Synapse Class Internal Services
- **PaymentsService** (`_payments`)
- **PandoraService** (`_pandoraService`) 
- **PieceRetriever** (`_pieceRetriever`)

#### Retrieval Chain
- **ChainRetriever**
- **SubgraphRetriever** (optional)
- **FilCdnRetriever**

#### External Dependencies
- **ethers.Provider**
- **ethers.Signer** 
- **SubgraphService** (optional)

**Sources**: `src/synapse.ts` 134-170, `src/synapse.ts` 198-200

### PaymentsService Access

The payments service is exposed through a read-only getter that provides access to all payment-related operations:

```javascript
get payments(): PaymentsService {
 return this._payments
}
```

**Sources**: `src/synapse.ts` 213-215

## Core Methods

The Synapse class provides several high-level methods that coordinate operations across multiple services.

### Storage Service Creation

The `createStorage` method creates a fully configured `StorageService` instance by coordinating provider selection, proof set management, and payment setup:

#### StorageService Initialization Process

1. **createStorage(options?)**
2. **Merge CDN options** (lines 260-264)
3. **StorageService.create()**
   - Provider Selection
   - Proof Set Setup
   - PDP Server Configuration
4. **Error handling** (lines 270-276)

**Sources**: `src/synapse.ts` 258-277

### Data Download Operations

The `download` method provides direct piece retrieval with CommP validation:

| Step | Operation | Implementation |
|---|---|---|
| 1 | CommP Validation | `asCommP()` validation |
| 2 | Client Address Resolution | `signer.getAddress()` |
| 3 | Piece Retrieval | `_pieceRetriever.fetchPiece()` |
| 4 | Data Validation | `downloadAndValidateCommP()` |

**Sources**: `src/synapse.ts` 329-353

### Provider Information Retrieval

The `getProviderInfo` method provides comprehensive provider metadata:

```javascript
async getProviderInfo(providerAddress: string): Promise<ApprovedProviderInfo> {
 // Address validation
 if (!ethers.isAddress(providerAddress)) {
 throw new Error(`Invalid provider address: ${String(providerAddress)}`)
 }
 
 // Provider ID lookup and approval check
 const providerId = await this._pandoraService.getProviderIdByAddress(providerAddress)
 if (providerId === 0) {
 throw new Error(`Provider ${providerAddress} is not approved`)
 }
 
 // Provider information retrieval
 const providerInfo = await this._pandoraService.getApprovedProvider(providerId)
}
```

**Sources**: `src/synapse.ts` 293-321

### Storage Information Aggregation

The `getStorageInfo` method aggregates pricing, provider, and allowance data from multiple sources:

#### Parallel Data Fetching
- `_pandoraService.getServiceParameters()`
- `_pandoraService.getAllApprovedProviders()`
- `_payments.serviceApproval()`

#### Data Processing
- Calculate per-epoch/day pricing
- Filter zero address providers
- Handle optional allowances
- Return `StorageInfo` object

**Sources**: `src/synapse.ts` 359-441

## Configuration Management

The Synapse class manages several configuration aspects that affect the behavior of all coordinated services.

### CDN Configuration Inheritance

The `withCDN` option follows an inheritance pattern across service layers:

1. **Synapse instance level**: Default for all operations
2. **Method parameter level**: Can override instance defaults
3. **Service level**: StorageService inherits and can override

**Sources**: `src/synapse.ts` 27, `src/synapse.ts` 263, `src/synapse.ts` 347

### Network Context Management

The class maintains network-specific configuration and validates contract addresses:

```javascript
// Pandora address resolution with network-specific defaults
this._pandoraAddress = pandoraAddressOverride ?? CONTRACT_ADDRESSES.PANDORA_SERVICE[network]
if (this._pandoraAddress === '' || this._pandoraAddress === undefined) {
 throw new Error(`No Pandora service address configured for network: ${network}`)
}
```

**Sources**: `src/synapse.ts` 202-207

---

*Document source: FilOzone/synapse-sdk Synapse Class Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/3.1-synapse-class*  
*Generated on: August 26, 2025*