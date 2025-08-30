# Getting Started

Create a new project with npm (or whatever package manager you use):

```bash
mkdir keypo
cd keypo
npm init -y
touch .env
```

Install the keypo sdk:

```bash
npm install @keypo/typescript-sdk
```

Add an RPC URL and the Keypo API URL to your .env file (you can use https://sepolia.base.org as an RPC URL for testing, it's free):

```env
API_URL=https://api.keypo.io
RPC_URL=https://sepolia.base.org
```

Create a script index.ts with the following code:

```typescript
import { init, preProcess, encrypt, decrypt, postProcess } from "@keypo/typescript-sdk"
import { http, createWalletClient } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function end2endDemo() {
  const API_URL = process.env.CLIENT_KEYPO_API;
  const RPC_URL = process.env.CLIENT_RPC_URL;

  if (!API_URL || !RPC_URL) {
    throw new Error("API_URL or RPC_URL is not set");
  }

  // Create a new wallet and sign authorization for using as a smart account
  const keypo = await init(API_URL);
  const privateKey = generatePrivateKey()
  const signer = privateKeyToAccount(privateKey)
  const encryptWallet = createWalletClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
    account: signer,
  });
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const decryptWallet = new ethers.Wallet(privateKey as string, provider);
  const authorization = await encryptWallet.signAuthorization({
    contractAddress: keypo.kernelAddress as `0x${string}`, // Kernel V3.3 implementation
  });

  // Preprocess data for encryption
  const data = "Hello World";
  const { dataOut, metadataOut } = await preProcess(data, "test string");
  
  // Encrypt data
  const { dataCID, dataIdentifier } = await encrypt(dataOut, encryptWallet, metadataOut, authorization);

  // Decrypt data
  const { decryptedData, metadata } = await decrypt(dataIdentifier, decryptWallet, authorization);

  // Postprocess data
  const processedData = await postProcess(decryptedData, metadata);

  return processedData;
}

async function main() {
  const processedData = await end2endDemo();
  console.log("DECRYPTED OUTPUT: ", processedData);
}

main();
```

Run it:

```bash
npx tsx index.ts
```

You should see the following output:

```
lit-js-sdk:constants:errors deprecated LitErrorKind is deprecated and will be removed
lit-js-sdk:constants:constants deprecated LogLevel is deprecated and will be removed
Storage key "lit-session-key" is missing. Not a problem. Continue...
Storage key "lit-wallet-sig" is missing. Not a problem. Continue...
Unable to store walletSig in local storage. Not a problem. Continue...
DECRYPTED OUTPUT: Hello World
```

Congrats – you just encrypted and decrypted data using Keypo!

Now that you've gotten your hands dirty, check out:

- [Functions](Functions) for detailed information on how to run each function in the SDK.
- [Key Concepts](Key_Concepts) to learn how encryption, access control and decryption is handled by Keypo.
- [Flow Diagrams](Flow_Diagrams) for diagrams that visualize the interactions between different components of the Keypo system.
- [Glossary](Glossary) for a comprehensive list of all interfaces and types used throughout the SDK.

---

*Last updated on July 1, 2025*

# Keypo SDK Documentation