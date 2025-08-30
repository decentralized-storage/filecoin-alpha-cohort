import { type DataMetadata, type EncryptionResult, type EncryptAPIResponse } from "./utils/types";
import { type Account, type Chain, type Client, type Transport } from "viem";
import { baseSepolia } from "viem/chains";
import { getKernelClient } from "./utils/getKernelClient";
import { PermissionsRegistryAbi} from "./utils/contracts";
import { deployPermissionedData } from "./utils/deployPermissionedData";
import { mintOwnerNFT } from "./utils/mintOwnerNFT";
import { type EncryptConfig } from "./utils/types";

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function encrypt(
    dataIn: Uint8Array,
    walletClient: Client<Transport, Chain, Account>,
    metadataIn: DataMetadata,
    authorization: any,
    config: EncryptConfig,
    debug?: boolean,
  ): Promise<EncryptionResult> {
    const { apiUrl, validatorAddress, registryContractAddress, bundlerRpcUrl } = config;
    if (debug) {
        console.log("validatorAddress", validatorAddress);
        console.log("contractAddress", registryContractAddress);
        console.log("apiUrl", apiUrl);
    }

    // Always send Uint8Array as the payload
    const response = await fetch(`${apiUrl}/encryption`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/octet-stream',
        'X-Metadata': JSON.stringify(metadataIn),
      },
      body: dataIn
    });
    const data = await response.json() as EncryptAPIResponse;
    if (debug) {
        console.log("data", data);
    }
    const metadata = {
        ...metadataIn,  // Keep all the type information from preProcess
        name: data.name,
        encryptedData: data.encryptedData,
    }
    if (debug) {
        console.log("metadata", metadata);
    }
    const dataIdentifier = metadata.encryptedData.dataIdentifier;
    const kernelClient = await getKernelClient(
        walletClient,
        baseSepolia,
        bundlerRpcUrl,
        authorization,
        debug
    );
    await deployPermissionedData(
        dataIdentifier,
        JSON.stringify(metadata),
        kernelClient,   
        walletClient.account.address,
        registryContractAddress,
        validatorAddress,
        PermissionsRegistryAbi as any,
        debug
    );

    await mintOwnerNFT(
        kernelClient,
        registryContractAddress,
        dataIdentifier,
        PermissionsRegistryAbi as any,
        debug
    );

    return {
        dataCID: data.encryptedData.ipfsHash,
        dataIdentifier: data.encryptedData.dataIdentifier,
    }
}
