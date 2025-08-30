# FilOzone/synapse-sdk

## Overview

### Relevant source files

## Purpose and Scope

This document provides a high-level introduction to the Synapse SDK, explaining its purpose within the Filecoin ecosystem and architectural design. It covers the SDK's core components, package structure, and how different parts work together to provide decentralized storage services.

For detailed information about specific components, see:

* Package structure and exports: Package Structure
* Getting started with the SDK: Getting Started
* Core architecture details: Core Architecture
* Storage operations: Storage System
* Payment system: Payment System

## What is Synapse SDK

The Synapse SDK is a JavaScript/TypeScript interface for interacting with Filecoin Synapse, a smart-contract based marketplace for storage services in the Filecoin ecosystem. The SDK enables developers to upload, store, and retrieve data on Filecoin through a network of storage providers while handling all the underlying complexity of blockchain interactions, proof systems, and payment flows.

The SDK follows a dual-approach design philosophy:

1. Simple Golden Path: The main Synapse class provides a streamlined experience with sensible defaults for common use cases
2. Composable Components: Individual components can be imported and used independently for advanced customization

### Key capabilities include:

* Data Storage: Upload and download data with cryptographic integrity guarantees
* Payment Management: Handle USDFC token deposits, withdrawals, and service approvals
* Proof of Data Possession (PDP): Automated proof generation and verification for stored data
* Provider Discovery: Automatic selection of storage providers based on availability and cost
* Multi-Environment Support: Works in both Node.js and browser environments

Sources: package.json 1-89, README.md 1-68, AGENTS.md 1-13

## System Architecture

The Synapse SDK operates within a multi-layered architecture that spans client applications, blockchain contracts, and storage infrastructure:

### High-Level System Overview

![System Architecture Diagram showing the relationship between Client Applications, SDK, Blockchain, and Storage Infrastructure]

Sources: package.json 6-33, AGENTS.md 46-68, README.md 4-14

## SDK Module Architecture

![SDK Module Architecture diagram showing the internal structure of the SDK components]

Sources: package.json 8-33, AGENTS.md 46-68, package.json 35-47

## Package Structure and Exports

The SDK is distributed as an ES module with multiple export paths for different use cases:

| Export Path | Purpose | Main Classes |
|-------------|---------|--------------|
| @filoz/synapse-sdk | Main SDK interface | Synapse |
| @filoz/synapse-sdk/commp | CommP calculation utilities | calculate(), createCommPStream() |
| @filoz/synapse-sdk/pdp | PDP protocol components | PDPServer, PDPAuthHelper, PDPVerifier |
| @filoz/synapse-sdk/payments | Payment operations | PaymentsService |
| @filoz/synapse-sdk/pandora | Storage coordination | PandoraService |
| @filoz/synapse-sdk/browser | Browser-optimized bundles | UMD/ESM formats |

Browser Support:
* ESM Bundle: dist/browser/synapse-sdk.esm.js for modern module-aware environments
* UMD Bundle: dist/browser/synapse-sdk.min.js for script tag usage with global window.SynapseSDK

Dependencies:
* ethers ^6.14.3: Ethereum/Filecoin blockchain interactions
* @web3-storage/data-segment ^5.3.0: Data segment handling for CommP calculations
* multiformats ^13.3.6: Multi-format data encoding (CIDs, hashes)

Sources: package.json 8-33, package.json 63-67, AGENTS.md 86-92

## Key Components and Relationships

### Component Hierarchy

### Component Responsibilities

| Component | Primary Responsibilities | Dependencies |
|-----------|-------------------------|--------------|
| Synapse | SDK entry point, service orchestration, high-level API | PaymentsService, StorageService |
| PaymentsService | USDFC deposits/withdrawals, service approvals, balance queries | Payments contract, USDFC token |
| StorageService | Data upload/download, provider selection, proof set coordination | PandoraService, PDPServer, PieceRetriever |
| PandoraService | Storage cost calculation, allowance verification, proof set management | PaymentsService, PDPVerifier, Pandora contract |
| PDPServer | Curio HTTP API integration, piece uploads, proof set operations | PDPAuthHelper, Curio storage providers |
| PDPAuthHelper | EIP-712 signature generation, authentication for PDP operations | ethers.js signer, Pandora contract address |
| PDPVerifier | PDPVerifier contract interactions, proof set lifecycle | PDPVerifier contract |
| PieceRetriever | Data retrieval strategies, provider discovery, CDN integration | Subgraph API, storage providers, FilCDN |

Sources: AGENTS.md 16-21, AGENTS.md 137-143, README.md 230-260

## Data Flow Overview

The SDK orchestrates complex interactions between clients, blockchain contracts, and storage providers:

### Storage Upload Flow

![Storage Upload Flow diagram showing interaction sequence between components]

### Data Retrieval Flow

![Data Retrieval Flow diagram showing interaction sequence for retrieving data]
