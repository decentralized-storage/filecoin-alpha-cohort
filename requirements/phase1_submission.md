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

**What We're Building**: A unified SDK (`@keypo/synapse-sdk`) that combines Keypo's encryption with Synapse's Filecoin storage to enable privacy-preserving decentralized applications.

**For Developers**:
- **Single Package**: Import everything from `@keypo/synapse-sdk` - no need for separate Synapse SDK
- **On-chain access control**: Contract deployment and NFT minting happen automatically on upload
- **Simple Interface**: All operations use `commp` as the primary identifier

**For End Users**:
- **True Data Ownership**: Users control their encryption keys and access permissions
- **Granular Privacy**: Share specific data with specific people/programs under specific conditions
- **Seamless UX**: Works with email-based sign-ins through embedded wallets (Privy, Turnkey, Dynamic)
- **Gasless Operations**: No need to hold crypto or pay gas fees for encryption/decryption

**Key Innovation**: Boundary encryption pattern where Keypo handles encryption/decryption while Synapse manages Filecoin storage. On-chain access control conditions combined with decentralized key management means a fully decentralized encryption solution for filecoin onchain cloud. 

---

## Technical Design with Filecoin Onchain Cloud Integration

### Architecture Overview

**Reference Document**: 
You can find our complete design document here: `keypo-synapse-integration-architecture.md`

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

#### 1. **Unified @keypo/synapse-sdk Package**
- **Single Package**: Everything bundled in `@keypo/synapse-sdk`
- **Internal Components**: 
  - Synapse SDK bundled as internal dependency
  - Keypo encryption/decryption capabilities
  - Smart contract deployment (automatic)
  - NFT minting (automatic)
  - Subgraph querying for data lookup

#### 2. **Key Identifiers & Mapping**
- **commp**: Primary identifier (Synapse) - used in all wrapper functions
- **dataIdentifier**: Internal Keypo identifier - handled automatically
- **Automatic Mapping**: Smart contracts store mapping, subgraph indexes for lookup  

#### 3. **Simplified Workflow**
- **Upload**: Always includes encryption, contract deployment, and NFT minting
- **Search**: Only takes search term string, returns results with commp
- **Operations**: All functions (share, delete, download) use commp as identifier
- **Internal Handling**: Package automatically manages dataIdentifier lookup via subgraph

### Example Implementation

```typescript
// Import unified SDK
import { init, uploadEncrypted, downloadDecrypted, search } from '@keypo/synapse-sdk';

// Initialize with wallet only
const privateKey = '0x...';
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const ethersWallet = new ethers.Wallet(privateKey, provider);

await init({
  wallet: ethersWallet,
  rpcURL: RPC_URL
});

// Store encrypted data (automatically deploys contract & mints NFT)
const result = await uploadEncrypted('Patient Record #123', {
  name: 'patient-record-123'
});

console.log(`Stored with CommP: ${result.commp}`);
console.log(`Smart Contract: ${result.dataContractAddress}`);
console.log(`Owner NFT: ${result.ownerNFT}`);

// Search for data (only takes search term)
const searchResults = await search('patient-record');
const commp = searchResults[0].commp;

// Retrieve and decrypt using commp
const decryptedData = await downloadDecrypted(commp);
```

---

## Project Plan

### **Phase 1: General encryption/decryption tools** (Months 1-3)
**Target**: Web3 developers building privacy-sensitive applications

**Approach**: 
- Build as unified `@keypo/synapse-sdk` package with Synapse bundled internally
- Simplified API requiring only wallet and RPC URL
- Automatic smart contract deployment and NFT minting on every upload

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