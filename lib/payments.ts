import { Address, Hash, decodeEventLog } from 'viem'

// Arc: native gas token is USDC at this predeploy address
export const ARC_NATIVE_USDC_ADDRESS: Address = '0x3600000000000000000000000000000000000000'
export const ARC_NATIVE_USDC_DECIMALS = 6

const ERC20_TRANSFER_EVENT = {
  type: 'event' as const,
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
}

export type UsdcPayment = {
  recipient: Address
  amount: bigint
}

// Best-effort: extract the first USDC Transfer() from a tx receipt.
// If no ERC-20 Transfer is found, caller can treat as "trace required".
export function extractUsdcPaymentFromReceipt(receipt: {
  logs: Array<{ address: Address; topics: readonly Hash[]; data: Hash }>
}): UsdcPayment | null {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ARC_NATIVE_USDC_ADDRESS.toLowerCase()) continue

    try {
      const decoded = decodeEventLog({
        abi: [ERC20_TRANSFER_EVENT],
        data: log.data,
        topics: log.topics as unknown as [`0x${string}`, ...`0x${string}`[]],
      })

      if (decoded.eventName !== 'Transfer') continue
      const args = decoded.args as unknown as { from: Address; to: Address; value: bigint }
      // ignore mint/burn-like transfers
      if (args.to === '0x0000000000000000000000000000000000000000') continue

      return { recipient: args.to, amount: args.value }
    } catch {
      // not a Transfer log; skip
    }
  }

  return null
}

export function formatUsdc(amount: bigint): string {
  const sign = amount < 0n ? '-' : ''
  const v = amount < 0n ? -amount : amount
  const base = 10n ** BigInt(ARC_NATIVE_USDC_DECIMALS)
  const whole = v / base
  const frac = v % base
  const fracStr = frac.toString().padStart(ARC_NATIVE_USDC_DECIMALS, '0').replace(/0+$/, '')
  return fracStr.length ? `${sign}${whole.toString()}.${fracStr}` : `${sign}${whole.toString()}`
}
