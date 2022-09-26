import { CurrencyAmount, Percent } from 'test-r-sdk'
import { PublicKey } from '@solana/web3.js'

import { AmmV3PoolInfo, AmmV3PoolPersonalPosition, ApiAmmV3PoolInfo, TokenAmount } from 'test-r-sdk'

import { Numberish } from '@/types/constants'

import { SplToken } from '../token/type'
import { ReplaceType } from '../txTools/decimal2Fraction'
import BN from 'bn.js'
import Decimal from 'decimal.js'

export type APIConcentratedInfo = ApiAmmV3PoolInfo

export type SDKParsedConcentratedInfo = {
  state: AmmV3PoolInfo
  positionAccount?: AmmV3PoolPersonalPosition[]
}

export interface HydratedConcentratedInfo extends SDKParsedConcentratedInfo {
  protocolFeeRate: Percent
  tradeFeeRate: Percent
  base: SplToken | undefined
  quote: SplToken | undefined
  id: PublicKey
  userPositionAccount?: UserPositionAccount[]
  name: string
  idString: string

  ammConfig: AmmV3PoolInfo['ammConfig']

  tvl: CurrencyAmount
  fee24h: CurrencyAmount
  fee7d: CurrencyAmount
  fee30d: CurrencyAmount
  apr24h: Percent
  apr7d: Percent
  apr30d: Percent
  feeApr24h: Percent
  feeApr7d: Percent
  feeApr30d: Percent
  volume24h: CurrencyAmount
  volume7d: CurrencyAmount
  volume30d: CurrencyAmount
}

export interface UserPositionAccount {
  /** transform to SDK function, should not used directlly in UI */
  sdkParsed: AmmV3PoolPersonalPosition
  poolId: PublicKey
  nftMint: PublicKey
  priceLower: Numberish
  priceUpper: Numberish
  amountA?: TokenAmount
  amountB?: TokenAmount
  tokenA?: SplToken
  tokenB?: SplToken
  leverage: number
  amountLiquidityValue: CurrencyAmount
  tickLower: number
  tickUpper: number
  positionPercentA: Percent
  positionPercentB: Percent
  tokenFeeAmountA?: TokenAmount
  tokenFeeAmountB?: TokenAmount
  // liquidity: BN__default; // currently useless
  // feeGrowthInsideLastX64A: BN__default; // currently useless
  // feeGrowthInsideLastX64B: BN__default; // currently useless
  // tokenFeesOwedA: BN__default; // currently useless
  // tokenFeesOwedB: BN__default; // currently useless
}
