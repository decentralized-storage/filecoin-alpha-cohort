// tests/decrypt.test.ts

import { decrypt } from "../src/decrypt";
import { type DecryptConfig } from "../src/utils/types";
import { Wallet, JsonRpcProvider } from "ethers";
import * as dotenv from "dotenv";
import { postProcess } from "../src/postProcess";

// Load environment variables
dotenv.config({ path: ".env.development" });

async function testDecrypt() {
  try {
    const privateKey = process.env.CLIENT_PK;
    if (!privateKey) throw new Error("CLIENT_PK not found in .env.development");
    const ALCHEMY_RPC_URL = process.env.RPC_URL;
    if (!ALCHEMY_RPC_URL) {
      throw new Error("RPC_URL not found in .env.development");
    }
    const REGISTRY_CONTRACT_ADDRESS = process.env.CLIENT_REGISTRY_CONTRACT_ADDRESS;
    if (!REGISTRY_CONTRACT_ADDRESS) {
      throw new Error("CLIENT_REGISTRY_CONTRACT_ADDRESS not found in .env.development");
    }
    const IPFS_BASE_URL = process.env.IPFS_BASE_URL;
    if (!IPFS_BASE_URL) {
      throw new Error("IPFS_BASE_URL not found in .env.development");
    }

    const CHAIN = process.env.CLIENT_CHAIN;
    if (!CHAIN) {
      throw new Error("CLIENT_CHAIN not found in .env.development");
    }

    const DATA_IDENTIFIER = process.env.DATA_IDENTIFIER;
    if (!DATA_IDENTIFIER) {
      throw new Error("DATA_IDENTIFIER not found in .env.development");
    }

    const ONE_HOUR_FROM_NOW = new Date(
      Date.now() + 1000 * 60 * 60,
    ).toISOString();

    // Ensure private key is in correct format
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    // Debug: Log all key variables
    console.log("[DEBUG] ALCHEMY_RPC_URL:", ALCHEMY_RPC_URL);
    console.log("[DEBUG] REGISTRY_CONTRACT_ADDRESS:", REGISTRY_CONTRACT_ADDRESS);
    console.log("[DEBUG] IPFS_BASE_URL:", IPFS_BASE_URL);
    console.log("[DEBUG] CHAIN:", CHAIN);
    console.log("[DEBUG] formattedPrivateKey:", formattedPrivateKey);

    // Create ethers wallet and provider
    const provider = new JsonRpcProvider(ALCHEMY_RPC_URL);
    const wallet = new Wallet(formattedPrivateKey, provider);
    console.log("[DEBUG] Wallet address:", wallet.address);

    const dataIdentifier = DATA_IDENTIFIER;
    console.log("[DEBUG] dataIdentifier:", dataIdentifier);
    const config: DecryptConfig = {
      registryContractAddress: REGISTRY_CONTRACT_ADDRESS,
      chain: CHAIN,
      apiUrl: "http://localhost:3000",
      expiration: ONE_HOUR_FROM_NOW,
    };
    console.log("[DEBUG] DecryptConfig:", config);
    const { decryptedData, metadata } = await decrypt(dataIdentifier, wallet, config, true);

    console.log("[DEBUG] Decryption result:", { decryptedData, metadata });

    // Use postProcess to restore the original data format
    const originalData = postProcess(decryptedData, metadata, true);
    console.log("[DEBUG] Original data after postProcess:", originalData);

    // Verify the data type matches the metadata
    console.log("[DEBUG] Data type verification:");
    console.log("  - Metadata type:", metadata.type);
    console.log("  - Metadata subtype:", metadata.subtype);
    console.log("  - Actual data type:", typeof originalData);
    
    // More comprehensive type checking
    let isCorrectType = false;
    switch (metadata.type) {
      case 'string':
        isCorrectType = typeof originalData === 'string';
        break;
      case 'number':
        isCorrectType = typeof originalData === 'number';
        break;
      case 'boolean':
        isCorrectType = typeof originalData === 'boolean';
        break;
      case 'object':
        isCorrectType = typeof originalData === 'object' && originalData !== null;
        break;
      case 'file':
        isCorrectType = originalData instanceof File;
        break;
      case 'buffer':
        isCorrectType = originalData instanceof Buffer;
        break;
      case 'arraybuffer':
        isCorrectType = originalData instanceof ArrayBuffer;
        break;
      case 'typedarray':
        isCorrectType = originalData instanceof Uint8Array;
        break;
      case 'null':
        isCorrectType = originalData === null;
        break;
      default:
        isCorrectType = false;
    }
    console.log("  - Is instance of expected type:", isCorrectType);

  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testDecrypt();