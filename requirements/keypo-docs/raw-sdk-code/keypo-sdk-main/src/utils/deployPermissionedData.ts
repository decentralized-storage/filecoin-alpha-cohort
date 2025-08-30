import { type ContractInterface } from "ethers";
import { encodeFunctionData } from "viem";

/**
 *  Deploy file and write permissions to the PermissionsRegistry
 */
export const deployPermissionedData = async (
  fileIdentifier: string,
  fileMetaData: string,
  kernelClient: any, // Using any for now since we need the kernel client's methods
  signerAddress: string,
  contractAddress: string,
  validatorAddress: string,
  abi: ContractInterface,
  debug?: boolean,
) => {
  const parameters = [
    {
      permissionType: 0,
      permissionAddress: signerAddress,
      tokenQuantity: 1,
      timeLimitBlockNumber: 0,
      operator: 0,
    },
  ];

  const txData = encodeFunctionData({
    abi: abi as any,
    functionName: "deployPermissionedFile",
    args: [fileIdentifier, fileMetaData, validatorAddress, signerAddress, parameters],
  });

  if (debug) {
    console.log("[DEBUG] txData:", txData);
  }

  try {
    // Prepare the user operation with explicit gas settings
    const userOperation = {
      callData: await kernelClient.account.encodeCalls([{
        to: contractAddress as `0x${string}`,
        value: BigInt(0),
        data: txData,
      }]),
    };

    if (debug) {
      console.log("[DEBUG] Sending user operation with callData:", userOperation.callData);
    }

    const userOpHash = await kernelClient.sendUserOperation(userOperation);

    if (debug) {
      console.log("[DEBUG] userOpHash:", userOpHash);
    }

    const { receipt } = await kernelClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    if (debug) {
      console.log("[DEBUG] receipt:", receipt);
    }

    return receipt.transactionHash;
  } catch (error: any) {
    console.error("Error sending user operation:", error);
    
    // Log more detailed error information
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    
    // Check for specific error types
    if (error.message && error.message.includes("UserOperation reverted during simulation")) {
      console.error("UserOperation simulation failed - this could be due to:");
      console.error("1. Insufficient gas estimation");
      console.error("2. Contract state issues");
      console.error("3. Network congestion");
      console.error("4. Invalid parameters");
    }
    
    throw error;
  }
};