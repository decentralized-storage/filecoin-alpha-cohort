# Key Concepts

Understanding these core concepts will help you effectively use the Keypo SDK for your encryption and data management needs.

## Data Identifiers

- Each piece of encrypted data has a unique `dataIdentifier`, which is used for retrieval and decryption.
- Human-readable names are stored in metadata, they are not required to be unique.
- Use [list](functions/data-management/list.md), [getDataInfo](functions/data-management/getDataInfo.md) or [search](functions/data-management/search.md) to retrieve dataIdentifier.

## Access Control

- Users who encrypted data have full, self-custody control over the data.
- Access controls are mediated by EVM smart contracts.
- Use [share](functions/data-management/share.md) to update access conditions in place on previously encrypted data, without requiring re-encryption.

## PreProcess and PostProcess

- It's required to run [preProcess](functions/data-processing/preProcess.md) on your data before encrypting it, and run [postProcess](functions/data-processing/postProcess.md) on your data after decrypting it.
- [preProcess](functions/data-processing/preProcess.md) converts your data into a Uint8array for efficient encryption and generates necessary metadata for reconstructing the data after decryption.
- [Decrypt](functions/data-access/decrypt.md) produces a Uint8array and metadata for [postProcess](functions/data-processing/postProcess.md) to reconstruct your data in its original format.

## Encrypt/Decrypt vs EncryptForProxy/ProxyExecute

- Use [encrypt](functions/encryption/encrypt.md)/[decrypt](functions/data-access/decrypt.md) when you want authorized users to be able to see the unencrypted data.
- Use [encryptForProxy](functions/encryption/encryptForProxy.md)/[proxyExecute](functions/data-access/proxyExecute.md) when you want authorized users to be able to use the unencrypted data without being able to see it.
- Currently this feature only supports encrypting API keys: API calls can be made without exposure of the unencrypted key.

## Wallet Management

- Keypo is compatible with EOAs and the following embedded wallets: Privy, Turnkey and Dynamic.
- Keypo is not currently compatible with injected browser wallets like Metamask, Coinbase Wallet or Phantom. If you are interested in support for injected wallets, please reach out: hello@keypo.io.
- [Encrypt](functions/encryption/encrypt.md) and [EncryptForProxy](functions/encryption/encryptForProxy.md) requires the wallet to be a Viem wallet client object. [Decrypt](functions/data-access/decrypt.md) and [ProxyExecute](functions/data-access/proxyExecute.md) requires the wallet to be an Ethers v5 wallet. All the compatible wallet clients (EOAs and embedded wallets) can be represented as a Viem wallet client or Ethers v5 wallet interchangeably.
- [Encrypt](functions/encryption/encrypt.md) and [EncryptForProxy](functions/encryption/encryptForProxy.md) requires a signed authorization from the wallet to be used as an EIP7702 smart wallet in order to provide a gasless experience. For more information about signed authorization, please consult [this guide](https://docs.zerodev.app/smart-accounts/signers/eip-7702) for EOAs and [this guide](https://docs.zerodev.app/smart-accounts/signers/eip-7702) for embedded wallets.

Last updated on July 2, 2025