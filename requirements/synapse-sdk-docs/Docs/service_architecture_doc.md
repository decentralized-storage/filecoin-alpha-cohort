# Service Architecture

## Relevant source files

This document explains how the Synapse SDK's core services work together to provide storage, payment, and blockchain interaction functionality. It covers service dependencies, instantiation patterns, and interaction flows within the SDK architecture.

For information about the main Synapse class entry point, see Synapse Class. For details about TypeScript interfaces and data structures, see Type System. For specific service implementations, see PaymentsService, StorageService, and Pandora Service.

## Service Overview

The Synapse SDK follows a layered service architecture with clear separation of concerns. Each service handles a specific domain while maintaining composability for advanced use cases.

### Core Service Responsibilities

The architecture consists of four distinct layers:

#### Level 4: Client Interface Layer
- **Synapse Class** - Main Entry Point

#### Level 3: Core Services
- **PaymentsService** - Pure Payment Operations
- **StorageService** - Upload/Download Implementation
- **PandoraService** - Storage Coordination

#### Level 2: Protocol Layer
- **PDPVerifier** - Contract Interactions
- **PDPServer** - HTTP API Client
- **PDPAuthHelper** - EIP-712 Signatures

#### Level 1: Infrastructure Layer
- **PieceRetriever** - Data Retrieval Chain
- **SubgraphService** - Provider Discovery

**Sources**: `src/synapse.ts` 1-445, `AGENTS.md` 10-21, `AGENTS.md` 136-143

### Service Dependencies Summary

| Service | Primary Responsibility | Key Dependencies |
|---|---|---|
| **PaymentsService** | USDFC token operations, deposits, withdrawals, service approvals | None (pure payments) |
| **PandoraService** | Storage coordination, cost calculations, proof set management | PaymentsService, PDPVerifier |
| **StorageService** | Upload/download implementation, PDP storage operations | PandoraService, PDPServer, PDPAuthHelper |

**Sources**: `AGENTS.md` 16-20, `src/pandora/service.ts` 1-26

## Service Dependency Architecture

The service architecture follows a strict dependency hierarchy to maintain separation of concerns and enable independent usage.

### Level 1: Pure Services
- **PaymentsService** (`payments/service.ts`) - No Dependencies
- **PDPVerifier** (`pdp/verifier.ts`) - Provider Only

### Level 2: Coordination Services
- **PandoraService** (`pandora/service.ts`)
  - Depends: PaymentsService, PDPVerifier

### Level 3: Implementation Services
- **StorageService** (`storage/service.ts`)
  - Depends: PandoraService, PDPServer, PDPAuthHelper

### Level 4: Client Interface
- **Synapse** (`synapse.ts`)
  - Orchestrates All Services

**Sources**: `AGENTS.md` 136-143, `src/pandora/service.ts` 30-34

## PaymentsService - Pure Payment Operations

The PaymentsService has no dependencies on other SDK services, making it usable independently for payment operations.

- **Location**: `src/payments/service.ts`
- **Instantiation**: `src/synapse.ts` 198
- **Dependencies**: Only requires `ethers.Provider`, `ethers.Signer`, and network configuration

## PandoraService - Storage Coordination

The PandoraService coordinates storage operations and depends on payment services for cost calculations and allowance checks.

- **Location**: `src/pandora/service.ts` 103-953
- **Dependencies**:
  - **PaymentsService** for allowance checks (`src/pandora/service.ts` 556)
  - **PDPVerifier** for proof set queries (`src/pandora/service.ts` 131-136)

## StorageService - Implementation Layer

The StorageService implements the actual storage operations by coordinating multiple lower-level services.

- **Dependencies**:
  - **PandoraService** for cost calculations and proof set management
  - **PDPServer** for HTTP API interactions
  - **PDPAuthHelper** for signature generation

**Sources**: `src/synapse.ts` 16-18, `src/pandora/service.ts` 30-34

## Service Instantiation Patterns

The Synapse SDK uses factory patterns and dependency injection to create properly configured service instances.

### Synapse Factory Method

The main entry point uses an async factory method to handle provider detection and service initialization:

```typescript
static async create(options: SynapseOptions): Promise<Synapse>
```

