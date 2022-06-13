import { Farm, jsonInfo2PoolKeys, Spl, TokenAmount } from '@raydium-io/raydium-sdk'

import createAssociatedTokenAccountIfNotExist from '@/application/txTools/createAssociatedTokenAccountIfNotExist'
import {
  addWalletAccountChangeListener,
  removeWalletAccountChangeListener
} from '@/application/wallet/useWalletAccountChangeListeners'
import assert from '@/functions/assert'

import { HydratedFarmInfo } from './type'
import useFarms from './useFarms'
import handleMultiTx from '@/application/txTools/handleMultiTx'
import { createTransactionCollector } from '@/application/txTools/createTransaction'
import toPubString from '@/functions/format/toMintString'
import { WSOLMint } from '../token/quantumSOL'

export default async function txFarmDeposit(
  info: HydratedFarmInfo,
  options: { isStaking?: boolean; amount: TokenAmount }
) {
  return handleMultiTx(async ({ transactionCollector, baseUtils: { owner } }) => {
    const piecesCollector = createTransactionCollector()
    assert(owner, 'require connected wallet')

    const jsonFarmInfo = useFarms.getState().jsonInfos.find(({ lpMint }) => String(lpMint) === String(info.lpMint))
    assert(jsonFarmInfo, 'Farm pool not found')

    // ------------- add lp token transaction --------------
    const lpTokenAccount = await createAssociatedTokenAccountIfNotExist({
      collector: piecesCollector,
      mint: info.lpMint
    })

    // ------------- add rewards token transaction --------------
    const rewardTokenAccountsPublicKeys = await Promise.all(
      jsonFarmInfo!.rewardInfos.map(async ({ rewardMint }) => {
        const targetTokenAccoutPublicKey = await createAssociatedTokenAccountIfNotExist({
          collector: piecesCollector,
          mint: rewardMint
        })
        // farm only reward SOL
        if (rewardMint === toPubString(WSOLMint)) {
          piecesCollector.addEndInstruction(
            Spl.makeCloseAccountInstruction({ owner, payer: owner, tokenAccount: targetTokenAccoutPublicKey })
          )
        }
        return targetTokenAccoutPublicKey
      })
    )

    // ------------- add farm deposit transaction --------------
    const poolKeys = jsonInfo2PoolKeys(jsonFarmInfo)
    const ledgerAddress = await Farm.getAssociatedLedgerAccount({
      programId: poolKeys.programId,
      poolId: poolKeys.id,
      owner
    })

    // ------------- create ledger --------------
    if (!info.ledger && jsonFarmInfo.version < 6 /* start from v6, no need init ledger any more */) {
      const instruction = await Farm.makeCreateAssociatedLedgerAccountInstruction({
        poolKeys,
        userKeys: { owner, ledger: ledgerAddress }
      })
      piecesCollector.addInstruction(instruction)
    }

    // ------------- add deposit transaction --------------
    const depositInstruction = Farm.makeDepositInstruction({
      poolKeys,
      userKeys: {
        ledger: ledgerAddress,
        lpTokenAccount,
        owner,
        rewardTokenAccounts: rewardTokenAccountsPublicKeys
      },
      amount: options.amount.raw
    })
    piecesCollector.addInstruction(depositInstruction)

    const listenerId = addWalletAccountChangeListener(
      () => {
        useFarms.getState().refreshFarmInfos()
      },
      { once: true }
    )
    transactionCollector.add(await piecesCollector.spawnTransaction(), {
      onTxError: () => removeWalletAccountChangeListener(listenerId),
      onTxSentError: () => removeWalletAccountChangeListener(listenerId),
      txHistoryInfo: {
        title: `Stake ${options.amount.token.symbol}`,
        description: `Stake ${options.amount.toExact()} ${options.amount.token.symbol}`
      }
    })
  })
}
