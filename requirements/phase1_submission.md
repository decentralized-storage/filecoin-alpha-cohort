# PrivateVault - Wave 1: Product Design

## Project Name: **Keypo**
*Encrypted Private Data Storage on Filecoin with Granular Access Control*

---

## Problem

**Current Issue**: Developers building privacy-sensitive applications can't use decentralized storage because Filecoin stores data in plaintext with no access controls. Only option today is centralized encryption/access control, which means users don't have complete control over their data.

**Why This Matters**: 
- 73% of enterprises cite privacy concerns as the main barrier to decentralized storage adoption
- Healthcare, legal, and financial applications need encrypted storage with compliance features
- Developers are forced to choose between privacy and decentralization

**Filecoin Relevance**: This blocks Filecoin from entering regulated industries and enterprise markets, limiting its growth potential.

---

## Solution

**What We're Building**: A unified SDK that combines Keypo's encryption with Synapse's Filecoin storage to enable privacy-preserving decentralized applications.

**For Developers**:
- **Plug-and-Play Privacy**: Add encryption to existing Synapse storage with just a few lines of code
- **Production-Ready**: Both SDKs are battle-tested with comprehensive documentation
- **Flexible Access Control**: Define access rules using smart contracts, token balances, NFT ownership, or custom logic
- **Cost Effective**: Pay only for storage used, not for encryption operations

**For End Users**:
- **True Data Ownership**: Users control their encryption keys and access permissions
- **Granular Privacy**: Share specific data with specific people/programs under specific conditions
- **Seamless UX**: Works with email-based sign-ins through embedded wallets (Privy, Turnkey, Dynamic)
- **Gasless Operations**: No need to hold crypto or pay gas fees for encryption/decryption

**Key Innovation**: Boundary encryption pattern where Keypo handles encryption/decryption while Synapse manages Filecoin storage.

---

## Technical Design with Filecoin Onchain Cloud Integration

### Architecture Overview

**Reference Document**: `keypo-synapse-integration-architecture.md`

Our technical design follows a **wrapper pattern** that integrates Keypo's encryption capabilities with Synapse's storage infrastructure:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Keypo         │    │ Filecoin Network│
│                 │    │   Integration   │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│                 │    │                 │    │                 │
│ User Data       │───▶│ Keypo Encrypt   │    │ Synapse Storage │
│ Access Rules    │    │ Access Control  │───▶│ PDP Verification│
│ Wallet Auth     │    │ Synapse Upload  │    │ Payment Rails   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
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

### **Phase 2: Increased Modularity with Proxy Execution** (Months 3-6)
**Target**: Filecoin infrastructure service providers and web3 developers that want more advanced access control. 

**Approach**:
- Add Keypo's proxy execution functionality to extension from phase 1, which leverages Trusted execution environments (TEEs) for advanced access controls, like private compute by authorized programs.
- Create library of TEE programs for advanced access controls. A few examples: resolving service line agreements between filecoin CDNs and storage providers, decentralized digital rights management, secure credential sharing with AI agents. 

**Impact**: Enable private compute functionality on top of Filecoin infrastructure. 