import { encryptForProxy } from "../src/encryptForProxy";
import { type EncryptForProxyConfig } from "../src/utils/types";
import { preProcess } from "../src/preProcess";
import * as dotenv from "dotenv";
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

async function testEncryptForProxy() {
    try {
        // Create wallet from private key in .env.development
        const privateKey = process.env.CLIENT_PK;
        if (!privateKey) {
            throw new Error("CLIENT_PK not found in .env.development");
        }
        const ALCHEMY_RPC_URL = process.env.RPC_URL;
        if (!ALCHEMY_RPC_URL) {
            throw new Error("RPC_URL not found in .env.development");
        }
        const ZERODEV_RPC_URL = process.env.ZERODEV_RPC;
        if (!ZERODEV_RPC_URL) {
            throw new Error("ZERODEV_RPC not found in .env.development");
        }
        const API_URL = process.env.CLIENT_KEYPO_API;
        if (!API_URL) {
            throw new Error("CLIENT_KEYPO_API not found in .env.development");
        }
        const VALIDATOR_ADDRESS = process.env.CLIENT_VALIDATOR_ADDRESS;
        if (!VALIDATOR_ADDRESS) {
            throw new Error("CLIENT_VALIDATOR_ADDRESS not found in .env.development");
        }
        const REGISTRY_CONTRACT_ADDRESS = process.env.CLIENT_REGISTRY_CONTRACT_ADDRESS;
        if (!REGISTRY_CONTRACT_ADDRESS) {
            throw new Error("CLIENT_REGISTRY_CONTRACT_ADDRESS not found in .env.development");
        }

        const PROXY_ADDRESS = process.env.CLIENT_PROXY_ADDRESS;
        if (!PROXY_ADDRESS) {
            throw new Error("CLIENT_PROXY_ADDRESS not found in .env.development");
        }

        const DATA_TO_ENCRYPT = process.env.DATA_TO_ENCRYPT;
        if (!DATA_TO_ENCRYPT) {
            throw new Error("DATA_TO_ENCRYPT not found in .env.development");
        }

        // Ensure private key is in correct format
        const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

        // Create viem wallet and client using Alchemy RPC
        const wallet = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
        const client = createWalletClient({
            account: wallet,
            chain: baseSepolia,
            transport: http(ZERODEV_RPC_URL)
        });

        console.log("Test wallet address:", wallet.address);

        const testData = DATA_TO_ENCRYPT;

        // Pre-process the data
        const { dataOut, metadataOut } = await preProcess(testData, "ZapperAPIKey", true);
        console.log("Pre-processed metadata:", metadataOut);

        // Prepare config for encrypt
        const config: EncryptForProxyConfig = {
            apiUrl: API_URL,
            validatorAddress: VALIDATOR_ADDRESS,
            registryContractAddress: REGISTRY_CONTRACT_ADDRESS,
            bundlerRpcUrl: ZERODEV_RPC_URL,
            proxyAddress: PROXY_ADDRESS,
        };

        // Call encrypt function with debug mode
        const result = await encryptForProxy(dataOut, client, metadataOut, config, true);
        console.log("Encryption result:", result);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Run the test
testEncryptForProxy(); 