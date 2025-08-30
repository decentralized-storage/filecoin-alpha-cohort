# Deployment and Setup

**FilOzone/synapse-sdk Documentation**

---

## Overview

This document covers post-deployment configuration, provider onboarding, and development tools for the Synapse SDK ecosystem. It focuses on the operational setup required after smart contracts are deployed and before the system becomes fully functional.

For basic SDK installation and configuration, see Installation and Setup. For information about the build process and CI/CD pipeline, see Build Process and CI/CD.

## Post-Deployment Configuration Overview

After deploying Pandora smart contracts, several configuration steps are required to create a functional storage marketplace. The setup process involves three key actors and their respective configurations.

## Setup Process Flow

The setup process follows these phases:

1. **Deployment Phase**
   - Deploy Pandora Contract via FilOzone tools

2. **Configuration Phase**
   - Automated configuration via `post-deploy-setup.js`
   - Storage Provider Registration
   - Provider Approval (Contract Owner)
   - Client Payment Configuration

3. **Validation Phase**
   - System Status Verification
   - Development Tools Testing

## Automated Setup Script

The `post-deploy-setup.js` script automates the complete post-deployment configuration process using the SDK's service classes.

### Setup Script Architecture

The script consists of several key components:

- **Script Components**: `main()`
- **Contract Operations**: `PandoraService`, `Synapse.create()`, `PDPAuthHelper`
- **Core Functions**: `registerServiceProvider()`, `approveServiceProvider()`, `approve()`, `approveService()`
- **Environment Variables**: Configuration for deployment keys and endpoints

### Required Environment Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `DEPLOYER_PRIVATE_KEY` | Contract owner private key | `0x...` |
| `SP_PRIVATE_KEY` | Storage provider private key | `0x...` |
| `CLIENT_PRIVATE_KEY` | Client account private key | `0x...` |
| `PANDORA_CONTRACT_ADDRESS` | Deployed contract address | `0x...` |
| `NETWORK` | Target network | `calibration` or `mainnet` |
| `SP_PDP_URL` | Curio PDP endpoint | `http://your-curio:4702` |
| `SP_RETRIEVAL_URL` | Retrieval endpoint | `http://your-curio:4702` |

## Storage Provider Onboarding

The provider onboarding process involves registration, approval, and URL management through the `PandoraService` class.

### Provider Registration Flow

The registration process follows this sequence:

1. **Check Provider Status**
   - `isProviderApproved(spAddress)` - Check approval status

2. **Registration (if not approved)**
   - `registerServiceProvider(signer, pdpUrl, retrievalUrl)` - Register provider
   - `approveServiceProvider(ownerSigner, spAddress)` - Approve provider

3. **URL Update Handling (if URLs changed)**
   - `removeServiceProvider(ownerSigner, spId)` - Remove existing provider
   - `registerServiceProvider(signer, newPdpUrl, newRetrievalUrl)` - Re-register with new URLs
   - `approveServiceProvider(ownerSigner, spAddress)` - Re-approve provider

### URL Update Handling

The setup script automatically handles provider URL updates by comparing current configuration with desired URLs:

```javascript
// URL comparison logic from post-deploy-setup.js
const currentInfo = await spTool.getApprovedProvider(spId)
const urlsMatch = currentInfo.pdpUrl === spPdpUrl &&
                 currentInfo.pieceRetrievalUrl === spRetrievalUrl

if (!urlsMatch) {
    // Remove, re-register, and re-approve with new URLs
}
```

## Payment System Configuration

Client payment setup involves USDFC token allowances and service operator approvals through the Synapse client.

### Payment Configuration Components

The payment configuration includes:

- **Client Setup**: `Synapse.create()`
- **Token Allowances**:
  - `allowance(TOKENS.USDFC, paymentsAddress)` - Check current allowance
  - `approve(TOKENS.USDFC, paymentsAddress, amount)` - Set token approval
