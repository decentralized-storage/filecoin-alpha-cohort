# proxyExecute

Executes API calls using encrypted API keys within a trusted execution environment (TEE).

## Signature

```typescript
async function proxyExecute(
  dataIdentifier: string,
  wallet: ethers.Wallet,
  request: {
    method: string,
    url: string,
    headers?: Record<string, string>,
    body?: any
  },
  config: {
    chain: string,
    apiUrl: string,
    expiration: string,
    permissionsRegistryContractAddress: string
  },
  debug?: boolean
): Promise<any>
```

## Description

The `proxyExecute` function allows you to make API calls using encrypted API keys that were previously encrypted using `encryptForProxy`. The function executes the API call within a trusted execution environment (TEE), ensuring that the API key remains secure and is only used for the specific API call being made.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataIdentifier` | `string` | Yes | The identifier of the encrypted API key (from `encryptForProxy` result). |
| `wallet` | `ethers.Wallet` | Yes | The wallet that has permission to use the encrypted API key. |
| `request` | `object` | Yes | The API request configuration object. |
| `config` | `object` | Yes | Configuration object containing chain, API endpoints, and contract addresses. |
| `debug` | `boolean` | No | When set to `true`, enables debug statements during the proxy execution. Default is `false`. |

### Request Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `method` | `string` | Yes | The HTTP method (e.g., 'GET', 'POST', 'PUT'). |
| `url` | `string` | Yes | The API endpoint URL. |
| `headers` | `Record<string, string>` | No | Additional HTTP headers for the request. |
| `body` | `any` | No | The request body (for POST, PUT, etc.). |

### Config Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `chain` | `string` | Yes | The blockchain chain identifier. |
| `apiUrl` | `string` | Yes | The API endpoint for the proxy service. |
| `expiration` | `string` | Yes | The expiration time for the session. |
| `permissionsRegistryContractAddress` | `string` | Yes | The address of the permissions registry contract. |

## Returns

`Promise<any>` - A Promise that resolves to the API response data from the proxy service.

## Examples

First, encrypt your API key using `encryptForProxy`:

```typescript
// Prepare and encrypt the API key
const apiKey = "sk-1234567890abcdef";
const { dataOut, metadataOut } = await keypo.preProcess(apiKey, 'openai-api-key');
const result = await keypo.encryptForProxy(
  dataOut,
  walletClient,
  metadataOut,
  config,
  authorization,
  true
);
```

Then use `proxyExecute` to make API calls:

```typescript
// Make an API call using the encrypted API key
const response = await keypo.proxyExecute(
  result.dataIdentifier,
  wallet,
  {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk-1234567890abcdef"  // API key will be decrypted in TEE
    },
    body: {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Write one sentence about a cat" }]
    }
  },
  {
    chain: "baseSepolia",
    apiUrl: "https://api.keypo.io",
    expiration: "2024-12-31T23:59:59Z",
    permissionsRegistryContractAddress: "0x..."
  },
  true  // enable debug logs
);

console.log('API Response:', response);
```

## Notes

- The function authenticates with Lit Protocol to establish a secure session for the API call.
- The API key is never exposed outside the trusted execution environment (TEE).
- The function automatically handles authentication using the encrypted API key.
- Only wallets with appropriate permissions can use the encrypted API key.
- The API call is executed within a secure environment to prevent key exposure.
- The function supports all standard HTTP methods and request configurations.
- When debug is enabled, the function will log detailed information about the authentication process and request details.
- The response is returned directly from the proxy service without modification.
- The function requires proper configuration including chain, API endpoints, and contract addresses.

## See Also

- [encryptForProxy](./encryptForProxy.md) - For encrypting API keys for proxy execution
- [preProcess](./preProcess.md) - For preparing API keys for encryption
