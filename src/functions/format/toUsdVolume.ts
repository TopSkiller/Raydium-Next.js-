import { FormatOptions } from '@/functions/format/formatNumber'
import { Fraction, Rounding } from 'test-r-sdk'
import { autoSuffixNumberish } from './autoSuffixNumberish'

/**
 * it depends on 'toFixed'
 */
export default function toUsdVolume(
  amount: Fraction | undefined,
  options?: {
    autoSuffix?: boolean

    decimalPlace?: number
    format?: any | undefined
    rounding?: Rounding
  } & FormatOptions
) {
  if (!amount) return '0'
  return `$${autoSuffixNumberish(amount, { ...options, disabled: !options?.autoSuffix })}`
}
