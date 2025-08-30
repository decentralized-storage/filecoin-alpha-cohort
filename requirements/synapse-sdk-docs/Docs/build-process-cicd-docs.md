# Build Process and CI/CD

**FilOzone/synapse-sdk Documentation**

---

## Overview

This document describes the build system, testing pipeline, and automated release process for the Synapse SDK. It covers the TypeScript compilation process, browser bundle generation, multi-platform testing, and semantic release automation.

For information about testing patterns and methodologies, see Testing Patterns. For deployment and setup procedures, see Deployment and Setup.

The Synapse SDK uses a multi-stage build process that compiles TypeScript source code to JavaScript modules, generates browser-compatible bundles, runs comprehensive tests across multiple environments, and automates releases using semantic versioning.

## Build System Architecture

The build system transforms TypeScript source code into multiple distribution formats to support different consumption patterns:

```
Source Code
├── src/**/*.ts (TypeScript Sources)
└── src/test/**/*.ts (Test Sources)
    │
    ├─── Build Pipeline ────┐
    │                       │
    ├── tsc (TypeScript Compiler)
    │                       │
    └── webpack (Bundle Generator)
            │
            ├─── Distribution Outputs ───────┐
            │                                │
            ├── dist/**/*.js (Node.js Modules)
            ├── dist/**/*.d.ts (Type Declarations)
            ├── dist/browser/synapse-sdk.esm.js (ESM Bundle)
            └── dist/browser/synapse-sdk.min.js (UMD Bundle)
                    │
                    └─── Testing ───────────┐
                                            │
                        ├── mocha (Node.js Tests)
                        └── polendina (Browser Tests)
```

## Package Structure and Exports

The SDK provides multiple entry points through the npm package exports field, allowing consumers to import specific modules or browser bundles:

| Export Path | Import Path | Output File | Purpose |
|-------------|-------------|-------------|---------|
| `.` | `@filoz/synapse-sdk` | `dist/index.js` | Main SDK entry point |
| `./commp` | `@filoz/synapse-sdk/commp` | `dist/commp/index.js` | CommP utilities |
| `./pdp` | `@filoz/synapse-sdk/pdp` | `dist/pdp/index.js` | PDP operations |
| `./payments` | `@filoz/synapse-sdk/payments` | `dist/payments/index.js` | Payment services |
| `./pandora` | `@filoz/synapse-sdk/pandora` | `dist/pandora/index.js` | Pandora contract |
| `./browser` | `@filoz/synapse-sdk/browser` | `dist/browser/*.js` | Browser bundles |

### Package Export Mapping

```
Package Exports → Distribution Files
├── @filoz/synapse-sdk (Main Entry) → dist/index.js
├── @filoz/synapse-sdk/commp (CommP Module) → dist/commp/index.js
├── @filoz/synapse-sdk/pdp (PDP Module) → dist/pdp/index.js
├── @filoz/synapse-sdk/payments (Payments Module) → dist/payments/index.js
├── @filoz/synapse-sdk/pandora (Pandora Module) → dist/pandora/index.js
└── @filoz/synapse-sdk/browser (Browser Bundle) → 
    ├── dist/browser/synapse-sdk.esm.js
    └── dist/browser/synapse-sdk.min.js
```

## Build Scripts and Process

The build process consists of several npm scripts that handle different stages of compilation and bundling:

### Core Build Commands

- **`npm run build`**: Compiles TypeScript source to JavaScript using `tsc`
- **`npm run build:browser`**: Runs full build plus webpack bundling for browser
- **`npm run watch`**: Runs TypeScript compiler in watch mode for development
- **`npm run clean`**: Removes the `dist` directory

### Build Process Flow

```
Developer → npm scripts → TypeScript Compiler → Webpack → dist/ Output

npm run build
    ↓
   tsc → Generate .js and .d.ts files

npm run build:browser
    ↓
npm run build → Generate Node.js modules
    ↓
webpack --config webpack.config.cjs → Generate UMD bundle
    ↓
webpack --config webpack.config.esm.cjs → Generate ESM bundle
```

The `prepublishOnly` script ensures a clean build before publishing: `npm run clean && npm run build && npm run build:browser`

## Browser Bundle Generation

The SDK generates two browser-compatible bundles using webpack:

1. **ESM Bundle** (`synapse-sdk.esm.js`): ES module format for modern browsers
2. **UMD Bundle** (`synapse-sdk.min.js`): Universal module format with minification

Both bundles are configured through webpack configuration files:

- **`webpack.config.cjs`**: Generates UMD bundle
- **`webpack.config.esm.cjs`**: Generates ESM bundle

The browser export in package.json provides multiple access methods:

```json
"./browser": {
    "import": "./dist/browser/synapse-sdk.esm.js",
    "require": "./dist/browser/synapse-sdk.min.js",
    "script": "./dist/browser/synapse-sdk.min.js"
}
```

## Testing Pipeline

