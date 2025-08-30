import { Signer } from "ethers";
import type { Account, Chain, Client, Transport } from 'viem';
import { authenticateLitSession } from "./utils/authenticateLitSession";
import { type ProxyExecuteConfig } from "./utils/types";
import { clientToSigner } from "./utils/ethersAdapter";

export async function proxyExecute(
    dataIdentifier: string,
    wallet: Client<Transport, Chain, Account>,
    request: {
      method: string,
      url: string,
      headers?: Record<string, string>,
      body?: any
    },
    config: ProxyExecuteConfig,
    debug?: boolean
  ): Promise<any> {
    if (debug) {
      console.log("dataIdentifier", dataIdentifier);
      console.log("wallet", wallet);
      console.log("request", request);
      console.log("config", config);
    }

    try {
      // Convert viem client to ethers signer
      const signer = clientToSigner(wallet) as Signer;

      // authenticate lit session
      const { sessionSigs, authSig, litNodeClient, dataMetadata } = await authenticateLitSession(
        signer,
        config.chain,
        config.expiration,
        config.permissionsRegistryContractAddress,
        dataIdentifier,
        config.apiUrl,
        debug,
      );
      if (debug) {
        console.log("sessionSigs", sessionSigs);
        console.log("authSig", authSig);
        console.log("litNodeClient", litNodeClient);
        console.log("dataMetadata", dataMetadata);
        console.log("request", request);
      }

      // prepare the request, which should include sessionSigs, authsig, evmConditions, dataMetadata, and the request body
      const preparedRequest = {
        sessionSigs,
        authSig,
        dataMetadata: JSON.stringify(dataMetadata),
        request: JSON.stringify(request),
      };

      // make the request to the proxy
      if (debug) {
        console.log("Making request to proxy at:", `${config.apiUrl}/proxy`);
        console.log("Request body:", JSON.stringify(preparedRequest, null, 2));
      }
      
      const response = await fetch(`${config.apiUrl}/proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preparedRequest),
      });
      
      if (debug) {
        console.log("Proxy response status:", response.status);
        console.log("Proxy response headers:", response.headers);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Proxy API error:", response.status, errorText);
        throw new Error(`Proxy API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      if (debug) {
        console.log("Proxy API response data:", data);
      }
      return data.Response;
    } catch (error) {
      console.error("Error in proxyExecute:", error);
      throw error;
    }
}