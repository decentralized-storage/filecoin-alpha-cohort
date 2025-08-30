# Development and Testing

**FilOzone/synapse-sdk Documentation**

---

## Overview

This page covers the SDK development practices, build system, testing patterns, CI/CD pipeline, and deployment utilities used in the Synapse SDK project. It provides guidance for contributors and maintainers on how to build, test, and deploy the SDK effectively.

For information about specific SDK functionality and APIs, see the Core Architecture section (page 3). For testing individual SDK components like PDP or payments, see their respective sections (page 4 and page 5).

## Build System Architecture

The Synapse SDK uses a multi-target build system that produces both Node.js and browser-compatible bundles. The build process is orchestrated through npm scripts defined in `package.json` and uses TypeScript compilation with Webpack for browser bundles.

### Build System Flow

```
Source Code
├── TypeScript Sources (src/)
├── tsconfig.json (TypeScript Config)
└── Webpack Configs
    ├── webpack.config.cjs (UMD Bundle)
    └── webpack.config.esm.cjs (ESM Bundle)
        │
        ├─── Build Process ─────────┐
        │                           │
        ├── tsc (TypeScript Compiler)
        └── Webpack (Browser Bundler)
                │
                ├─── Output Artifacts ──────────┐
                │                               │
                ├── dist/ (Node.js Modules)
                ├── dist/**/*.d.ts (Type Definitions)
                ├── dist/browser/synapse-sdk.esm.js (ESM Bundle)
                └── dist/browser/synapse-sdk.min.js (UMD Bundle)
                        │
                        └─── Package Exports ───┐
                                                │
                            ├── main: dist/index.js
                            ├── exports: ./commp, ./pdp, etc.
                            └── ./browser export
```

## Build Scripts and Commands

The build system provides several npm scripts for different build scenarios:

| Script | Command | Purpose |
|--------|---------|---------|
| **build** | `tsc` | Compile TypeScript to Node.js modules |
| **build:browser** | `npm run build && webpack --config webpack.config.cjs && webpack --config webpack.config.esm.cjs` | Build browser bundles |
| **watch** | `tsc -w` | Watch mode for development |
| **clean** | `rm -rf dist` | Clean build artifacts |
| **prepublishOnly** | `npm run clean && npm run build && npm run build:browser` | Full build for publishing |

## Testing Strategy

The SDK implements a comprehensive testing strategy that covers both Node.js and browser environments using Mocha and Polendina.

### Testing Architecture

```
Test Pipeline
├── Linting (ts-standard)
├── Node.js Tests (npm run test:node)
├── Browser Tests (npm run test:browser)
└── CI Pipeline (npm run test:ci)
    │
    ├─── Test Sources ───────────────┐
    │                                │
    ├── src/test/**/*.test.ts (TypeScript Test Files)
    └── Test Utilities (Mocking & Helpers)
            │
            ├─── Test Compilation ───┐
            │                        │
            ├── TypeScript Compiler (tsc)
            └── dist/test/**/*.js (Compiled Test Files)
                    │
                    ├─── Test Execution ─────────┐
                    │                            │
                    ├── Browser Testing
                    │   └── Polendina Browser Runner
                    │       └── polendina --page --cleanup
                    └── Node.js Testing
                        └── Mocha Test Runner
                            └── mocha 'dist/test/**/*.js'
```

### Test Environment Configuration

The testing setup includes:

- **Linting**: `ts-standard` for code style enforcement
- **Node.js Testing**: Mocha runner for server-side testing
- **Browser Testing**: Polendina for browser environment testing with cleanup
- **CI Integration**: Combined test execution for continuous integration

## Development Tools and Utilities

The SDK provides several development tools and utilities in the `utils/` directory for testing, debugging, and deployment.

### Development Tools Ecosystem

```
HTML Testing Tools
├── pdp-tool-test.html (PDP Testing Interface)
├── pdp-auth-demo.html (EIP-712 Auth Demo)
├── storage-provider-tool.html (Provider Management)
└── payment-apis-demo.html (Payment System Demo)
    │
    ├─── Browser Environment ───────┐
    │                               │
    ├── MetaMask Integration (Wallet Connection)
    ├── Synapse SDK Bundle (dist/browser/synapse-sdk.min.js)
    └── Ethers.js CDN (Blockchain Interaction)
            │
            ├─── SDK Components ────────┐
            │                           │
            ├── PDPAuthHelper (EIP-712 Signing)
            ├── PDPServer (Curio Integration)
            ├── PandoraService (Contract Interaction)
            └── PaymentsService (Token Operations)
                    │
                    └─── Node.js Utilities ─────┐
                                                │
                        └── post-deploy-setup.js (Contract Setup Script)
```

### HTML Testing Tools

The SDK includes several browser-based testing tools that must be served via HTTP/HTTPS:

#### PDP Testing Tool (`pdp-tool-test.html`)
- **Purpose**: Interactive PDP (Proof of Data Possession) testing interface
- **Features**: MetaMask integration, proof set creation, root addition, transaction monitoring
- **Key Components**: `PDPAuthHelper`, `PDPServer`, `PandoraService` integration

