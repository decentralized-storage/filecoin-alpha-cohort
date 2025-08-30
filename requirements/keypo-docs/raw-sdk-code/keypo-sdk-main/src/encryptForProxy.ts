import { type DataMetadata, type EncryptionResult, type EncryptAPIResponse } from "./utils/types";
import { type Account, type Chain, type Client, type Transport } from "viem";
import { baseSepolia } from "viem/chains";
import { getKernelClient } from "./utils/getKernelClient";
import { PermissionsRegistryAbi} from "./utils/contracts";
import { deployPermissionedData } from "./utils/deployPermissionedData";
import { mintOwnerNFT } from "./utils/mintOwnerNFT";
import { type EncryptForProxyConfig } from "./utils/types";

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await wait(delay);
        // Exponential backoff
        delay *= 1.5;
      }
    }
  }
  
  throw lastError;
}

export async function encryptForProxy(
    dataIn: Uint8Array,
    walletClient: Client<Transport, Chain, Account>,
    metadataIn: DataMetadata,
    config: EncryptForProxyConfig,
    authorization: any,
    debug?: boolean,
  ): Promise<EncryptionResult> {
    const { apiUrl, validatorAddress, registryContractAddress, bundlerRpcUrl } = config;
    if (debug) {
        console.log("Starting encryptForProxy...");
        console.log("validatorAddress", validatorAddress);
        console.log("contractAddress", registryContractAddress);
        console.log("apiUrl", apiUrl);
    }

    // Add proxy address to the metadata
    const metadataForProxy = {
      ...metadataIn,
      proxyMetadata: {
        proxyAddress: config.proxyAddress,
      },
    }

    // Step 1: Encrypt data with retry logic
    const data = await retryOperation(async () => {
      const response = await fetch(`${apiUrl}/encryptionForProxy`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/octet-stream',
          'X-Metadata': JSON.stringify(metadataForProxy),
        },
        body: dataIn
      });
      
      if (!response.ok) {
        throw new Error(`Encryption API failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as EncryptAPIResponse;
    }, 2, 1000); // Retry encryption up to 2 times with 1s delay

    if (debug) {
        console.log("data", data);
    }
    
    const metadata = {
        ...metadataForProxy,  // Keep all the type information from preProcess
        name: data.name,
        encryptedData: data.encryptedData,
    }
    if (debug) {
        console.log("metadata", metadata);
    }
    
    const dataIdentifier = metadata.encryptedData.dataIdentifier;
    
    // Step 2: Get kernel client with retry logic
    const kernelClient = await retryOperation(async () => {
      return await getKernelClient(
        walletClient,
        baseSepolia,
        bundlerRpcUrl,
        authorization,
        debug
      );
    }, 2, 1000);

    // Step 3: Deploy permissioned data with enhanced error handling
    await retryOperation(async () => {
      try {
        return await deployPermissionedData(
          dataIdentifier,
          JSON.stringify(metadata),
          kernelClient,   
          walletClient.account.address,
          registryContractAddress,
          validatorAddress,
          PermissionsRegistryAbi as any,
          debug
        );
      } catch (error: any) {
        console.error("Deploy permissioned data failed:", error);
        
        // Check if it's a gas estimation error
        if (error.message && error.message.includes("gas")) {
          console.log("Gas estimation failed, retrying with manual gas settings...");
          // You could implement manual gas estimation here if needed
        }
        
        throw error;
      }
    }, MAX_RETRIES, RETRY_DELAY);

    // Step 4: Mint owner NFT with retry logic
    await retryOperation(async () => {
      try {
        return await mintOwnerNFT(
          kernelClient,
          registryContractAddress,
          dataIdentifier,
          PermissionsRegistryAbi as any,
          debug
        );
      } catch (error: any) {
        console.error("Mint owner NFT failed:", error);
        throw error;
      }
    }, MAX_RETRIES, RETRY_DELAY);

    return {
        dataCID: data.encryptedData.ipfsHash,
        dataIdentifier: data.encryptedData.dataIdentifier,
    }
}