The testing system runs tests in both Node.js and browser environments to ensure cross-platform compatibility:

### Test Commands

- **`npm test`**: Full test suite (lint + build + node tests + browser tests)
- **`npm run test:ci`**: Alias for `npm test` used in CI
- **`npm run test:node`**: Node.js tests using mocha
- **`npm run test:browser`**: Browser tests using polendina
- **`npm run test:watch`**: Watch mode for Node.js tests

### Test Execution Flow

```
Test Pipeline
├── ts-standard (Linting)
├── npm run build (TypeScript Compilation)
├── mocha 'dist/test/**/*.js' (Node.js Tests)
└── polendina --page --cleanup (Browser Tests)
    │
    └─── Test Environments ─────────┐
                                    │
         ├── Node.js Environment (Multiple versions)
         └── Browser Environment (Headless browser)
```

The test suite validates functionality across different environments, ensuring the SDK works correctly in both server-side Node.js applications and client-side browser environments.

## CI/CD Pipeline

The continuous integration and deployment pipeline uses GitHub Actions to automate testing and releases across multiple platforms and Node.js versions.

### Test Matrix Strategy

The CI runs tests across a comprehensive matrix of environments:

```
CI Test Matrix
├── Node.js Versions
│   ├── lts/* (Latest LTS)
│   └── current (Latest Release)
└── Operating Systems
    ├── macos-latest
    ├── ubuntu-latest
    └── windows-latest
        │
        └─── Test Execution ───┐
                               │
             ├── npm install --no-progress
             └── npm run test:ci
```

This matrix ensures compatibility across 6 different environment combinations (2 Node.js versions × 3 operating systems).

## Release Automation

Releases are automated using semantic-release when code is pushed to the master branch:

### Release Process Flow

```
Developer → GitHub → GitHub Actions → semantic-release → npm Registry

Push to master
    ↓
Trigger workflow
    ↓
Run tests
    ↓
Build packages
    ↓
npx semantic-release
    ├── Analyze commits
    ├── Determine version
    ├── Create release & changelog
    ├── Publish package
    └── Update CHANGELOG.md
```

The release process only runs after all tests pass and only on the master branch, ensuring quality and preventing accidental releases.

## Semantic Release Configuration

The SDK uses conventional commits and semantic-release for automated versioning and changelog generation:

### Release Rules

| Commit Type | Release Type | Description |
|-------------|--------------|-------------|
| **breaking** | major | Breaking changes |
| **feat** | minor | New features |
| **fix** | patch | Bug fixes |
| **chore** | patch | Maintenance |
| **docs** | patch | Documentation |
| **test** | patch | Tests |

### Release Assets

The semantic-release process automatically:

- Analyzes commit messages using conventional commits
- Determines the next version number
- Generates release notes
- Updates `CHANGELOG.md`
- Publishes to npm registry
- Creates GitHub releases
- Commits changelog updates back to repository

### Release Pipeline Components

```
Release Pipeline
├── @semantic-release/commit-analyzer
│   └── Parse Commits
├── @semantic-release/release-notes-generator
│   └── Generate Notes
└── @semantic-release/changelog
    └── Update CHANGELOG.md
```

## Development Workflow

### Local Development

1. **Setup**: `npm install`
2. **Development**: `npm run watch` (TypeScript watch mode)
3. **Testing**: `npm run test:watch` (Watch mode tests)
4. **Build**: `npm run build:browser` (Full build)

### CI/CD Workflow

1. **Push to branch**: Triggers test matrix
2. **Push to master**: Triggers tests + release
3. **Semantic release**: Automated versioning and publishing
4. **Documentation**: Automated changelog updates

## Build Optimization

### TypeScript Configuration

- **Target**: ES modules for maximum compatibility
- **Declaration files**: Generated for TypeScript consumers
- **Source maps**: Available for debugging

### Webpack Configuration

- **UMD Bundle**: Universal module definition for broad compatibility
- **ESM Bundle**: Modern ES modules for tree-shaking
- **Minification**: Production-ready compressed bundles
- **External dependencies**: Optimized bundle size

## Quality Assurance

### Code Quality

- **TypeScript**: Static type checking
- **ts-standard**: Consistent code formatting and linting
- **Conventional commits**: Structured commit messages

### Testing Strategy

- **Unit tests**: Comprehensive service-layer testing
- **Integration tests**: Multi-environment validation
- **Browser tests**: Cross-platform compatibility
- **CI matrix**: Multiple Node.js versions and operating systems

### Release Quality

- **Semantic versioning**: Predictable version increments
- **Automated testing**: No releases without passing tests
- **Change tracking**: Automated changelog generation
- **Rollback capability**: Git-based version history

---

**Sources:**
- `package.json` (lines 8-34, 35-47, 29-33, 37, 39-45)
- `.github/workflows/test-and-release.yml` (lines 5-24, 25-54)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/8.1-build-process-and-cicd