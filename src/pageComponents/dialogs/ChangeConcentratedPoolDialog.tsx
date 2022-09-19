import useAppSettings from '@/application/appSettings/useAppSettings'
import txIncreaseConcentrated from '@/application/concentrated/txIncreaseConcentrated'
import useConcentrated from '@/application/concentrated/useConcentrated'
import useWallet from '@/application/wallet/useWallet'
import Button, { ButtonHandle } from '@/components/Button'
import Card from '@/components/Card'
import CoinInputBox, { CoinInputBoxHandle } from '@/components/CoinInputBox'
import Dialog from '@/components/Dialog'
import Icon from '@/components/Icon'
import Row from '@/components/Row'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { toString } from '@/functions/numberish/toString'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export function ChangeConcentratedPoolDialog({
  className,
  open,
  mode: inputMode,
  onClose
}: {
  className?: string
  open: boolean
  mode?: 'add' | 'remove'
  onClose?(): void
}) {
  // cache for UI
  const [mode, setMode] = useState(inputMode)
  useEffect(() => {
    if (inputMode != null) setMode(inputMode)
  }, [inputMode])

  const walletConnected = useWallet((s) => s.connected)
  const isApprovePanelShown = useAppSettings((s) => s.isApprovePanelShown)
  const buttonComponentRef = useRef<ButtonHandle>()
  const coinInputBoxComponentRef1 = useRef<CoinInputBoxHandle>()
  const coinInputBoxComponentRef2 = useRef<CoinInputBoxHandle>()
  const currentAmmPool = useConcentrated((s) => s.currentAmmPool)
  const coinBase = currentAmmPool?.base
  const coinQuote = currentAmmPool?.quote
  const targetUserPositionAccount = useConcentrated((s) => s.targetUserPositionAccount)
  const originalCoin1 = useConcentrated((s) => s.coin1)
  const originalCoin1Amount = useConcentrated((s) => s.coin1Amount)
  const originalCoin2Amount = useConcentrated((s) => s.coin2Amount)
  const focusSide = isMintEqual(coinBase?.mint, originalCoin1?.mint) ? 'coin1' : 'coin2'
  const coinBaseAmount = focusSide === 'coin1' ? originalCoin1Amount : originalCoin2Amount
  const coinQuoteAmount = focusSide === 'coin1' ? originalCoin2Amount : originalCoin1Amount
  const [amountBaseIsOutOfMax, setAmountBaseIsOutOfMax] = useState(false)
  const [amountBaseIsNegative, setAmountBaseIsNegative] = useState(false)
  const [amountQuoteIsOutOfMax, setAmountQuoteIsOutOfMax] = useState(false)
  const [amountQuoteIsNegative, setAmountQuoteIsNegative] = useState(false)

  useEffect(() => {
    if (!currentAmmPool || !targetUserPositionAccount) return
    const coin1 = currentAmmPool?.base
    const coin2 = currentAmmPool?.quote
    useConcentrated.setState({
      coin1,
      coin2,
      priceLowerTick: targetUserPositionAccount.tickLowerIndex,
      priceUpperTick: targetUserPositionAccount.tickUpperIndex
    })
  }, [currentAmmPool, targetUserPositionAccount])

  return (
    <Dialog open={open} onClose={onClose}>
      {({ close: closeDialog }) => (
        <Card
          className={twMerge(
            'backdrop-filter backdrop-blur-xl p-8 rounded-3xl w-[min(456px,90vw)] border-1.5 border-[rgba(171,196,255,0.2)] bg-cyberpunk-card-bg shadow-cyberpunk-card',
            className
          )}
          size="lg"
        >
          <Row className="justify-between items-center mb-6">
            <div className="text-xl font-semibold text-white">{mode === 'add' ? 'Add' : 'Remove'} Concentrated</div>
            <Icon className="text-[#ABC4FF] cursor-pointer" heroIconName="x" onClick={closeDialog} />
          </Row>

          {/* input-container-box */}
          <CoinInputBox
            className="mb-6"
            componentRef={coinInputBoxComponentRef1}
            haveCoinIcon
            topLeftLabel={'Base'}
            topRightLabel={mode === 'remove' ? `Deposited: ${toString(targetUserPositionAccount?.amountA)}` : undefined}
            maxValue={mode === 'remove' ? targetUserPositionAccount?.amountA : undefined}
            token={coinBase}
            value={toString(coinBaseAmount)}
            onUserInput={(value) => {
              if (focusSide === 'coin1') {
                useConcentrated.setState({ coin1Amount: value, userCursorSide: 'coin1' })
              } else {
                useConcentrated.setState({ coin2Amount: value, userCursorSide: 'coin2' })
              }
            }}
            onInputAmountClampInBalanceChange={({ negative, outOfMax }) => {
              setAmountBaseIsNegative(negative)
              setAmountBaseIsOutOfMax(outOfMax)
            }}
            onEnter={(input) => {
              if (!input) return
              buttonComponentRef.current?.click?.()
            }}
          />

          {/* input-container-box 2 */}
          <CoinInputBox
            className="mb-6"
            componentRef={coinInputBoxComponentRef2}
            haveCoinIcon
            topLeftLabel={'Quote'}
            topRightLabel={mode === 'remove' ? `Deposited: ${toString(targetUserPositionAccount?.amountB)}` : undefined}
            maxValue={mode === 'remove' ? targetUserPositionAccount?.amountB : undefined}
            token={coinQuote}
            value={toString(coinQuoteAmount)}
            onUserInput={(value) => {
              if (focusSide === 'coin1') {
                useConcentrated.setState({ coin2Amount: value, userCursorSide: 'coin2' })
              } else {
                useConcentrated.setState({ coin1Amount: value, userCursorSide: 'coin1' })
              }
            }}
            onInputAmountClampInBalanceChange={({ negative, outOfMax }) => {
              setAmountQuoteIsNegative(negative)
              setAmountQuoteIsOutOfMax(outOfMax)
            }}
            onEnter={(input) => {
              if (!input) return
              buttonComponentRef.current?.click?.()
            }}
          />

          <Row className="flex-col gap-1">
            <Button
              className="frosted-glass frosted-glass-teal"
              isLoading={isApprovePanelShown}
              componentRef={buttonComponentRef}
              validators={[
                {
                  should: walletConnected,
                  forceActive: true,
                  fallbackProps: {
                    onClick: () => useAppSettings.setState({ isWalletSelectorShown: true }),
                    children: 'Connect Wallet'
                  }
                },
                // { should: gt(removeAmout, 0) },
                // should: value is smaller than balance, but larget than zero ,
                {
                  should: !amountBaseIsOutOfMax,
                  fallbackProps: { children: `${coinBase?.symbol ?? ''} Amount Too Large` }
                },
                {
                  should: !amountBaseIsNegative,
                  fallbackProps: { children: `Negative ${coinBase?.symbol ?? ''} Amount` }
                },
                {
                  should: !amountQuoteIsOutOfMax,
                  fallbackProps: { children: `${coinQuote?.symbol ?? ''} Amount Too Large` }
                },
                {
                  should: !amountQuoteIsNegative,
                  fallbackProps: { children: `Negative ${coinQuote?.symbol ?? ''} Amount` }
                }
              ]}
              onClick={() => {
                txIncreaseConcentrated().then(({ allSuccess }) => {
                  if (allSuccess) {
                    onClose?.()
                    useConcentrated.setState({
                      coin1Amount: undefined,
                      coin2Amount: undefined
                    })
                  }
                })
              }}
            >
              {mode === 'add' ? 'Add' : 'Remove'} Liquidity
            </Button>
            <Button
              type="text"
              className="text-sm text-[#ABC4FF] opacity-50 backdrop-filter-none"
              onClick={closeDialog}
            >
              Cancel
            </Button>
          </Row>
        </Card>
      )}
    </Dialog>
  )
}
