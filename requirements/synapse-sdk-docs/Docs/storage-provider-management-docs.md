# Storage Provider Management

**FilOzone/synapse-sdk Documentation**

---

## Overview

This document covers the storage provider management system within the Synapse SDK, specifically how storage providers register, get approved, and are managed within the Pandora service contracts. This includes the registration workflow, approval processes, and administrative operations for maintaining the provider registry.

For information about storage operations and data upload/download workflows, see StorageService. For payment-related provider operations, see Cost Calculations and Allowances.

## Storage Provider Lifecycle Overview

Storage providers in the Synapse ecosystem follow a multi-step lifecycle managed by the `PandoraService` class. The process ensures only approved providers can participate in storage operations while maintaining administrative control.

### Provider State Machine

```
Storage Provider Lifecycle States

Unregistered ──────► registerServiceProvider() ──────► Pending
    │                                                     │
    │                                                     ▼
    │                                              approveServiceProvider()
    │                                                  (owner)
    │                                                     │
    │                                                     ▼
    │                                                 Approved ◄─── "Provider can participate
    │                                                     │          in storage operations"
    │                                                     │
    │                          rejectServiceProvider() ◄──┤
    │                              (owner)                │
    │                                 │                   │
    │                                 ▼                   ▼
    └── removeServiceProvider() ◄─ Rejected         removeServiceProvider()
         (owner)                                         (owner)
            │                                               │
            ▼                                               ▼
        Removed ◄───────────────────────────────────────── Removed
```

## Registration Process

### Provider Self-Registration

Storage providers initiate registration through the `registerServiceProvider` method, providing their service endpoints and committing to the network.

### Provider Registration Flow

```
Storage Provider ──► PandoraService ──► Pandora Contract

registerServiceProvider(signer, pdpUrl, pieceRetrievalUrl)
            │                                    │
            ▼                                    ▼
registerServiceProvider(pdpUrl, pieceRetrievalUrl) ──► Store in pendingProviders mapping
            │                                                    │
            ▼                                                    ▼
    Transaction response ◄──────────────────────────── Transaction response
            │
            ▼
"Provider is now in 'pending' state"
```

The registration process stores provider information in the contract's `pendingProviders` mapping, including:

- PDP server URL for proof operations
- Piece retrieval URL for data access
- Registration timestamp

### Registration Validation

Before registration, providers should validate their service endpoints and ensure they can handle the required operations:

| Requirement | Purpose |
|-------------|---------|
| **PDP URL** | Must serve PDP authentication and proof operations |
| **Retrieval URL** | Must provide piece data retrieval capabilities |
| **Valid signer** | Provider wallet must sign the registration transaction |

## Approval Workflow

### Owner-Only Approval Operations

Contract owners can approve, reject, or directly add providers through administrative functions. The `PandoraService` provides methods for each operation with appropriate access control.

```
Contract Owner Administrative Operations

Contract Owner
├── approveServiceProvider()
├── addServiceProvider()
├── rejectServiceProvider()
└── removeServiceProvider()
    │
    ├── approvedProviders mapping ──► Assign providerId
    ├── Remove from pendingProviders ──► Provider can serve storage
    └── Remove from approvedProviders
```

### Administrative Provider Operations

| Operation | Method | Purpose |
|-----------|--------|---------|
| **Approve pending provider** | `approveServiceProvider()` | Move from pending to approved status |
| **Directly add provider** | `addServiceProvider()` | Skip pending state, directly approve |
| **Reject pending provider** | `rejectServiceProvider()` | Deny pending registration |
| **Remove approved provider** | `removeServiceProvider()` | Remove from active provider list |

## Approval Status Checking

The system provides multiple methods to query provider status and information:

### Provider Status Queries

```
Provider Status Queries ──► Contract State

├── isProviderApproved(address) ──────► approvedProviders mapping
├── getProviderIdByAddress(address) ──► approvedProviders mapping  
├── getAllApprovedProviders() ────────► approvedProviders mapping
├── getApprovedProvider(providerId) ──► pendingProviders mapping
└── getPendingProvider(address) ──────► nextServiceProviderId counter
```

## Provider Information Management

### Provider Data Structures

The system maintains different data structures for approved and pending providers:

```typescript
// Approved provider information
interface ApprovedProviderInfo {
    owner: string           // Provider wallet address
    pdpUrl: string         // PDP server endpoint
    pieceRetrievalUrl: string  // Data retrieval endpoint
    registeredAt: number   // Block number of registration
    approvedAt: number     // Block number of approval
}

// Pending provider information
interface PendingProviderInfo {
    pdpUrl: string         // PDP server endpoint
    pieceRetrievalUrl: string  // Data retrieval endpoint
    registeredAt: number   // Timestamp of registration
}
```

