# Core Architecture

## Relevant source files

This document provides a comprehensive overview of the Synapse SDK's core architectural components, design patterns, and system structure. It focuses on the main classes, their relationships, and the overall system design that enables interaction with Filecoin storage services.

For specific details about individual services, see Service Architecture. For type system information, see Type System. For the main entry point class details, see Synapse Class.

## Architecture Overview

The Synapse SDK follows a layered architecture with clear separation of concerns, built around a minimal main interface and composable service components. The system is designed with two primary usage patterns: a simple "Golden Path" API for common operations and direct component access for advanced use cases.

## Core Design Principles

The SDK implements several key architectural patterns:

**Factory Pattern**: The main Synapse class uses async factory initialization via `Synapse.create()` to handle complex setup including network detection, provider/signer configuration, and service initialization.

**Service Composition**: Core functionality is distributed across specialized service classes (`PaymentsService`, `PandoraService`, `StorageService`) that can be used independently or through the main interface.

**Minimal Interface**: The Synapse class exposes only essential methods (`payments` property, `createStorage()` method) while maintaining full composability through service exports.

**Sources**: `src/synapse.ts` 24-444, `AGENTS.md` 31-43, `src/types.ts` 1-465

## Core Class Structure

The SDK's class hierarchy is designed around dependency injection and clear service boundaries, with each class having specific responsibilities within the overall system.

### Layered Architecture

#### Client Layer
- **Client Application**
- **Browser Environment** 
- **Node.js Environment**

#### SDK Core Layer
- **Synapse Class** - Factory Pattern Entry Point

#### Service Layer  
- **PaymentsService** - Token Operations
- **PandoraService** - Storage Coordination
- **StorageService** - Upload/Download

#### Infrastructure Layer
- **PDPServer** - Curio HTTP API
- **PDPAuthHelper** - EIP-712 Signatures
- **PieceRetriever** - Data Retrieval Chain
- **SubgraphService** - Provider Discovery

#### External Layer
- **ethers.js** - Blockchain Interface
- **Filecoin Network** - Smart Contracts
- **Storage Providers** - Curio Nodes

### Main Entry Point

The **Synapse** class serves as the primary interface and orchestration point for all SDK operations. It manages initialization, network detection, and service composition.

**Sources**: `src/synapse.ts` 24-208, `src/types.ts` 36-59

## Service Dependencies

The service layer implements a clear dependency hierarchy that prevents circular dependencies while enabling flexible composition.

### Class Definitions

#### Synapse
```typescript
class Synapse {
  // Private Properties
  -_signer: ethers.Signer
  -_provider: ethers.Provider
  -_network: FilecoinNetworkType
  -_payments: PaymentsService
  -_pandoraService: PandoraService
  -_pieceRetriever: PieceRetriever
  
  // Public Interface
  +payments: PaymentsService
  +create(options: SynapseOptions): Promise<Synapse>
  +createStorage(options?): Promise<StorageService>
  +download(commp, options?): Promise<Uint8Array>
  +getStorageInfo(): Promise<StorageInfo>
  +getProviderInfo(address): Promise<ApprovedProviderInfo>
}
```

#### PaymentsService
```typescript
class PaymentsService {
  +deposit(amount: TokenAmount): Promise<string>
  +withdraw(amount: TokenAmount): Promise<string>
  +walletBalance(token?): Promise<bigint>
  +serviceApproval(service, token): Promise<ServiceApproval>
  +approveService(service, rateAllowance, lockupAllowance): Promise<string>
}
```

#### StorageService
```typescript
class StorageService {
  +upload(data, callbacks?): Promise<UploadResult>
  +download(commp): Promise<Uint8Array>
  +getStatus(commp): Promise<PieceStatus>
  +create(synapse, pandora, options?): Promise<StorageService>
}
```

#### PandoraService
```typescript
class PandoraService {
  +getServicePrice(): Promise<ServicePricing>
  +getAllApprovedProviders(): Promise<ApprovedProviderInfo[]>
  +createProofSet(provider, withCDN): Promise<number>
  +getProofSetInfo(proofSetId): Promise<EnhancedProofSetInfo>
}
```

### Service Dependency Chain

#### Pure Services (Level 1)
- **PaymentsService** - Pure Payment Operations
- **PDPServer** - Curio API Client
- **PDPAuthHelper** - EIP-712 Signing

