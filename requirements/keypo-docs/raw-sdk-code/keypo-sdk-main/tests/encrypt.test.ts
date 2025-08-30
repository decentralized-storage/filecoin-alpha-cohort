import { encrypt } from "../src/encrypt";
import { type EncryptConfig } from "../src/utils/types";
import { preProcess } from "../src/preProcess";
import * as dotenv from "dotenv";
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

// Generate random string of specified length
function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function testEncrypt() {
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

        // Generate random test data
        const testData = generateRandomString(100);
        console.log("Test data:", testData);

        // Pre-process the data
        const { dataOut, metadataOut } = await preProcess(testData, "test-data", true, {type: "file"});
        console.log("Pre-processed metadata:", metadataOut);

        // Prepare config for encrypt
        const config: EncryptConfig = {
            apiUrl: API_URL,
            validatorAddress: VALIDATOR_ADDRESS,
            registryContractAddress: REGISTRY_CONTRACT_ADDRESS,
            bundlerRpcUrl: ZERODEV_RPC_URL,
        };

        // Call encrypt function with debug mode
        const result = await encrypt(dataOut, client, metadataOut, config, true);
        console.log("Encryption result:", result);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Run the test
testEncrypt(); 