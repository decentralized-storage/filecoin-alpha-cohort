# Payment System

## Relevant Source Files

The Payment System provides USDFC token operations, service approvals, and smart contract integration for the Synapse SDK. It handles all monetary transactions required for storage services, including deposits, withdrawals, allowance management, and operator approvals.

For storage-specific operations like upload/download workflows, see **Storage System**.  
For service coordination and proof set management, see **Pandora Service**.

## Architecture Overview

The Payment System centers around the PaymentsService class, which provides a clean interface to the Payments smart contract. It integrates with the broader Synapse ecosystem through service operator approvals and allowance mechanisms.

### Payment System Architecture

**Client Layer:**
- Synapse → synapse.payments

**Service Layer:**
- PaymentsService
- PandoraService

**Smart Contract Layer:**
- Payments Contract
- USDFC Token
- Pandora Contract

**Operations:**
- `balance()` / `walletBalance()`
- `withdraw()`
- `deposit()`
- `approveService()` / `revokeService()`
- `approve()` / `allowance()`

**Sources:** `README.md` 60-263, `src/payments/service.ts`, `AGENTS.md` 16-21

## USDFC Token Integration

The Payment System is built around USDFC (USD Filecoin), an ERC-20 token that serves as the primary payment currency for Synapse services. USDFC uses 18 decimal places and has dedicated contract addresses for each network.

| Property | Mainnet | Calibration |
|----------|---------|-------------|
| Chain ID | 314 | 314159 |
| USDFC Address | `0x80B98d3aa09ffff255c3ba4A241111Ff1262F045` | `0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0` |
| Payments Contract | (varies) | `0x0E690D3e60B0576D01352AB03b258115eb84A047` |

### Token Operations Flow

**Flow Components:**
- **User Wallet** (USDFC Balance) ↔ **Payments Contract** (Contract Balance)
- **Operations:** `approve()` + `deposit()`, `withdraw()`
- **Contract States:** Locked Funds, Available Funds
- **Usage:** Storage Payments → Payment Rails

**Sources:** `README.md` 80-83, `AGENTS.md` 80-81, `src/utils/constants.ts`

## PaymentsService Class

The PaymentsService class provides the primary API for all payment operations. It's instantiated automatically by the Synapse class and exposed through the `synapse.payments` property.

### Core Methods

| Method Group | Methods | Purpose |
|--------------|---------|---------|
| **Balance Operations** | `walletBalance()`, `balance()`, `accountInfo()` | Query wallet and contract balances |
| **Token Operations** | `deposit()`, `withdraw()`, `approve()`, `allowance()` | Manage USDFC tokens |
| **Service Management** | `approveService()`, `revokeService()`, `serviceApproval()` | Manage operator permissions |
| **Utilities** | `decimals()`, `getCurrentEpoch()` | Helper functions |

### Transaction Response Pattern

Starting with v0.7.0, payment methods return `ethers.TransactionResponse` objects instead of transaction hashes, providing better control over transaction lifecycle:

```javascript
// Modern approach (v0.7.0+)
const tx = await synapse.payments.deposit(amount)
console.log(`Transaction: ${tx.hash}`)
const receipt = await tx.wait() // Optional confirmation
```

**Sources:** `README.md` 239-260, `README.md` 918-964, `src/payments/service.ts`, `src/test/payments.test.ts` 214-305

## Payment Flow in Storage Operations

The Payment System integrates with storage operations through a structured flow involving deposits, service approvals, and automated payments.

### Component Integration Map

**Initial Setup:**
1. User → PaymentsService: `deposit(amount, USDFC)`
2. PaymentsService → Payments Contract: Transfer USDFC tokens
3. User → PaymentsService: `approveService(pandoraAddress, rateAllowance, lockupAllowance)`
4. PaymentsService → Payments Contract: Grant operator permissions

**Storage Operation:**
1. User → Pandora Service: `createStorage()` / `upload()`
2. Pandora Service → Storage Provider: Create payment rail

**Ongoing:**
1. Pandora Service → Storage Provider: Automated payments
2. System: Periodic settlements

## Service Operator Approvals

Service operator approvals enable automated payment management by allowing service contracts to create and manage payment rails on behalf of users. This involves two key allowances:

- **Rate Allowance:** Maximum USDFC per epoch that can be charged
- **Lockup Allowance:** Maximum total USDFC that can be locked as security deposit

**Sources:** `README.md` 94-192, `README.md` 256-259, `AGENTS.md` 242-245

## Integration Points

The Payment System integrates with other Synapse components through well-defined interfaces:

### Storage System Integration

**Components:**
- **Storage System:**
  - StorageService
  - `preflightUpload()`
  - `calculateStorageCost()`
  - `checkAllowanceForStorage()`
  - `createProofSet()`

- **Pandora Service:**
  - Authentication

- **Authentication:**
  - PDPAuthHelper

The integration ensures seamless coordination between payment operations and storage functionality, enabling automated payment flows for storage services.

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/5-payment-system*