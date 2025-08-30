import { Wallet, JsonRpcProvider } from "ethers";
import * as dotenv from "dotenv";
import { proxyExecute } from "keypo-sdk";

// Load environment variables
dotenv.config({ path: ".env.development" });

async function testProxyExecute() {
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
    const API_URL = process.env.CLIENT_KEYPO_API;
    if (!API_URL) {
      throw new Error("CLIENT_KEYPO_API not found in .env.development");
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
    console.log("[DEBUG] ONE_HOUR_FROM_NOW:", ONE_HOUR_FROM_NOW);

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

    // Place dataidentifier corresponding to data you encrypted for proxy here
    const dataIdentifier = DATA_IDENTIFIER;
    console.log("[DEBUG] dataIdentifier:", dataIdentifier);
    const config = {
      chain: CHAIN,
      expiration: ONE_HOUR_FROM_NOW,
      permissionsRegistryContractAddress: REGISTRY_CONTRACT_ADDRESS,
      apiUrl: API_URL,
    };
    
    // Zapper Example
    const response = await proxyExecute(
      dataIdentifier,
      wallet,
      {
        method: "POST",
        url: "https://public.zapper.xyz/graphql",
        headers: {
          "Content-Type": "application/json",
          "x-zapper-api-key": "${apiKey}"  // API key will be injected here
        },
        body: {
          query: `
            query PortfolioV2Query($addresses: [Address!]!) {
              portfolioV2(addresses: $addresses) {
                tokenBalances {
                  totalBalanceUSD
                  byToken(first: 10) {
                    edges {
                      node {
                        symbol
                        balance
                        balanceUSD
                        imgUrlV2
                        network {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: {
            addresses: ['0x3d280fde2ddb59323c891cf30995e1862510342f']
          }
        }
      },
      config,
      true  // enable debug logs
    )

    // OpenAI Example
    /*const response = await proxyExecute(
      dataIdentifier,
      wallet,
      {
        method: "POST",
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${apiKey}"  // API key will be injected here
        },
        body: {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Write one sentence about a cat" }]
        }
      },
      config,
      true  // enable debug logs
    );*/

    console.log("response", response);

  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testProxyExecute();