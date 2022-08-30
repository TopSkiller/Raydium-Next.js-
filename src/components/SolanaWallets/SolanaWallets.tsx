import React, { ReactNode, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import {
  BackpackWalletAdapter, BitKeepWalletAdapter, BitpieWalletAdapter, CloverWalletAdapter, Coin98WalletAdapter,
  CoinbaseWalletAdapter, CoinhubWalletAdapter, ExodusWalletAdapter, GlowWalletAdapter, LedgerWalletAdapter,
  MathWalletAdapter, PhantomWalletAdapter, SafePalWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter,
  SolletExtensionWalletAdapter, SolletWalletAdapter, SolongWalletAdapter, TokenPocketWalletAdapter, TorusWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

import useAppSettings from '@/application/appSettings/useAppSettings'
import useConnection from '@/application/connection/useConnection'

/** include: SolanaWalletConnectionProvider SolanaWalletAdaptorsProvider SolanaWalletModalProvider */
export function SolanaWalletProviders({ children }: { children?: ReactNode }) {
  const needPopDisclaimer = useAppSettings((s) => s.needPopDisclaimer)
  // Set to 'devnet' | 'testnet' | 'mainnet-beta' or provide a custom RPC endpoint
  const { currentEndPoint } = useConnection()
  const { pathname } = useRouter()

  const endpoint = useMemo(() => currentEndPoint?.url ?? clusterApiUrl('devnet'), [currentEndPoint])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new TrustWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new MathWalletAdapter({ endpoint }),
      new TokenPocketWalletAdapter(),
      new CoinbaseWalletAdapter({ endpoint }),
      new SolongWalletAdapter({ endpoint }),
      new Coin98WalletAdapter({ endpoint }),
      new SafePalWalletAdapter({ endpoint }),
      new SlopeWalletAdapter({ endpoint }),
      new BitpieWalletAdapter({ endpoint }),
      new GlowWalletAdapter(),
      new BitKeepWalletAdapter({ endpoint }),
      new ExodusWalletAdapter({ endpoint }),
      new CloverWalletAdapter(),
      new CoinhubWalletAdapter(),
      new BackpackWalletAdapter()
    ],
    [endpoint]
  )

  const onError = useCallback(() => {
    // TODO
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={pathname !== '/' && needPopDisclaimer === false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}
