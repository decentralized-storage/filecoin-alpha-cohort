import { 
  DecryptConfig, 
  DeleteConfig, 
  EncryptConfig, 
  EncryptForProxyConfig, 
  ProxyExecuteConfig, 
  ShareConfig 
} from './utils/types';
import { 
  KernelVersionToAddressesMap, 
  KERNEL_V3_3 
} from "@zerodev/sdk/constants";

interface KeypoConstants {
  version: string;
  RegistryContractAddress: string;
  DefaultValidationContractAddress: string;
  DefaultLitActionCID: string;
  BundlerRpcUrl: string;
  Chain: string;
  endpoints: {
    encryption: string;
    decryption: string;
    encryptForProxy: string;
    proxy: string;
    graph: string;
    utils: string;
  };
}

export async function init(apiUrl: string): Promise<{
  kernelAddress: string;
  decryptConfig: DecryptConfig;
  deleteConfig: DeleteConfig;
  encryptConfig: EncryptConfig;
  encryptForProxyConfig: EncryptForProxyConfig;
  proxyExecuteConfig: ProxyExecuteConfig;
  shareConfig: ShareConfig;
}> {
  try {
    const response = await fetch(`${apiUrl}/constants`);
    if (!response.ok) {
      throw new Error(`Failed to fetch constants: ${response.status} ${response.statusText}`);
    }
    
    const constants: KeypoConstants = await response.json();
    
    // Set expiration to 1 hour from now
    const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const kernelVersion = KERNEL_V3_3;
    const kernelAddresses = KernelVersionToAddressesMap[kernelVersion];
    const accountImplementationAddress = kernelAddresses.accountImplementationAddress;

    
    return {
      kernelAddress: accountImplementationAddress,
      decryptConfig: {
        registryContractAddress: constants.RegistryContractAddress,
        chain: constants.Chain,
        expiration: expiration,
        apiUrl: apiUrl,
      },
      deleteConfig: {
        permissionsRegistryContractAddress: constants.RegistryContractAddress,
        bundlerRpcUrl: constants.BundlerRpcUrl,
      },
      encryptConfig: {
        apiUrl: apiUrl,
        validatorAddress: constants.DefaultValidationContractAddress,
        registryContractAddress: constants.RegistryContractAddress,
        bundlerRpcUrl: constants.BundlerRpcUrl,
      },
      encryptForProxyConfig: {
        apiUrl: apiUrl,
        validatorAddress: constants.DefaultValidationContractAddress,
        registryContractAddress: constants.RegistryContractAddress,
        bundlerRpcUrl: constants.BundlerRpcUrl,
        proxyAddress: constants.DefaultLitActionCID, // Using DefaultLitActionCID as proxyAddress
      },
      proxyExecuteConfig: {
        chain: constants.Chain,
        apiUrl: apiUrl,
        expiration: expiration,
        permissionsRegistryContractAddress: constants.RegistryContractAddress,
      },
      shareConfig: {
        permissionsRegistryContractAddress: constants.RegistryContractAddress,
        bundlerRpcUrl: constants.BundlerRpcUrl,
      },
    };
  } catch (error) {
    throw new Error(`Failed to initialize Keypo SDK: ${error instanceof Error ? error.message : String(error)}`);
  }
} 