#### Storage Provider Tool (`storage-provider-tool.html`)
- **Purpose**: Storage provider registration and management
- **Features**: Provider registration, approval workflows, contract administration
- **Use Cases**: SP onboarding, contract owner functions

#### Payment APIs Demo (`payment-apis-demo.html`)
- **Purpose**: Payment system testing and cost calculation
- **Features**: Balance checking, allowance management, storage cost analysis
- **Components**: `PaymentsService` integration, USDFC token operations

## Post-Deployment Setup Script

The `post-deploy-setup.js` script automates the complete setup process after deploying a new Pandora service contract.

### Setup Process Flow

```
post-deploy-setup.js
├── Environment Validation
│   └── Validate env vars:
│       ├── DEPLOYER_PRIVATE_KEY
│       ├── SP_PRIVATE_KEY
│       └── CLIENT_PRIVATE_KEY
├── Storage Provider Setup
│   ├── Check if SP approved
│   ├── [SP Not Approved] → registerServiceProvider(pdpUrl, retrievalUrl)
│   ├── approveServiceProvider(spAddress)
│   └── [SP URLs Changed] → 
│       ├── removeServiceProvider(spId)
│       ├── registerServiceProvider(newUrls)
│       └── approveServiceProvider(spAddress)
├── Client Payment Setup
│   ├── Check USDFC allowance
│   ├── approve(USDFC, paymentsContract, amount)
│   └── approveService(pandoraAddress, rates, lockup)
└── Status Verification
    └── Verify all configurations & Report final status
```

## CI/CD Pipeline

The SDK uses GitHub Actions for continuous integration and automated releases.

### Test Matrix Configuration

The CI pipeline tests across multiple environments:

| Environment | Node Versions | Operating Systems |
|-------------|---------------|-------------------|
| **Node.js** | `lts/*`, `current` | Ubuntu, macOS, Windows |
| **Test Command** | `npm run test:ci` | Cross-platform bash shell |
| **Fail Strategy** | `fail-fast: false` | Continue testing other combinations |

## Release Process

The SDK uses semantic-release for automated versioning and publishing based on conventional commits.

### Semantic Release Configuration

The release process is configured in `package.json` with conventional commit analysis:

#### Release Rules

- **Breaking changes**: Major version bump
- **Features (`feat:`)**: Minor version bump
- **Fixes (`fix:`)**: Patch version bump
- **Chores, docs, tests**: Patch version bump
- **Scope `no-release`**: No release

#### Release Assets

- **Changelog**: Automatically updated `CHANGELOG.md`
- **NPM Package**: Published to `@filoz/synapse-sdk`
- **GitHub Release**: Tagged release with notes
- **Git Commit**: Version bump commit

### Conventional Commits Pattern

The project follows conventional commits with these types:

```
Commit Types → Release Notes Sections

feat: (New features) → Minor Release → Features
fix: (Bug fixes) → Patch Release → Bug Fixes
BREAKING CHANGE → Major Release
chore: → Patch Release → Trivial Changes
docs: → Patch Release → Trivial Changes
test: → Patch Release → Tests
```

## Development Workflow

### Local Development Setup

1. **Install Dependencies**: `npm install`
2. **Build for Development**: `npm run build`
3. **Watch Mode**: `npm run watch`
4. **Run Tests**: `npm test`
5. **Browser Testing**: Serve HTML tools via HTTP server

### Testing HTML Tools Locally

The HTML tools require HTTP serving due to browser security restrictions:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js 
npx st --dir . -nc -p 8000

# Visit: http://localhost:8000/utils/tool-name.html
```

### Development Best Practices

#### Code Quality
- Use TypeScript for type safety
- Follow `ts-standard` linting rules
- Write comprehensive tests for new features
- Use conventional commits for version management

#### Testing Strategy
- Test in both Node.js and browser environments
- Use mock services for blockchain interactions
- Validate edge cases and error conditions
- Maintain high test coverage

#### Build Process
- Clean builds before publishing (`prepublishOnly`)
- Generate both Node.js and browser bundles
- Include TypeScript definitions
- Validate cross-platform compatibility

#### Release Management
- Use semantic versioning
- Follow conventional commit patterns
- Automate releases through CI/CD
- Maintain comprehensive changelogs

### Troubleshooting Common Issues

#### Build Issues
- Ensure TypeScript compilation succeeds
- Check webpack configuration for browser bundles
- Verify all dependencies are installed

#### Test Failures
- Run tests in both Node.js and browser environments
- Check for environment-specific issues
- Validate mock configurations

#### HTML Tool Issues
- Serve tools via HTTP/HTTPS (not file://)
- Check MetaMask connection
- Verify SDK bundle is loaded correctly

---

**Sources:**
- `package.json` (lines 35-47, 6-33, 41-45, 39-45, 90-178, 94-163)
- `.github/workflows/test-and-release.yml` (lines 1-56, 21-24, 4-24)
- `utils/pdp-tool-test.html` (lines 304-311, 309-317)
- `utils/post-deploy-setup.js` (lines 96-99, 62-89, 175-307)
- `utils/README.md` (lines 80-210, 100-186, 84-98)
- `CHANGELOG.md` (lines 1-25)

**URL:** https://deepwiki.com/FilOzone/synapse-sdk/8-development-and-testing