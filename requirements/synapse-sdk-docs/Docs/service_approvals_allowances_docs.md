# Service Approvals and Allowances

## Relevant Source Files

This document covers the service approval and allowance system in the Synapse SDK, which enables users to authorize services like Pandora to perform operations on their behalf using pre-approved spending limits. The system manages two types of allowances: rate allowances for ongoing payments and lockup allowances for security deposits.

For general payment operations like deposits and withdrawals, see **PaymentsService**.  
For storage provider management and proof set operations, see **Pandora Service**.

## Overview

The service approval system allows users to grant spending permissions to service operators without requiring transaction approval for every operation. This is implemented through the `PaymentsService.approveService()` method and enforced by smart contracts.

## Service Approval Architecture

**Sources:** `src/pandora/service.ts` 526-602, `src/test/payments.test.ts` 124-180

### System Components

The approval system involves several key components:

- **User Wallet** - Holds USDFC Token Balance
- **Payments Contract** - Manages User Deposits and Service Approvals
- **Service Operators** - Pandora Service and Other Services
- **Authorized Operations** - Lock Security Deposits and Charge for Storage

### Approval Flow

1. User calls `approveService()` and `deposit()`
2. Transfer occurs to Payments Contract
3. Rate & Lockup Allowances are established
4. Service Operators gain Authorized Operations capabilities

## Allowance Types

The system uses two distinct allowance types to control service spending:

### Rate Allowance

Rate allowance represents the maximum USDFC per epoch that a service can charge for ongoing operations. This is typically used for storage costs that are charged continuously over time.

| Property | Description | Usage |
|----------|-------------|-------|
| `rateAllowance` | Maximum USDFC per epoch | Ongoing storage payments |
| `rateUsed` | Currently consumed rate | Tracks active commitments |
| Available Rate | `rateAllowance - rateUsed` | Remaining spending capacity |

### Lockup Allowance

Lockup allowance represents the maximum USDFC that can be locked as security deposits. These funds are temporarily unavailable but can be unlocked when commitments end.

| Property | Description | Usage |
|----------|-------------|-------|
| `lockupAllowance` | Maximum lockup capacity | Security deposits |
| `lockupUsed` | Currently locked amount | Active security deposits |
| Available Lockup | `lockupAllowance - lockupUsed` | Remaining lockup capacity |

**Sources:** `src/pandora/service.ts` 534-553, `src/test/test-utils.ts` 139-148

## Service Approval Workflow

### Service Approval and Checking Sequence

**Service Approval Flow:**
1. User → PaymentsService: `approveService(serviceAddress, rateAllowance, lockupAllowance)`
2. PaymentsService → PaymentsContract: `approveServiceOperator()`
3. PaymentsContract: Update `operatorApprovals` mapping
4. Transaction confirmed → Service approved

**Allowance Checking:**
1. PandoraService: `checkAllowanceForStorage()`
2. PaymentsService: `serviceApproval(serviceAddress)`
3. PaymentsContract: `operatorApprovals(user, service, token)`
4. Returns: `isApproved`, `rateAllowance`, `rateUsed`, `lockupAllowance`, `lockupUsed`
5. Calculate required vs available → Sufficient/Insufficient + details

**Sources:** `src/test/payments.test.ts` 127-156, `src/pandora/service.ts` 555-584

## Cost Calculations and Allowance Checking

The PandoraService integrates cost calculation with allowance checking to determine if users have sufficient approvals for storage operations.

### Storage Cost Calculation Process

The `checkAllowanceForStorage()` method in PandoraService performs this calculation:

```javascript
const costs = await this.calculateStorageCost(sizeInBytes)
const selectedCosts = withCDN ? costs.withCDN : costs
const rateNeeded = selectedCosts.perEpoch
const lockupPeriod = BigInt(lockupDays ?? TIME_CONSTANTS.DEFAULT_LOCKUP_DAYS) * TIME_CONSTANTS.EPOCHS_PER_DAY
const lockupNeeded = rateNeeded * lockupPeriod
```

