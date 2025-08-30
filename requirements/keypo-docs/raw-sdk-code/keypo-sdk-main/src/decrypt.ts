import { type Signer } from "ethers";
import type { Account, Chain, Client, Transport } from 'viem';
import { type DecryptConfig, type DataMetadata, type DecryptAPIResponse } from "./utils/types";
import { authenticateLitSession } from "./utils/authenticateLitSession";
import { clientToSigner } from "./utils/ethersAdapter";

export async function decrypt(
    dataIdentifier: string,
    wallet: Client<Transport, Chain, Account>,
    config: DecryptConfig,
    debug?: boolean
  ): Promise<{ decryptedData: Uint8Array, metadata: DataMetadata }> {
    if (debug) {
        console.log("[DEBUG] decrypt() called with:");
        console.log("  dataIdentifier:", dataIdentifier);
        console.log("  wallet.address:", wallet.account?.address);
        console.log("  config:", config);
    }

    // Convert viem client to ethers signer
    const signer = clientToSigner(wallet) as Signer;

    // Authenticate lit session with ethers wallet
    if (debug) {
        console.log("[DEBUG] Calling authenticateLitSession...");
    }
    const { sessionSigs, dataMetadata } = await authenticateLitSession(
        signer,
        config.chain,
        config.expiration,
        config.registryContractAddress,
        dataIdentifier,
        config.apiUrl,
        debug,
    );

    if (debug) {
        console.log("[DEBUG] authenticateLitSession result:", {
            sessionSigs,
            dataMetadata,
        });
        console.log("dataMetadata", dataMetadata);
    }

    // Call the API endpoint to handle decryption
    const response = await fetch(`${config.apiUrl}/decryption`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            dataIdentifier,
            sessionSigs,
            dataMetadata: JSON.stringify(dataMetadata),
        })
    });

    if (!response.ok) {
        throw new Error(`Decryption failed: ${response.statusText}`);
    }

    const result = await response.json() as DecryptAPIResponse;
    
    if (debug) {
        console.log("[DEBUG] API response:", result);
    }

    // Convert the decrypted data from a plain object to a Uint8Array
    const decryptedDataArray = new Uint8Array(Object.values(result.decryptedData));

    return {
        decryptedData: decryptedDataArray,
        metadata: result.metadata,
    };
}
