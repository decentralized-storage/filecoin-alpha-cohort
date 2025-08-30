/* globals describe it beforeEach */

/**
 * Tests for PaymentsService class
 */

import { assert } from 'chai'
import { ethers } from 'ethers'
import { PaymentsService } from '../payments/index.js'
import { TOKENS } from '../utils/index.js'
import { createMockProvider, createMockSigner } from './test-utils.js'

describe('PaymentsService', () => {
  let mockProvider: ethers.Provider
  let mockSigner: ethers.Signer
  let payments: PaymentsService

  beforeEach(() => {
    mockProvider = createMockProvider()
    mockSigner = createMockSigner('0x1234567890123456789012345678901234567890', mockProvider)
    payments = new PaymentsService(mockProvider, mockSigner, 'calibration', false)
  })

  describe('Instantiation', () => {
    it('should create instance with required parameters', () => {
      assert.exists(payments)
      assert.isFunction(payments.walletBalance)
      assert.isFunction(payments.balance)
      assert.isFunction(payments.deposit)
      assert.isFunction(payments.withdraw)
      assert.isFunction(payments.decimals)
    })
  })

  describe('walletBalance', () => {
    it('should return FIL balance when no token specified', async () => {
      const balance = await payments.walletBalance()
      assert.equal(balance.toString(), ethers.parseEther('100').toString())
    })

    it('should return FIL balance when FIL token specified', async () => {
      const balance = await payments.walletBalance(TOKENS.FIL)
      assert.equal(balance.toString(), ethers.parseEther('100').toString())
    })

    it('should return USDFC balance when USDFC specified', async () => {
      const balance = await payments.walletBalance(TOKENS.USDFC)
      assert.equal(balance.toString(), ethers.parseUnits('1000', 18).toString())
    })

    it('should throw for unsupported token', async () => {
      try {
        await payments.walletBalance('UNKNOWN' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
      }
    })
  })

  describe('balance', () => {
    it('should return USDFC balance from payments contract', async () => {
      const balance = await payments.balance()
      // Should return available funds (500 USDFC - 0 locked = 500)
      assert.equal(balance.toString(), ethers.parseUnits('500', 18).toString())
    })

    it('should throw for non-USDFC token', async () => {
      try {
        await payments.balance('FIL' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
        assert.include(error.message, 'USDFC')
      }
    })
  })

  describe('decimals', () => {
    it('should return 18 for USDFC', () => {
      assert.equal(payments.decimals(), 18)
    })

    it('should return 18 for any token', () => {
      assert.equal(payments.decimals('FIL' as any), 18)
    })
  })

  describe('Token operations', () => {
    it('should check allowance for USDFC', async () => {
      const paymentsAddress = '0x0E690D3e60B0576D01352AB03b258115eb84A047'
      const allowance = await payments.allowance(TOKENS.USDFC, paymentsAddress)
      assert.equal(allowance.toString(), '0')
    })

    it('should approve token spending', async () => {
      const paymentsAddress = '0x0E690D3e60B0576D01352AB03b258115eb84A047'
      const amount = ethers.parseUnits('100', 18)
      const tx = await payments.approve(TOKENS.USDFC, paymentsAddress, amount)
      assert.exists(tx)
      assert.exists(tx.hash)
      assert.typeOf(tx.hash, 'string')
    })

    it('should throw for unsupported token in allowance', async () => {
      try {
        await payments.allowance('FIL' as any, '0x123')
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
      }
    })

    it('should throw for unsupported token in approve', async () => {
      try {
        await payments.approve('FIL' as any, '0x123', 100n)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
      }
    })
  })

  describe('Service approvals', () => {
    const serviceAddress = '0x394feCa6bCB84502d93c0c5C03c620ba8897e8f4'

    it('should approve service as operator', async () => {
      const rateAllowance = ethers.parseUnits('10', 18) // 10 USDFC per epoch
      const lockupAllowance = ethers.parseUnits('1000', 18) // 1000 USDFC lockup

      const tx = await payments.approveService(
        serviceAddress,
        rateAllowance,
        lockupAllowance
      )
      assert.exists(tx)
      assert.exists(tx.hash)
      assert.typeOf(tx.hash, 'string')
    })

    it('should revoke service operator approval', async () => {
      const tx = await payments.revokeService(serviceAddress)
      assert.exists(tx)
      assert.exists(tx.hash)
      assert.typeOf(tx.hash, 'string')
    })

    it('should check service approval status', async () => {
      const approval = await payments.serviceApproval(serviceAddress)
      assert.exists(approval)
      assert.exists(approval.isApproved)
      assert.exists(approval.rateAllowance)
      assert.exists(approval.rateUsed)
      assert.exists(approval.lockupAllowance)
      assert.exists(approval.lockupUsed)
    })

    it('should throw for unsupported token in service operations', async () => {
      try {
        await payments.approveService(serviceAddress, 100n, 1000n, 'FIL' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
      }

      try {
        await payments.revokeService(serviceAddress, 'FIL' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
      }

      try {
        await payments.serviceApproval(serviceAddress, 'FIL' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'not supported')
      }
    })
  })

  describe('Error handling', () => {
    it('should throw errors from payment operations', async () => {
      // Create a provider that throws an error for contract calls
      const errorProvider = createMockProvider()

      // Override sendTransaction to throw error
      errorProvider.sendTransaction = async (transaction: any) => {
        throw new Error('Contract execution failed')
      }

      const errorSigner = createMockSigner('0x1234567890123456789012345678901234567890', errorProvider)

      // Also make the signer's sendTransaction throw
      errorSigner.sendTransaction = async () => {
        throw new Error('Transaction failed')
      }

      const errorPayments = new PaymentsService(errorProvider, errorSigner, 'calibration', false)

      try {
        // Try deposit which uses sendTransaction
        await errorPayments.deposit(ethers.parseUnits('100', 18))
        assert.fail('Should have thrown')
      } catch (error: any) {
        // Should get an error (either from signer or contract)
        assert.exists(error)
        assert.include(error.message, 'failed')
      }
    })
  })

  describe('Deposit and Withdraw', () => {
    it('should deposit USDFC tokens', async () => {
      const depositAmount = ethers.parseUnits('100', 18)
      const tx = await payments.deposit(depositAmount)
      assert.exists(tx)
      assert.exists(tx.hash)
      assert.typeOf(tx.hash, 'string')
      assert.exists(tx.from)
      assert.exists(tx.to)
      assert.exists(tx.data)
    })

    it('should withdraw USDFC tokens', async () => {
      const withdrawAmount = ethers.parseUnits('50', 18)
      const tx = await payments.withdraw(withdrawAmount)
      assert.exists(tx)
      assert.exists(tx.hash)
      assert.typeOf(tx.hash, 'string')
      assert.exists(tx.from)
      assert.exists(tx.to)
      assert.exists(tx.data)
    })

    it('should throw for invalid deposit amount', async () => {
      try {
        await payments.deposit(0n)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'Invalid amount')
      }
    })

    it('should throw for invalid withdraw amount', async () => {
      try {
        await payments.withdraw(0n)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'Invalid amount')
      }
    })

    it('should throw for unsupported token in deposit', async () => {
      try {
        await payments.deposit(ethers.parseUnits('100', 18), 'FIL' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'Unsupported token')
      }
    })

    it('should throw for unsupported token in withdraw', async () => {
      try {
        await payments.withdraw(ethers.parseUnits('50', 18), 'FIL' as any)
        assert.fail('Should have thrown')
      } catch (error: any) {
        assert.include(error.message, 'Unsupported token')
      }
    })

    it('should handle deposit callbacks', async () => {
      const depositAmount = ethers.parseUnits('100', 18)
      let allowanceChecked = false
      let approvalSent = false
      let depositStarted = false

      const tx = await payments.deposit(depositAmount, TOKENS.USDFC, {
        onAllowanceCheck: (current, required) => {
          allowanceChecked = true
          assert.equal(current, 0n)
          assert.equal(required, depositAmount)
        },
        onApprovalTransaction: (approveTx) => {
          approvalSent = true
          assert.exists(approveTx)
          assert.exists(approveTx.hash)
        },
        onApprovalConfirmed: (receipt) => {
          // This callback is called after approveTx.wait()
          assert.exists(receipt)
          assert.exists(receipt.status)
        },
        onDepositStarting: () => {
          depositStarted = true
        }
      })

      assert.exists(tx)
      assert.exists(tx.hash)
      assert.isTrue(allowanceChecked)
      assert.isTrue(approvalSent)
      assert.isTrue(depositStarted)
    })
  })

  describe('Enhanced Payment Features', () => {
    describe('accountInfo', () => {
      it('should return detailed account information with correct fields', async () => {
        const info = await payments.accountInfo()

        assert.exists(info.funds)
        assert.exists(info.lockupCurrent)
        assert.exists(info.lockupRate)
        assert.exists(info.lockupLastSettledAt)
        assert.exists(info.availableFunds)

        // Check that funds is correct (500 USDFC)
        assert.equal(info.funds.toString(), ethers.parseUnits('500', 18).toString())
        // With no lockup, available funds should equal total funds
        assert.equal(info.availableFunds.toString(), info.funds.toString())
      })

      it('should calculate available funds correctly with time-based lockup', async () => {
        // Override the mock to simulate lockup
        const originalCall = mockProvider.call
        mockProvider.call = async (transaction: any) => {
          const data = transaction.data
          if (data != null && data.includes('ad74b775') === true) {
            const funds = ethers.parseUnits('500', 18)
            const lockupCurrent = ethers.parseUnits('50', 18)
            const lockupRate = ethers.parseUnits('0.1', 18) // 0.1 USDFC per epoch
            const lockupLastSettledAt = 1000000 - 100 // 100 epochs ago
            return ethers.AbiCoder.defaultAbiCoder().encode(
              ['uint256', 'uint256', 'uint256', 'uint256'],
              [funds, lockupCurrent, lockupRate, lockupLastSettledAt]
            )
          }
          return await originalCall.call(mockProvider, transaction)
        }

        const info = await payments.accountInfo()

        // lockupCurrent (50) + lockupRate (0.1) * epochs (100) = 50 + 10 = 60
        // availableFunds = 500 - 60 = 440
        const expectedAvailable = ethers.parseUnits('440', 18)

        assert.equal(info.availableFunds.toString(), expectedAvailable.toString())
      })

      it('should use accountInfo in balance() method', async () => {
        const balance = await payments.balance()
        const info = await payments.accountInfo()

        assert.equal(balance.toString(), info.availableFunds.toString())
      })
    })

    describe('getCurrentEpoch', () => {
      it('should return block number as epoch', async () => {
        const epoch = await payments.getCurrentEpoch()

        // In Filecoin, block number is the epoch
        // Mock provider returns block number 1000000
        assert.equal(epoch.toString(), '1000000')
      })
    })
  })
})
