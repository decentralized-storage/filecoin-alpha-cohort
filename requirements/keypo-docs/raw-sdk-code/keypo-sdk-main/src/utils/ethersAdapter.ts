import { providers, Signer } from 'ethers'
import type { Account, Chain, Client, Transport } from 'viem'

/**
 * Custom ethers signer that wraps a viem wallet client
 */
class ViemSigner extends Signer {
  private client: Client<Transport, Chain, Account>
  public provider: providers.Provider

  constructor(client: Client<Transport, Chain, Account>, provider: providers.Provider) {
    super()
    this.client = client
    this.provider = provider
  }

  async getAddress(): Promise<string> {
    return this.client.account.address
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    console.log("[DEBUG] ViemSigner.signMessage called with:", { message, type: typeof message })
    
    let messageHex: string
    if (typeof message === 'string') {
      // Convert string to hex
      messageHex = `0x${Buffer.from(message, 'utf8').toString('hex')}`
    } else {
      // Convert Uint8Array to hex
      messageHex = `0x${Buffer.from(message).toString('hex')}`
    }
    
    console.log("[DEBUG] ViemSigner.signMessage - messageHex:", messageHex)
    const signature = await (this.client as any).signMessage({
      message: { raw: messageHex as `0x${string}` },
      account: this.client.account.address
    })
    console.log("[DEBUG] ViemSigner.signMessage - signature:", signature)
    return signature
  }

  async signTransaction(transaction: any): Promise<string> {
    // This would need to be implemented based on your specific needs
    throw new Error('signTransaction not implemented')
  }

  connect(provider: providers.Provider): Signer {
    return new ViemSigner(this.client, provider)
  }
}

/**
 * Custom provider that wraps viem's transport for ethers compatibility
 */
class ViemProvider extends providers.JsonRpcProvider {
  private client: Client<Transport, Chain, Account>

  constructor(client: Client<Transport, Chain, Account>, network: any) {
    super('', network)
    this.client = client
  }

  async send(method: string, params: any[]): Promise<any> {
    // Handle signing locally instead of through RPC
    if (method === 'personal_sign') {
      const [message, address] = params
      console.log("[DEBUG] ViemProvider.send - personal_sign called with:", { message, address })
      const signature = await (this.client as any).signMessage({
        message: { raw: message as `0x${string}` },
        account: address as `0x${string}`
      })
      console.log("[DEBUG] ViemProvider.send - personal_sign signature:", signature)
      return signature
    }
    
    // For other RPC calls, use the transport
    const requestFn = (this.client.transport as any).request || (this.client.transport as any).transport?.request
    if (!requestFn) {
      throw new Error('Unable to access transport request function')
    }
    return await requestFn({ method, params })
  }
}

/**
 * Converts a Viem Client to an ethers.js Signer
 * @param client - The viem wallet client
 * @returns An ethers v5 signer
 */
export function clientToSigner(client: Client<Transport, Chain, Account>) {
  console.log("[DEBUG] clientToSigner called with client:", { 
    account: client.account?.address,
    chain: client.chain?.name 
  })
  
  const { account, chain } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  
  const provider = new ViemProvider(client, network)
  const signer = new ViemSigner(client, provider)
  
  console.log("[DEBUG] clientToSigner created ViemSigner:", signer)
  return signer
}

/**
 * Converts a Viem Client to an ethers.js Provider
 * @param client - The viem client
 * @returns An ethers v5 provider
 */
export function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network),
      ),
    )
  return new providers.JsonRpcProvider(transport.url, network)
} 