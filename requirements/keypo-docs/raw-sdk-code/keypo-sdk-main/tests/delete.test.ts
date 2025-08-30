import { deleteData } from "../src/delete";
import * as dotenv from "dotenv";
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Load environment variables from .env.development
dotenv.config({ path: '.env.development' });

async function testDelete() {
    try {
        // Create wallet from private key in .env.development
        const privateKey = process.env.CLIENT_PK;
        if (!privateKey) {
            throw new Error("CLIENT_PK not found in .env.development");
        }
        const ZERODEV_RPC_URL = process.env.ZERODEV_RPC;
        if (!ZERODEV_RPC_URL) {
            throw new Error("ZERODEV_RPC not found in .env.development");
        }
        const REGISTRY_CONTRACT_ADDRESS = process.env.CLIENT_REGISTRY_CONTRACT_ADDRESS;
        if (!REGISTRY_CONTRACT_ADDRESS) {
            throw new Error("CLIENT_REGISTRY_CONTRACT_ADDRESS not found in .env.development");
        }

        const DATA_IDENTIFIER = process.env.DATA_IDENTIFIER;
        if (!DATA_IDENTIFIER) {
            throw new Error("DATA_IDENTIFIER not found in .env.development");
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

        // Use a hardcoded dataIdentifier for testing
        const dataIdentifier = DATA_IDENTIFIER;
        console.log("Test dataIdentifier:", dataIdentifier);

        // Call delete function with debug mode
        await deleteData(
            dataIdentifier,
            client,
            {
                permissionsRegistryContractAddress: REGISTRY_CONTRACT_ADDRESS,
                bundlerRpcUrl: ZERODEV_RPC_URL,
            },
            true
        );
        console.log("Delete operation completed successfully");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Run the test
testDelete();