### Provider Discovery and Listing

The `getAllApprovedProviders` method returns comprehensive information about all approved providers, enabling client applications to discover available storage options.

```
Provider Discovery Flow

Client Application ──► getAllApprovedProviders() ──► Pandora Contract
                                │
                                ▼
                    ApprovedProviderInfo[]
                    ├── owner address
                    ├── pdpUrl
                    ├── pieceRetrievalUrl
                    ├── registeredAt
                    └── approvedAt
```

## Administrative Operations

### Owner Verification and Access Control

Administrative operations require contract owner privileges. The `PandoraService` provides owner verification methods to ensure proper access control.

```
Owner Access Control Flow

Administrative Operation ──► isOwner(signer) ──► getOwner()
                                │                    │
                                ▼                    ▼
                        signer.getAddress() ◄─── Compare addresses
                                │
                                ├── Authorized? ──[Yes]──► Execute operation
                                └── [No] ──────────────► Access denied
```

### Provider Removal and Updates

When provider information changes, administrators can remove existing registrations and providers can re-register with updated information.

| Operation | Method | Purpose |
|-----------|--------|---------|
| **Remove approved provider** | `removeServiceProvider(providerId)` | Remove from active provider list |
| **Reject pending provider** | `rejectServiceProvider(address)` | Deny pending registration |
| **URL updates** | Remove + re-register | Update service endpoints |

## Integration Examples

### Post-Deployment Setup

The SDK includes automated setup utilities for configuring storage providers after contract deployment:

```
Setup Script Flow

Setup Script ──► PandoraService ──► Pandora Contract

├── Check isProviderApproved(spAddress) ──► boolean status
│
├── [Not approved] ──► registerServiceProvider(signer, pdpUrl, retrievalUrl)
│                      └── registerServiceProvider() ──► Contract
│
├── [Not approved] ──► approveServiceProvider(ownerSigner, spAddress)
│                      └── approveServiceProvider() ──► Contract  
│
└── [Already approved] ──► getApprovedProvider(providerId) ──► Check URL consistency
    │
    └── [URLs changed] ──► removeServiceProvider(ownerSigner, providerId)
```

## Provider Management Workflow

### Registration Process
1. **Provider Self-Registration**: Call `registerServiceProvider()` with endpoints
2. **Validation**: Ensure PDP and retrieval URLs are functional
3. **Pending State**: Provider enters pending approval queue
4. **Owner Review**: Contract owner reviews pending registrations

### Approval Process
1. **Owner Decision**: Approve, reject, or remove pending providers
2. **State Transition**: Move to approved status with assigned provider ID
3. **Service Activation**: Provider can now participate in storage operations
4. **Ongoing Management**: Monitor and manage active providers

### Update Process
1. **URL Changes**: Remove existing registration when endpoints change
2. **Re-registration**: Submit new registration with updated URLs
3. **Re-approval**: Owner must re-approve updated provider
4. **Service Continuity**: Minimize downtime during updates

## Error Handling and Edge Cases

### Registration Errors
- **Duplicate Registration**: Prevent multiple registrations from same address
- **Invalid URLs**: Validate endpoint accessibility before registration
- **Transaction Failures**: Handle blockchain transaction errors gracefully

### Approval Errors  
- **Access Control**: Ensure only contract owner can approve providers
- **State Validation**: Verify provider is in pending state before approval
- **Network Issues**: Handle blockchain connectivity problems

### Update Scenarios
- **URL Consistency**: Detect when provider URLs have changed
- **Graceful Removal**: Clean up all provider references during removal
- **Re-registration**: Handle provider comeback scenarios

## Best Practices

### For Storage Providers
1. **Endpoint Validation**: Test PDP and retrieval URLs before registration
2. **Service Reliability**: Maintain high uptime for registered endpoints  
3. **Update Coordination**: Coordinate with contract owner for URL changes
4. **Monitoring**: Track approval status and respond to owner requests

### For Contract Owners
1. **Due Diligence**: Verify provider capabilities before approval
2. **Regular Review**: Monitor provider performance and reliability
3. **Access Management**: Secure owner keys and limit administrative access
4. **Update Management**: Handle provider URL updates efficiently

### For Client Applications
1. **Provider Discovery**: Use `getAllApprovedProviders()` for current options
2. **Health Checking**: Validate provider endpoints before storage operations
3. **Fallback Handling**: Implement provider fallback strategies
4. **Status Monitoring**: Track provider availability and performance

---

**Sources:**
- `src/pandora/service.ts` (lines 685-862, 694-701, 703-761, 764-861, 69-78, 849-861, 830-844)
- `src/types.ts` (lines 1-50)
- `utils/post-deploy-setup.js` (lines 175-244, 182-244)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/6.1-storage-provider-management