### Cost Calculation Flow

**Input Parameters:**
- `lockupDays` (default: 10)
- `sizeInBytes`
- `withCDN` boolean

**Contract Price Query:**
- Pandora Contract → `getServicePrice()`
- Returns: `pricePerTiBPerMonthNoCDN`, `pricePerTiBPerMonthWithCDN`

**Calculations:**
- Rate per Epoch = `(price * size) / (TiB * epochsPerMonth)`
- Lockup Needed = `ratePerEpoch * lockupPeriod`
- Total Rate Needed = `currentRateUsed + newRate`
- Total Lockup Needed = `currentLockupUsed + newLockup`

**Sources:** `src/pandora/service.ts` 559-565, `src/pandora/service.ts` 478-524

## Preparation and Required Actions

The `prepareStorageUpload()` method analyzes requirements and generates actionable steps for users who lack sufficient funds or approvals.

### Action Types

**Preparation Analysis:**
1. `calculateStorageCost()`
2. `checkAllowanceForStorage()`
3. `paymentsService.accountInfo()`

**Conditions and Actions:**
- If `availableFunds < requiredBalance` → Action type: `'deposit'` (Insufficient USDFC balance)
- If `!allowanceCheck.sufficient` → Action type: `'approveService'` (Insufficient allowances)

**Action Execution:**
- `paymentsService.deposit()`
- `paymentsService.approveService()`

### Action Structure

Each action returned by `prepareStorageUpload()` contains:

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'deposit'` \| `'approve'` \| `'approveService'` | Action category |
| `description` | `string` | Human-readable description |
| `execute` | `() => Promise<TransactionResponse>` | Executable function |

**Sources:** `src/pandora/service.ts` 610-683, `src/pandora/service.ts` 638-669

## Code Integration Examples

### Checking Service Approval Status

```javascript
// Check current approval status
const approval = await paymentsService.serviceApproval(pandoraAddress, TOKENS.USDFC)

console.log(`Service approved: ${approval.isApproved}`)
console.log(`Rate allowance: ${approval.rateAllowance}`)
console.log(`Rate used: ${approval.rateUsed}`) 
console.log(`Lockup allowance: ${approval.lockupAllowance}`)
console.log(`Lockup used: ${approval.lockupUsed}`)
```

### Approving a Service

```javascript
// Approve Pandora service with allowances
const rateAllowance = ethers.parseUnits('10', 18) // 10 USDFC per epoch
const lockupAllowance = ethers.parseUnits('1000', 18) // 1000 USDFC lockup

const tx = await paymentsService.approveService(
  pandoraAddress,
  rateAllowance, 
  lockupAllowance,
  TOKENS.USDFC
)
await tx.wait()
```

### Storage Preparation Workflow

```javascript
// Prepare for storage upload
const preparation = await pandoraService.prepareStorageUpload({
  dataSize: 1024 * 1024 * 100, // 100 MB
  withCDN: true
}, paymentsService)

console.log('Estimated cost per month:', preparation.estimatedCost.perMonth)
console.log('Allowances sufficient:', preparation.allowanceCheck.sufficient)

// Execute required actions
for (const action of preparation.actions) {
  console.log(`Executing: ${action.description}`)
  const tx = await action.execute()
  await tx.wait()
  console.log(`Completed: ${action.type}`)
}
```

**Sources:** `src/test/payments.test.ts` 124-179, `src/pandora/service.ts` 610-683

## Smart Contract Integration

The allowance system integrates with the Payments smart contract through specific function calls:

| Function | Purpose | Parameters |
|----------|---------|------------|
| *[Note: The original PDF appears to have incomplete information in this table]* | | |

---

*Documentation extracted from FilOzone/synapse-sdk | DeepWiki*  
*Source: https://deepwiki.com/FilOzone/synapse-sdk/5.2-service-approvals-and-allowances*