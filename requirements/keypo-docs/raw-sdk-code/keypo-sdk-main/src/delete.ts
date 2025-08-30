import { Client, Transport, Chain, Account, encodeFunctionData } from "viem";
import { type DeleteConfig } from "./utils/types";
import { getKernelClient } from "./utils/getKernelClient";
import { PermissionsRegistryAbi} from "./utils/contracts";
import { baseSepolia } from "viem/chains";

export async function deleteData(
    dataIdentifier: string,
    walletClient: Client<Transport, Chain, Account>,
    authorization: any,
    config: DeleteConfig,
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
                functionName: "deletePermissionedFile",
                args: [dataIdentifier]
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