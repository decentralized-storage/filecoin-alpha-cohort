# PaymentsService

## Relevant Source Files

The PaymentsService class provides the primary interface for interacting with the Synapse payment system, handling USDFC token operations, deposits, withdrawals, and service operator approvals. This service acts as the bridge between client applications and the on-chain Payments contract, managing token allowances, account balances, and automated payment rails.

For information about storage-related payments and cost calculations, see **Cost Calculations and Allowances**.  
For details about the Pandora service's payment integration, see **Pandora Service**.

## Architecture Overview

The PaymentsService operates as a stateful wrapper around the Payments smart contract, providing both low-level token operations and high-level account management functionality.

### Core Components Relationship

The system architecture consists of several interconnected layers:

**Client Application Layer:**
- Client Application

**Service Layer:**
- PaymentsService (central orchestrator)

**Blockchain Infrastructure:**
- ethers.Signer
- ethers.Provider
- Network (mainnet/calibration)

**Smart Contracts:**
- Pandora Contract
- Payments Contract
- USDFC Token Contract

**Sources:** `src/test/payments.test.ts` 1-369, `README.md` 486-515

## Class Structure and Dependencies

The PaymentsService constructor requires specific parameters that determine its operational context and capabilities.

### Runtime Dependencies

**Required Parameters:**
- `provider: ethers.Provider`
- `signer: ethers.Signer`
- `network: 'mainnet' | 'calibration'`
- `disableNonceManager: boolean`

**Runtime Dependencies:**
- Payments Contract ABI
- USDFC Token Contract
- CONTRACT_ADDRESSES mapping

**Sources:** `src/test/payments.test.ts` 18-22, `src/test/payments.test.ts` 495-496

## Core Payment Operations

### Balance and Account Management

The PaymentsService provides multiple balance-related operations that serve different purposes in the payment ecosystem.

**Balance Operations:**
- `walletBalance()` → Wallet FIL Balance
- `balance()` → Wallet USDFC Balance
- `accountInfo()` → Contract Account Details
- `getCurrentEpoch()` → Current Block Number

**Data Sources:**
- Wallet USDFC Balance
- Contract Available Funds
- Contract Account Details
- Current Block Number

The `accountInfo()` method returns comprehensive account details including funds, lockup information, and calculated available balances based on time-based lockup mechanics.

**Sources:** `src/test/payments.test.ts` 35-59, `src/test/payments.test.ts` 307-357, `src/test/payments.test.ts` 359-367

### Deposit and Withdrawal Flow

The deposit operation includes automatic approval handling and supports callback functions for monitoring the multi-step process.

#### Deposit Flow with Auto-Approval

**Sequence:**
1. Client → PaymentsService: `deposit(amount, token, callbacks)`
2. PaymentsService → USDFC Token: `allowance(owner, paymentsContract)`
3. Return: `currentAllowance`
4. PaymentsService: `onAllowanceCheck(current, required)`
5. **If allowance insufficient:**
   - PaymentsService: `onApprovalTransaction(tx)`
   - PaymentsService → USDFC Token: `approve(paymentsContract, amount)`
   - Return: `TransactionResponse`
   - `tx.wait()`
   - PaymentsService: `onApprovalConfirmed(receipt)`
6. PaymentsService: `onDepositStarting()`
7. PaymentsService → Payments Contract: `deposit(amount)`
8. Return: `TransactionResponse`

**Sources:** `src/test/payments.test.ts` 213-235, `src/test/payments.test.ts` 272-304, `README.md` 947-963

## Token Operations and Approvals

### Supported Token Operations

The PaymentsService has specific token support limitations that are important for integration planning.

| Operation | FIL Support | USDFC Support | Notes |
|-----------|-------------|---------------|-------|
| `walletBalance()` | ✅ | ✅ | Native wallet balance queries |
| `balance()` | ❌ | ✅ | Payments contract balance only |
| `deposit()` | ❌ | ✅ | Contract deposits only |
| `withdraw()` | ❌ | ✅ | Contract withdrawals only |
| `approve()` | ❌ | ✅ | Token approvals only |
| `allowance()` | ❌ | ✅ | Token allowance checks only |

**Sources:** `src/test/payments.test.ts` 51-58, `src/test/payments.test.ts` 68-76, `src/test/payments.test.ts` 254-270

### Token Approval Workflow

The approval system follows a decision tree based on current allowance status:

1. Check: `allowance(token, spender)`
2. **Decision Point:**
   - If `current < required` → Call `approve(token, spender, amount)`
   - If `current >= required` → Proceed directly
3. Execute: `deposit(amount, token)`

**Sources:** `src/test/payments.test.ts` 89-122, `README.md` 145-150

## Service Operator System

### Service Approval Architecture

The service operator system enables contracts like Pandora to manage payments on behalf of users through a sophisticated allowance mechanism.

**Service Approval Components:**
- `approveService(service, rateAllowance, lockupAllowance)`
- `revokeService(service)`
- `serviceApproval(service)`

**Allowance Types:**
- **Rate Allowance:** USDFC per epoch
- **Lockup Allowance:** Total USDFC lockup

**Service Integration:**
- Pandora Contract → Storage Operations → Automated Payment Rails

**Sources:** `src/test/payments.test.ts` 124-156, `README.md` 167-191

### Service Approval Data Structure

The `serviceApproval()` method returns detailed information about the current approval state and usage:

**Return Fields:**
- `isApproved: boolean`
- `rateAllowance: bigint`
- `rateUsed: bigint`
- `lockupAllowance: bigint`
- `lockupUsed: bigint`

**Sources:** `src/test/payments.test.ts` 148-156

## Account Management and Lockups

### Account Information Structure

The `accountInfo()` method provides comprehensive account details including time-based lockup calculations.

**Account Fields:**
- `funds: bigint` - Total deposited funds
- `lockupCurrent: bigint` - Base lockup amount
- `lockupRate: bigint` - USDFC per epoch
- `lockupLastSettledAt: bigint` - Last settlement epoch

**Calculated Values:**
- **Epochs since settlement:** `current - lastSettled`
- **Lockup Accrual:** `lockupRate × epochs`
- **Total Lockup:** `lockupCurrent + accruedLockup`
- **Available Funds:** `funds - totalLockup`

**Sources:** `src/test/payments.test.ts` 308-356

## Epoch-Based Time Calculations

The PaymentsService uses Filecoin's epoch system for time-based calculations, where each epoch represents a blockchain block.

### Lockup Calculations

**Formula:** `rate × (current - lastSettled)`

The system tracks:
- **Epoch Usage:** Current epoch for timing calculations
- **Lockup Calculations:** Accrual based on rate and time elapsed
- **Lockup Accrual:** Ongoing calculation of locked funds

This epoch-based system ensures accurate time-based financial calculations that align with blockchain state transitions.

**Sources:** `src/test/payments.test.ts` 308-356

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/5.1-paymentsservice*