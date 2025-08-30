import { Client, Transport, Chain, Account, encodeFunctionData } from "viem";
import { getKernelClient } from "./utils/getKernelClient";
import { PermissionsRegistryAbi} from "./utils/contracts";
import { baseSepolia } from "viem/chains";
import { type ShareConfig } from "./utils/types";

export async function shareData(
    dataIdentifier: string,
    walletClient: Client<Transport, Chain, Account>,
    recipientAddresses: string[],
    config: ShareConfig,
    authorization: any,
    debug?: boolean
) {
    const { permissionsRegistryContractAddress, bundlerRpcUrl } = config;

    const kernelClient = await getKernelClient(
        walletClient,
        baseSepolia,
        bundlerRpcUrl,
        authorization,
        debug
    );

    const tx = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls([{
            to: permissionsRegistryContractAddress as `0x${string}`,
            data: encodeFunctionData({
                abi: PermissionsRegistryAbi,
                functionName: "mintFromPermissionedFileForOwner",
                args: [dataIdentifier, recipientAddresses]
            }),
        }]),
    });

    if (debug) {
        console.log("[DEBUG] tx:", tx);
    }

    const { receipt } = await kernelClient.waitForUserOperationReceipt({
        hash: tx,
    });

    if (debug) {
        console.log("[DEBUG] receipt:", receipt);
    }

    return;
}