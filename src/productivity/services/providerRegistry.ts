import type {
  GrammarProvider,
  ImageProvider,
  ProductivityProvider,
  ProductivityProviderConfig,
  ProductivityProviderKind,
  VoiceProvider,
} from '../types/provider'
import { BrowserVoiceProvider } from './browserVoiceProvider'
import { LocalGrammarProvider } from './localGrammarProvider'
import { MockImageProvider } from './mockImageProvider'

export class ProductivityProviderRegistry {
  private readonly providers = new Map<ProductivityProviderKind, ProductivityProvider>()

  constructor(config: ProductivityProviderConfig = {}) {
    this.register(config.imageProvider ?? new MockImageProvider())
    this.register(config.grammarProvider ?? new LocalGrammarProvider())
    this.register(config.voiceProvider ?? new BrowserVoiceProvider())
  }

  register(provider: ProductivityProvider): void {
    this.providers.set(provider.kind, provider)
  }

  getImageProvider(): ImageProvider {
    return this.providers.get('image') as ImageProvider
  }

  getGrammarProvider(): GrammarProvider {
    return this.providers.get('grammar') as GrammarProvider
  }

  getVoiceProvider(): VoiceProvider {
    return this.providers.get('voice') as VoiceProvider
  }

  list(): ProductivityProvider[] {
    return [...this.providers.values()]
  }
}

export function createProductivityProviderRegistry(
  config: ProductivityProviderConfig = {},
): ProductivityProviderRegistry {
  return new ProductivityProviderRegistry(config)
}
