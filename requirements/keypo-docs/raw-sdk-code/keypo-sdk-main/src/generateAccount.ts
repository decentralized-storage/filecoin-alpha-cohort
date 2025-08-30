import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
 
export function generateAccount() {

const privateKey = generatePrivateKey();

const publicKey = privateKeyToAccount(privateKey);

return {
    privateKey,
    publicKey
}
}