- **Service Approvals**:
  - `serviceApproval(pandoraAddress, TOKENS.USDFC)` - Check service permissions
  - `approveService(pandoraAddress, rateAllowance, RATE_ALLOWANCE_PER_EPOCH)` - Approve service

### Payment Configuration Constants

- **LOCKUP_ALLOWANCE**: 10 USDFC
- **RATE_ALLOWANCE_PER_EPOCH**: Configurable rate limit

### Payment Setup Validation

The script validates current allowances before making changes:

| Check Method | Purpose |
|--------------|---------|
| **USDFC Allowance** | `payments.allowance()` - Ensure sufficient token approval |
| **Service Approval** | `payments.serviceApproval()` - Check operator permissions |
| **Balance Check** | `payments.walletBalance()` - Warn if insufficient funds |

## Development and Testing Tools

The SDK provides browser-based testing tools for interactive development and debugging.

### HTML Testing Tools Architecture

The testing environment includes:

- **Browser Environment**: MetaMask Integration
- **SDK Components**: `ethers.BrowserProvider`, `synapse-sdk.min.js` UMD Bundle
- **Testing Tools**:
  - `pdp-auth-demo.html`
  - `pdp-tool-test.html`
  - `storage-provider-tool.html`
  - `payment-apis-demo.html`

### PDP Testing Tool Features

The `pdp-tool-test.html` provides comprehensive proof set management:

| Feature | Implementation | SDK Component |
|---------|----------------|---------------|
| **Wallet Connection** | `connectMetaMask()` | `ethers.BrowserProvider` |
| **Provider Discovery** | `getAllApprovedProviders()` | `PandoraService` |
| **Proof Set Creation** | `createProofSet()` | `PDPServer` |
| **Root Management** | `addRoots()` | `PDPServer` |
| **Status Monitoring** | `getComprehensiveProofSetStatus()` | `PandoraService` |

### Network Configuration

The testing tools support both Calibration testnet and Filecoin mainnet:

```javascript
// Network selection from pdp-tool-test.html
const expectedChainId = currentNetwork === 'mainnet' ? 314 : 314159
const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[currentNetwork]
```

## System Status Verification

After setup completion, the system provides comprehensive status reporting.

### Status Report Components

The final status report includes:

1. **Provider Status**
   - `isProviderApproved()` - Check provider approval
   - `getApprovedProvider()` - Get provider details
   - `getProviderIdByAddress()` - Get provider ID

2. **Client Status**
   - `walletBalance(TOKENS.USDFC)` - Check wallet balance
   - `allowance(TOKENS.USDFC, paymentsAddress)` - Verify token allowance
   - `serviceApproval(pandoraAddress, TOKENS.USDFC)` - Check service approval

3. **Contract Status**
   - `isOwner(deployerSigner)` - Verify contract ownership
   - Contract balance verification

4. **Final Report**
   - Comprehensive status output
   - Balance and configuration warnings
   - System readiness confirmation

## Contract Address Constants

The setup uses predefined contract addresses for each network:

| Network | Contract | Address |
|---------|----------|---------|
| **Calibration** | PDP Verifier | `0x5A23b7df87f59A291C26A2A1d684AD03Ce9B68DC` |
| **Calibration** | Payments | `0x0E690D3e60B0576D01352AB03b258115eb84A047` |
| **Calibration** | USDFC Token | `0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0` |

## Operational Considerations

- All environment variables must be properly configured before running the setup script
- The deployer account must have sufficient funds for gas fees
- Storage provider endpoints must be accessible and properly configured
- Client accounts must have sufficient USDFC tokens for payments
- Network selection must match the deployed contract addresses

---

**Sources**: 
- `utils/post-deploy-setup.js` (lines 1-94, 96-174, 132-421, etc.)
- `utils/README.md` (lines 1-210, 32-48, 67-72, 79-210)
- `utils/pdp-tool-test.html` (lines 304-317, 324-337, 369-432, 391-397, 550-622)

**URL**: https://deepwiki.com/FilOzone/synapse-sdk/8.3-deployment-and-setup