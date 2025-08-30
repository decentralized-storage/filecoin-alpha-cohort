# proxyExecute

Executes API calls using encrypted API keys within a trusted execution environment (TEE).

**Note**: decryption can currently only be done in a client/browser environment. If you want to decrypt something server-side, please use the [server-sdk](https://github.com/keypo/keypo-server-sdk). We will be updating the docs with instructions for this SDK soon!

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

The proxyExecute function allows you to make API calls using encrypted API keys that were previously encrypted using [encryptForProxy](../encryption/encryptForProxy.md). The function executes the API call within a trusted execution environment (TEE), ensuring that the API key doesn't leak to the end user.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dataIdentifier | string | Yes | The identifier of the encrypted API key (from encryptForProxy result). |
| wallet | ethers.Wallet | Yes | The wallet that has permission to use the encrypted API key. |
| request | object | Yes | The API request configuration object. |
| config | object | Yes | Configuration object containing chain, API endpoints, and contract addresses. |
| debug | boolean | No | When set to `true`, enables debug statements during the proxy execution. Default is `false`. |

## Request Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| method | string | Yes | The HTTP method (e.g., 'GET', 'POST', 'PUT'). |
| url | string | Yes | The API endpoint URL. |
| headers | Record<string, string> | No | Additional HTTP headers for the request. |
| body | any | No | The request body (for POST, PUT, etc.). |

## Config Object Properties

**Note**: use [init](../data-management/init.md) to automatically load the config.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| chain | string | Yes | The blockchain chain identifier. |
| apiUrl | string | Yes | The API endpoint for the proxy service. |
| expiration | string | Yes | The expiration time for the session. |
| permissionsRegistryContractAddress | string | Yes | The address of the permissions registry contract. |

## Returns

`Promise<any>` - A Promise that resolves to the API response data from the proxy service.

## Examples

First, encrypt your API key using [encryptForProxy](../encryption/encryptForProxy.md):

```typescript
import { init, preProcess, encryptForProxy } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

// Prepare and encrypt the API key
const config = await init("https://api.keypo.io");
const apiKey = "sk-1234567890abcdef";
const { dataOut, metadataOut } = await preProcess(apiKey, 'openai-api-key');

const result = await encryptForProxy(
  dataOut,
  walletClient,
  metadataOut,
  config.encryptForProxyConfig,
  authorization
);
```

Then use `proxyExecute` to make API calls:

```typescript
import { init, proxyExecute } from "@keypo/typescript-sdk";
import { ethers } from "ethers";

// Make an API call using the encrypted API key
const response = await proxyExecute(
  result.dataIdentifier,
  wallet,
  {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "${apiKey}" // API key will be replaced by the decrypted value
    },
    body: {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Write one sentence about a cat" }]
    }
  },
  config.proxyExecuteConfig
);

console.log('API Response:', response);
```

### Complete Proxy Execution Workflow

```typescript
import { init, preProcess, encryptForProxy, proxyExecute } from "@keypo/typescript-sdk";
import { http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { ethers } from "ethers";

async function executeWithEncryptedKey() {
  try {
    // Setup configuration
    const config = await init("https://api.keypo.io");
    
    // Setup wallets
    const account = privateKeyToAccount("0x...");
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    });
    
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    const authorization = await walletClient.signAuthorization({
      contractAddress: config.kernelAddress as `0x${string}`,
    });

    // 1. Prepare and encrypt API key
    const apiKey = "sk-your-openai-api-key";
    const { dataOut, metadataOut } = await preProcess(apiKey, 'openai-key');
    
    const encryptResult = await encryptForProxy(
      dataOut,
      walletClient,
      metadataOut,
      authorization,
      config.encryptForProxyConfig
    );

    // 2. Execute API call using encrypted key
    const response = await proxyExecute(
      encryptResult.dataIdentifier,
      wallet,
      {
        method: "POST",
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${apiKey}"
        },
        body: {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "user", content: "Explain quantum computing in one sentence" }
          ],
          max_tokens: 100
        }
      },
      config.proxyExecuteConfig
    );

    console.log("API Response:", response);
    return response;

  } catch (error) {
    console.error("Proxy execution failed:", error);
    throw error;
  }
}
```

### Multiple API Calls with Same Key

```typescript
// You can reuse the same encrypted key for multiple API calls
const calls = [
  {
    method: "GET",
    url: "https://api.example.com/data",
    headers: { "Authorization": "Bearer ${apiKey}" }
  },
  {
    method: "POST", 
    url: "https://api.example.com/create",
    headers: { 
      "Authorization": "Bearer ${apiKey}",
      "Content-Type": "application/json"
    },
    body: { name: "New Item" }
  }
];

const responses = await Promise.all(
  calls.map(call => 
    proxyExecute(encryptedKeyId, wallet, call, config.proxyExecuteConfig)
  )
);
```

### With Debug Mode

```typescript
// Enable debug mode for troubleshooting
const response = await proxyExecute(
  dataIdentifier,
  wallet,
  {
    method: "GET",
    url: "https://api.example.com/test"
  },
  config.proxyExecuteConfig,
  true // Enable debug logging
);
```

## Error Handling

The proxyExecute function may throw errors in the following cases:

- **Access denied**: If the wallet doesn't have permission to use the encrypted API key
- **Invalid API key**: If the decrypted key is invalid or expired
- **Network errors**: If there are connectivity issues with the target API
- **Rate limiting**: If the API key has reached its usage limits
- **Response size limit**: If the API response exceeds 100KB

```typescript
try {
  const response = await proxyExecute(
    dataIdentifier,
    wallet,
    request,
    config.proxyExecuteConfig
  );
  
  // Process successful response
  console.log("API call successful:", response);
  
} catch (error) {
  if (error.message.includes('Access denied')) {
    console.error('You do not have permission to use this API key');
  } else if (error.message.includes('Invalid API key')) {
    console.error('The encrypted API key is invalid or expired');
  } else if (error.message.includes('Rate limit')) {
    console.error('API rate limit exceeded');
  } else if (error.message.includes('Response too large')) {
    console.error('API response exceeds 100KB limit');
  } else {
    console.error('Proxy execution failed:', error.message);
  }
}
```

## Security Features

### Trusted Execution Environment (TEE)

- **Key isolation**: API keys are decrypted only within the TEE
- **Memory protection**: Decrypted keys never exist in accessible memory
- **Process isolation**: Execution is isolated from other processes
- **Audit logging**: All executions are logged for security auditing

### Access Control

- **Permission verification**: Only authorized wallets can use encrypted keys
- **Time-based access**: Sessions have configurable expiration times
- **On-chain permissions**: Access control is enforced through smart contracts
- **Revocation support**: Access can be revoked at any time

## Performance Considerations

- **Response size limit**: API responses are limited to 100KB to prevent memory issues
- **Execution timeout**: Long-running API calls may timeout within the TEE
- **Rate limiting**: Consider API rate limits when making multiple calls
- **Caching strategy**: Cache responses locally when appropriate to reduce API calls

## Notes

- The API key is never exposed outside the trusted execution environment (TEE).
- The function automatically handles authentication using the encrypted API key.
- The API response is limited to 100KB. If the response is larger, it will return a truncated response.
- Only wallets with appropriate permissions can use the encrypted API key.
- The function supports all standard HTTP methods and request configurations.
- When debug is enabled, the function will log detailed information about the authentication process and request details.
- The response is returned directly from the proxy service without modification.

## Use Cases

### AI API Integration

```typescript
// OpenAI API calls
const openAIResponse = await proxyExecute(openAIKeyId, wallet, {
  method: "POST",
  url: "https://api.openai.com/v1/completions",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: {
    model: "text-davinci-003",
    prompt: "Explain blockchain technology",
    max_tokens: 100
  }
}, config.proxyExecuteConfig);
```

### Database API Access

```typescript
// Secure database API calls
const dbResponse = await proxyExecute(dbKeyId, wallet, {
  method: "GET",
  url: "https://api.database.com/query",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "X-Database": "production"
  }
}, config.proxyExecuteConfig);
```

### Third-party Service Integration

```typescript
// Payment processor API
const paymentResponse = await proxyExecute(paymentKeyId, wallet, {
  method: "POST",
  url: "https://api.stripe.com/v1/charges",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: "amount=2000&currency=usd&source=tok_visa"
}, config.proxyExecuteConfig);
```

## See Also

- [encryptForProxy](../encryption/encryptForProxy.md) - For encrypting API keys for proxy execution
- [preProcess](../data-processing/preProcess.md) - For preparing API keys for encryption
- [init](../data-management/init.md) - For loading configuration
- [Flow Diagrams](../../flow-diagrams.md) - For visual representation of proxy execution flow

Last updated on July 11, 2025

# Keypo SDK Documentation