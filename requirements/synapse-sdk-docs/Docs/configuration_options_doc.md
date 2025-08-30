# Configuration Options

## Relevant source files

This document provides a comprehensive guide to configuring the Synapse SDK through the `SynapseOptions` interface. It covers authentication methods, network configuration, service customization, and advanced options for integrating with Filecoin storage services.

For basic setup examples, see Basic Usage Examples. For service-specific configuration details, see Service Architecture.

## Authentication Configuration

The Synapse SDK supports three mutually exclusive authentication patterns, each designed for different deployment environments and integration scenarios.

### Authentication Methods

| Method | Environment | Requirements | Use Case |
|---|---|---|---|
| **privateKey + rpcURL** | Server/Node.js | Private key string, RPC endpoint | Backend services, automated systems |
| **provider** | Browser | Ethers Provider instance | Web applications with MetaMask |
| **signer** | Any | Ethers Signer instance | Direct ethers.js integration |

The SDK validates that exactly one authentication method is provided during initialization:

### Authentication Validation Flow

1. **Synapse.create(options)** - Validate Authentication Options
2. **Count provided options**: privateKey, provider, signer
3. **Exactly one option provided?**
   - **No** → throw Error: 'Must provide exactly one'
   - **Yes** → Continue validation
4. **privateKey provided?**
   - **Yes** → rpcURL provided? 
     - **No** → throw Error: 'rpcURL required with privateKey'
     - **Yes** → Create JsonRpcProvider or WebSocketProvider
   - **No** → provider provided?
     - **Yes** → await provider.getSigner()
     - **No** → Use provided signer
5. **Apply NonceManager if enabled**
6. **Detect Filecoin network**
7. **Initialize Synapse instance**

**Sources**: `src/synapse.ts` 39-108, `src/types.ts` 30-59

## Private Key Authentication

Server environments typically use private key authentication with RPC endpoints:

```javascript
const synapse = await Synapse.create({
 privateKey: 'your-private-key',
 rpcURL: 'https://api.calibration.node.glif.io/rpc/v1',
 authorization: 'Bearer your-api-token' // Optional
})
```

The SDK supports both HTTP/HTTPS and WebSocket RPC connections, automatically detecting the protocol from the URL scheme. Authorization headers can be added for authenticated RPC endpoints.

**Sources**: `src/synapse.ts` 53-66, `src/utils/constants.ts` 248-259

## Provider Authentication

Browser environments use ethers Provider instances, typically from MetaMask or other wallet providers:

```javascript
const synapse = await Synapse.create({
 provider: window.ethereum // or other ethers.Provider
})
```

The provider must support the `getSigner()` method to obtain a transaction signer.

**Sources**: `src/synapse.ts` 77-92, `src/types.ts` 44

## Network Configuration

The SDK automatically detects the Filecoin network based on the chain ID from the connected provider. Only mainnet and calibration networks are supported.

### Network Detection Flow

1. **ethers.Provider** → `provider.getNetwork()`
2. **Extract chainId**
3. **chainId === 314?**
   - **Yes** → network = 'mainnet'
   - **No** → chainId === 314159?
     - **Yes** → network = 'calibration'
     - **No** → throw Error: 'Unsupported network'

### Contract Resolution

#### Mainnet Contract Addresses
- **USDFC**: `0x80B98d3aa...`
- **PAYMENTS**: (TBD)
- **PANDORA_SERVICE**: (TBD)

#### Calibration Contract Addresses  
- **USDFC**: `0xb3042734b...`
- **PAYMENTS**: `0x0E690D3e6...`
- **PANDORA_SERVICE**: `0xf49ba5eaC...`

**Sources**: `src/synapse.ts` 110-131, `src/utils/constants.ts` 17-21, `src/utils/constants.ts` 264-296

### RPC Endpoints

The SDK provides recommended RPC endpoints for both networks:

| Network | HTTP Endpoint | WebSocket Endpoint |
|---|---|---|
| **Mainnet** | `https://api.node.glif.io/rpc/v1` | `wss://wss.node.glif.io/apigw/lotus/rpc/v1` |
| **Calibration** | `https://api.calibration.node.glif.io/rpc/v1` | `wss://wss.calibration.node.glif.io/apigw/lotus/rpc/v1` |

**Sources**: `src/utils/constants.ts` 248-259

## Service Configuration Options

The SDK provides several options to customize service behavior and integrate with external systems.

### CDN Configuration

Content Delivery Network support can be enabled for faster piece retrieval:

```javascript
const synapse = await Synapse.create({
 // ... authentication options
 withCDN: true // Enable CDN for all retrievals by default
})
```

This option affects the default behavior of download operations and storage service creation.

**Sources**: `src/types.ts` 50, `src/synapse.ts` 264

### Piece Retrieval Customization

The SDK uses a configurable piece retrieval chain that can be customized with different implementations:

#### Default Retrieval Chain
1. **FilCdnRetriever** (Top Level)
2. **Underlying Retriever**
   - **Subgraph Config Provided?**
     - **Yes** → **SubgraphRetriever**
     - **No** → **ChainRetriever**
3. **ChainRetriever** (Fallback)

#### Custom Configuration Options
- `pieceRetriever: PieceRetriever` - Custom PieceRetriever Implementation
- `subgraphService: SubgraphRetrievalService` - Implements PieceRetriever interface
- `subgraphConfig: SubgraphConfig` - new SubgraphService(config)

**Sources**: `src/synapse.ts` 137-170, `src/types.ts` 96-113, `src/types.ts` 118-159

### Subgraph Configuration

The SDK can integrate with subgraph services for provider discovery:

#### Using direct endpoint
```javascript
const synapse = await Synapse.create({
 // ... authentication options
 subgraphConfig: {
 endpoint: 'https://api.thegraph.com/subgraphs/name/your-subgraph'
 }
})
```

#### Using Goldsky configuration
```javascript
const synapse = await Synapse.create({
 // ... authentication options
 subgraphConfig: {
 goldsky: {
 projectId: 'your-project-id',
 subgraphName: 'synapse-subgraph',
 version: 'v1.0.0'
 },
 apiKey: 'your-api-key' // Optional
 }
})
```

**Sources**: `src/types.ts` 118-130, `src/synapse.ts` 146-167

## Advanced Configuration Options

### Nonce Management

The SDK automatically applies `NonceManager` to signers to handle transaction nonce management. This can be disabled for custom nonce handling:

```javascript
const synapse = await Synapse.create({
 // ... authentication options
 disableNonceManager: true // Disable automatic nonce management
})
```

**Sources**: `src/types.ts` 48, `src/synapse.ts` 72-74, `src/synapse.ts` 84-89, `src/synapse.ts` 102-105

### Contract Address Overrides

The Pandora service contract address can be overridden for testing or custom deployments:

```javascript
const synapse = await Synapse.create({
 // ... authentication options
 pandoraAddress: '0x123...' // Custom Pandora contract address
})
```

**Sources**: `src/types.ts` 52, `src/synapse.ts` 134, `src/synapse.ts` 202-206

## Configuration Validation and Error Handling

The SDK performs comprehensive validation during initialization, providing clear error messages for common configuration issues:

### Configuration Validation Flow

1. **Configuration Validation**
2. **Authentication Method Check**
   - Must provide exactly one auth method
   - privateKey requires rpcURL
   - Provider must support getSigner()
3. **Network Detection**
   - Network detection failed
   - Unsupported chain ID
   - RPC endpoint unreachable
4. **Contract Address Validation**
   - No Pandora address for network
5. **Service Initialization**

The validation process ensures that all required components are properly configured before attempting to initialize the SDK services.

---

*Document source: FilOzone/synapse-sdk Configuration Options Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/2.3-configuration-options*  
*Generated on: August 26, 2025*