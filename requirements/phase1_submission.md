# Keypo - Wave 1: Product Design

## Project Name: **Keypo**
*Encrypted Private Data Storage on Filecoin with Granular Access Control*

---

## Problem

**Current Issue**: Developers building privacy-sensitive applications can't use decentralized storage because Filecoin stores data in plaintext with no access controls. Only option today is centralized encryption/access control, which means users don't have complete control over their data.

**Why Does Encrypted Data Storage Matter**: 
- 50% of IT executives identified data security and privacy concerns as the main barrier to integrating decentralized storage within their organizations (source: https://fil.org/digest/enterprise-storage-market-insights-from-the-field)
- Regulated industries including healthcare (HIPAA), finance (PCI DSS, SOX), and any EU data processors (GDPR) have mandatory encryption requirements for sensitive data protection. 
- Premium content (music, video, games) requires encryption/access control, and direct-to-consumer content distribution is a rapidly growing sector. 

**Why Is This Relevant to Filecoin Onchain Cloud**: 
While Filecoin Onchain Cloud offers unique advantages (self-custody, censorship resistance, and decentralized architecture) vs. centralized data storage like S3, industries that would benefit most from these features are blocked by the lack of encryption and access controls. Native privacy guardrails would enable healthcare, finance, and content creators to leverage Filecoin's verifiable storage and data sovereignty benefits.

---

## Solution

**What We're Building**: A unified SDK that combines Keypo's encryption with Synapse's Filecoin storage to enable privacy-preserving decentralized applications.

**For Developers**:
- **Plug-and-Play Privacy**: Add encryption to existing Synapse storage with just a few lines of code
- **Flexible Access Control**: Define access rules using smart contracts, token balances, NFT ownership, or custom logic

**For End Users**:
- **True Data Ownership**: Users control their encryption keys and access permissions
- **Granular Privacy**: Share specific data with specific people/programs under specific conditions
- **Seamless UX**: Works with email-based sign-ins through embedded wallets (Privy, Turnkey, Dynamic)
- **Gasless Operations**: No need to hold crypto or pay gas fees for encryption/decryption

**Key Innovation**: Boundary encryption pattern where Keypo handles encryption/decryption while Synapse manages Filecoin storage.

---

## Technical Design with Filecoin Onchain Cloud Integration

### Architecture Overview

**Reference Document**: 
You can find our complete design document here: `keypo-synapse-integration-architecture.md`

Our technical design follows a **wrapper pattern** that integrates Keypo's encryption capabilities with Synapse's storage infrastructure:

```
## Encryption Flow

┌──────────┐     ┌─────────────────────────────────────────┐     ┌──────────────────-┐
│          │     │                  Keypo                  │     │                   │
│   Data   │────▶│  ┌────────────┐      ┌──────────────┐   │────▶│    Filecoin       │
│          │     │  │            │      │              │   │     │ WarmStorageService│
└──────────┘     │  │ Preprocess │─────▶│ Lit Protocol │   │     │                   │
                 │  │            │      │   Encrypt    │   │     └──────────────────-┘
                 │  └────────────┘      └──────────────┘   │             │
                 │        │                                │             │
                 │        │                                │             │
                 │   Unique ID                             │             │
                 │   Identifier                            │             │
                 │        │                                │             │
                 │        ▼                                │             │
                 │  ┌──────────────────────────────────┐   │             │
                 │  │      Smart Contract              │   │             │
                 │  │                                  │   │             │
                 │  │  ┌──────────────────────────┐    |   │             │
                 │  │  │   Decrypt Permissions    │    |   │             │
                 │  │  └──────────────────────────┘    |   │             │
                 │  │                                  │   │             │
                 │  │  ┌──────────────────────────┐    |   │             │
                 │  │  │  Map encrypted data      │◀───|─--┼─────────────┘
                 │  │  │      <-> commp           │    |   │
                 │  │  └──────────────────────────┘    |   │
                 │  └──────────────────────────────────┘   │
                 └─────────────────────────────────────────┘

## Decryption Flow

┌────────────────────┐                  ┌─────────────────────────────────────────┐     ┌──────────┐
│                    │                  │                  Keypo                  │     │          │
│     Filecoin       │                  │                                         │     │   Data   │
│ WarmStorageService │─── Encrypted   ─▶│  ┌──────────────┐      ┌──────────────┐ │────▶│          │
│                    │      Data        │  │              │      │              │ │     └──────────┘
└────────────────────┘                  │  │ Lit Protocol │─────▶│ Postprocess  │ │
                                        │  │   Decrypt    │      │              │ │
                                        │  └──────────────┘      └──────────────┘ │
                                        │         ▲                               │
                                        │         │                               │
                                        │         ▼                               │
                                        │  ┌──────────────────────────────────┐   │
                                        │  │      Smart Contract              │   │
                                        │  │                                  │   │
                                        │  │  ┌──────────────────────────┐    │   │
                                        │  │  │   Decrypt Permissions    │    │   │
                                        │  │  └──────────────────────────┘    │   │
                                        │  │                                  │   │
                                        │  │  ┌──────────────────────────┐    │   │
                                        │  │  │  Map encrypted data      │    │   │
                                        │  │  │      <-> commp           │    │   │
                                        │  │  └──────────────────────────┘    │   │
                                        │  └──────────────────────────────────┘   │
                                        └─────────────────────────────────────────┘
```

### Core Integration Components

#### 1. **Keypo-Synapse Integration Layer**
- **Location**: New `src/keypo/` module in Synapse SDK  
- **Components**: 
  - `KeypoSynapseIntegration` - Main integration class
  - `EncryptedStorageService` - Enhanced storage with encryption
  - `WalletBridge` - Handles Viem/Ethers compatibility
  - `DataIdentifierMapper` - Maps CommP to Keypo dataIdentifiers

#### 2. **Workflow Coordinators**
- **EncryptionFlowCoordinator**: Manages Keypo encrypt → Synapse store → on-chain actions
- **DecryptionFlowCoordinator**: Manages Synapse retrieve → Keypo decrypt → postprocess  

#### 3. **Data Management Strategy**
- **CommP Mapping**: Store Keypo `dataIdentifier` mappings in IPFS metadata
- **Access Control Registry**: On-chain registry linking CommP to access conditions
- **Metadata Coordination**: Unified metadata structure across both systems

### Deep Filecoin Onchain Cloud Integration

#### **Synapse Integration (Primary)**
- **Storage Operations**: Upload encrypted data using Synapse's `StorageService`
- **Payment Integration**: Use Synapse's `PaymentsService` for USDFC token management
- **PDP Verification**: Leverage proof-of-data-possession for encrypted data integrity
- **Provider Network**: Access to Synapse's approved storage provider ecosystem
- **CDN Integration**: Global retrieval of encrypted data with optional CDN acceleration

#### **Advanced Filecoin Features**
- **CommP Verification**: Verify data integrity using Filecoin's Piece Commitment system even when encrypted
- **Proof Set Management**: Group related encrypted files in Synapse proof sets for efficiency
- **Payment Rails**: Automated micropayments for storage based on actual usage
- **Retrieval Markets**: Access encrypted data from any Filecoin retrieval provider

### Example Implementation

```typescript
// Initialize PrivateVault
const privateVault = new PrivateVault({
  synapse: await Synapse.create({ privateKey: '0x...' }),
  keypo: {
    apiUrl: 'https://api.keypo.io',
    walletClient: createWalletClient({ ... }),
    authorization: await signAuthorization(...)
  }
})

// Store encrypted data with access control
const textData = 'Patient Record #123';
const { dataOut, metadataOut } = await privateVault.preProcess(
  textData, 
  'patient-record-123',
  metadataIn: {
    type: "medical",
    classification: "confidential"
  }
  );
const result = await privateVault.storePrivate(dataOut, metadataOut);

console.log(`Stored with CommP: ${result.commp}`)
console.log(`Data ID: ${result.dataIdentifier}`)

// Retrieve and decrypt (only if access conditions met)
const decryptedData = await privateVault.retrievePrivate(result.commp, {
  wallet: doctorWallet // Must satisfy access conditions
})
```

---

## Project Plan

### **Phase 1: General encryption/decryption tools** (Months 1-3)
**Target**: Web3 developers building privacy-sensitive applications

**Approach**: 
- Build as optional extension to existing Synapse SDK
- Target developers already familiar with Filecoin or Synapse
- Focus on use cases impossible with current decentralized storage

**Impact**: Enable privacy-sensitive applications to use Filecoin, expanding the ecosystem into regulated industries.

### **Phase 2: Advanced Access Control with Proxy Execution** (Months 3-6)
**Target**: Enterprise developers and Filecoin infrastructure providers building production applications with complex access requirements. 

**Approach**:
- Integrate Keypo's proxy execution capabilities using Trusted Execution Environments (TEEs) for secure, programmable access control.
- Develop a library of pre-built TEE programs for common enterprise use cases:
  - **Service Level Agreements**: Automated enforcement of storage/retrieval contracts between Filecoin CDNs and providers
  - **Digital Rights Management**: Decentralized content licensing with usage tracking and royalty distribution
  - **Secure Credential Management**: Safe API key storage and execution for AI agents and automated systems

**Impact**: Transform Filecoin from simple storage into a private compute platform where sensitive data can be processed securely, unlocking enterprise AI, automated compliance, and programmable data governance use cases.