#### Coordination Services (Level 2)  
- **PandoraService** - Storage Coordination

#### Implementation Services (Level 3)
- **StorageService** - Upload/Download Implementation

#### Retriever Chain
- **PieceRetriever** - Interface with Multiple Implementations
  - **ChainRetriever** - Contract-based Discovery
  - **SubgraphRetriever** - Subgraph-based Discovery
  - **FilCdnRetriever** - CDN Integration

**Sources**: `AGENTS.md` 136-143, `src/types.ts` 96-113

## Initialization and Configuration

The SDK uses a sophisticated initialization pattern that handles multiple wallet integration scenarios and network detection.

### Factory Method Pattern

The `Synapse.create()` static method implements async initialization with comprehensive validation and setup:

| Configuration Method | Required Parameters | Use Case |
|---|---|---|
| **Private Key** | `privateKey`, `rpcURL` | Server environments, automated systems |
| **Provider** | `provider` | Browser integration with external providers |
| **Signer** | `signer` | Direct ethers.js integration |

The initialization process includes:

1. **Option Validation**: Ensures exactly one authentication method is provided
2. **Network Detection**: Automatically detects Filecoin mainnet or calibration networks
3. **Service Initialization**: Creates and configures all required service instances
4. **Retriever Chain Setup**: Configures piece retrieval mechanisms with optional CDN and subgraph support

### Initialization Flow Sequence

1. **Client** → **Synapse.create()**: `create(options)`
2. **Synapse**: Validate options
3. **Synapse**: Initialize provider/signer
4. **ethers.Provider**: `getNetwork()`
5. **Filecoin Network**: `chainId`
6. **Synapse**: Detect network type
7. **Service Instances**: Initialize PaymentsService
8. **Service Instances**: Initialize PandoraService  
9. **Service Instances**: Initialize PieceRetriever chain
10. **Synapse** → **Client**: Synapse instance

**Sources**: `AGENTS.md` 136-143, `src/types.ts` 96-113, `src/synapse.ts` 39-182, `src/types.ts` 36-59

## Type System Integration

The SDK's type system provides comprehensive TypeScript support while maintaining flexibility for different usage patterns.

### Core Interface Design

The type system is designed around several key principles:

- **Environment Agnosticism**: No Node.js-specific types in core interfaces
- **Flexible Token Handling**: Support for both `number` and `bigint` token amounts
- **Network Abstraction**: Clear network type definitions with validation
- **Callback Patterns**: Comprehensive callback interfaces for async operations

### Key Type Categories

| Type Category | Purpose | Key Types |
|---|---|---|
| **Configuration** | SDK initialization | `SynapseOptions`, `StorageServiceOptions` |
| **Network** | Blockchain interaction | `FilecoinNetworkType`, `TokenIdentifier` |
| **Storage** | Data operations | `UploadTask`, `DownloadOptions`, `CommP` |
| **Authentication** | Signature handling | `AuthSignature`, `RootData` |
| **Provider** | Service discovery | `ApprovedProviderInfo`, `SubgraphConfig` |

**Sources**: `src/types.ts` 1-465

## Infrastructure Layer Components

The infrastructure layer provides the foundational components that enable communication with external services and blockchain networks.

### PDP Protocol Integration

The Proof of Data Possession (PDP) protocol integration consists of several specialized components:

**PDPServer**: HTTP client for Curio storage provider APIs, handling piece uploads, proof set management, and root operations.

**PDPAuthHelper**: EIP-712 signature generation for authenticated operations, automatically detecting MetaMask-compatible vs. standard signing methods.

**PieceRetriever**: Pluggable interface for piece discovery and retrieval with multiple implementation strategies.

### Infrastructure Components Architecture

#### Infrastructure Components
- **PDPServer** - Curio API Client
- **PDPAuthHelper** - EIP-712 Signing

#### Retriever Chain
- **PieceRetriever Interface** - Multiple Implementations
  - **FilCdnRetriever** - CDN Integration
  - **SubgraphRetriever** - Subgraph-based Discovery  
  - **ChainRetriever** - Contract-based Discovery

#### Service Dependency Chain
Links all infrastructure components to higher-level services through well-defined interfaces.

---

*Document source: FilOzone/synapse-sdk Core Architecture Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/3-core-architecture*  
*Generated on: August 26, 2025*