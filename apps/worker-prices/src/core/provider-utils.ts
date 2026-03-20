import type { FlightProvider } from '../providers'

export async function closeProviderIfSupported(provider: FlightProvider) {
  const maybeClosable = provider as FlightProvider & { close?: () => Promise<void> }
  if (typeof maybeClosable.close === 'function') {
    await maybeClosable.close()
  }
}