#### Key initialization steps:

1. **Provider/Signer Setup**: `src/synapse.ts` 40-108
2. **Network Detection**: `src/synapse.ts` 112-131
3. **Service Instantiation**: `src/synapse.ts` 198-199
4. **PieceRetriever Configuration**: `src/synapse.ts` 138-170

**Sources**: `src/synapse.ts` 39-182

### On-Demand StorageService Creation

StorageService instances are created on-demand to allow for different configurations per storage operation:

```typescript
async createStorage(options?: StorageServiceOptions): Promise<StorageService>
```

#### Creation process:

1. **Merge Options**: `src/synapse.ts` 261-264
2. **Factory Call**: `src/synapse.ts` 267
3. **Error Handling**: `src/synapse.ts` 269-276

#### Sequence Diagram

The creation flow follows this pattern:

1. **Client** → **Synapse**: `create(options)`
2. **Synapse**: Validate options & setup provider/signer
3. **Synapse**: `new PaymentsService(provider, signer, network)`
4. **Synapse**: `new PandoraService(provider, pandoraAddress)`
5. **Synapse**: `new Synapse(...services)`
6. **Synapse** → **Client**: Return configured instance

For storage service creation:
7. **Client** → **Synapse**: `createStorage(options)`
8. **Synapse**: `StorageService.create(synapse, pandoraService, options)`
9. **Synapse** → **Client**: Return configured StorageService

**Sources**: `src/synapse.ts` 39-182, `src/synapse.ts` 258-277

## Service Interaction Patterns

Services interact through well-defined interfaces and follow consistent patterns for data flow and error handling.

### Payment Flow Integration

The payment and storage operations are integrated through this flow:

#### Payment Operations
- `PandoraService.checkAllowance()`
- `PandoraService.prepareStorage()`
- `PaymentsService.serviceApproval()`
- `PaymentsService.deposit()`

#### Storage Operations
- `StorageService.upload()`
- `StorageService.createProofSet()`

**Sources**: `src/pandora/service.ts` 534-602, `src/pandora/service.ts` 610-683

### Authentication Signature Flow

Services coordinate to generate and validate EIP-712 signatures for blockchain operations:

1. **PDPAuthHelper** generates typed signatures (`src/pdp/auth.ts`)
2. **PDPServer** submits operations with signatures (`src/pdp/server.ts`)
3. **PandoraService** validates signatures on-chain

**Sources**: `AGENTS.md` 240-244, `AGENTS.md` 254-259

### Error Propagation Patterns

Services use consistent error handling with context preservation:

```typescript
throw createError('ServiceName', 'methodName', 'description', originalError)
```

#### Error creation locations:
- **Synapse**: `src/synapse.ts` 270-275, `src/synapse.ts` 314-320
- **Payments**: Payment service error patterns
- **Storage**: Storage service error patterns

**Sources**: `src/synapse.ts` 270-275, `src/utils/errors.ts`

## Advanced Service Usage

All services are exported independently to support advanced use cases beyond the main Synapse interface.

### Independent PaymentsService Usage

```javascript
import { PaymentsService } from '@filoz/synapse-sdk/payments'

const payments = new PaymentsService(provider, signer, network, false)
await payments.deposit(amount, TOKENS.USDFC)
```

### Independent PandoraService Usage

```javascript
import { PandoraService } from '@filoz/synapse-sdk/pandora'

const pandora = new PandoraService(provider, pandoraAddress)
const proofSets = await pandora.getClientProofSets(clientAddress)
```

### Service Composition Patterns

Advanced users can compose services with custom configurations:

```javascript
// Custom PandoraService with different address
const customPandora = new PandoraService(provider, customAddress)

// StorageService with custom Pandora instance
const storage = await StorageService.create(synapse, customPandora, options)
```

**Sources**: `AGENTS.md` 10-12, `src/pandora/service.ts` 109-112

## Service Configuration

*[Note: This section appears to be incomplete in the source document]*

---

*Document source: FilOzone/synapse-sdk Service Architecture Documentation*  
*Original URL: https://deepwiki.com/FilOzone/synapse-sdk/3.3-service-architecture*  
*Generated on: August 26, 2025*