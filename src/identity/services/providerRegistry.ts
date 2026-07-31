import type { IdentityProvider } from '../types/identity'

function isProvider(provider: IdentityProvider): boolean {
  return Boolean(
    provider.id.trim() &&
      provider.name.trim() &&
      provider.protocol &&
      typeof provider.resolveIdentity === 'function',
  )
}

export class IdentityProviderRegistry {
  private readonly providers = new Map<string, IdentityProvider>()

  constructor(providers: readonly IdentityProvider[] = []) {
    for (const provider of providers) this.register(provider)
  }

  register(provider: IdentityProvider): () => void {
    if (!isProvider(provider)) {
      throw new Error('Identity providers require an id, name, protocol, and resolveIdentity function.')
    }
    if (this.providers.has(provider.id)) {
      throw new Error(`Identity provider "${provider.id}" is already registered.`)
    }
    this.providers.set(provider.id, provider)
    return () => this.providers.delete(provider.id)
  }

  get(providerId: string): IdentityProvider | null {
    return this.providers.get(providerId) ?? null
  }

  list(): IdentityProvider[] {
    return [...this.providers.values()]
  }
}
