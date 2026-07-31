import type {
  DocumentEditorAiConfig,
  DocumentEditorCallbacks,
  DocumentEditorConfig,
  DocumentEditorContent,
  DocumentEditorIconSlots,
  DocumentEditorTheme,
  DocumentEditorThemeOverrides,
  ResolvedDocumentEditorConfig,
} from './types'
import type { ProductivityProviderConfig } from '../productivity/types/provider'
import { createGuestCollaborationUser } from '../collaboration/services/collaborationRegistry'
import type {
  CollaborationConfig,
  CollaborationTransport,
  ResolvedCollaborationConfig,
} from '../collaboration/types/collaboration'
import type { ContractPlaybook } from '../contract/types/contract'
import type { IdentityConfig } from '../identity/types/identity'
import { IDENTITY_PERMISSIONS } from '../identity/types/permissions'

const DEFAULT_THEME: DocumentEditorTheme = {
  colors: {
    background: '#f6f6f4',
    surface: '#ffffff',
    text: '#171717',
    mutedText: '#737373',
    border: '#e5e5e5',
    accent: '#4f46e5',
    selection: 'rgba(79, 70, 229, 0.2)',
  },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    editorFontSize: '1.0625rem',
  },
  spacing: {
    workspace: '1.5rem',
    panelGap: '1.25rem',
  },
  radius: {
    small: '0.25rem',
    medium: '0.375rem',
    large: '0.5rem',
  },
  icons: {},
  animationDuration: '160ms',
  shadows: {
    surface: '0 1px 2px rgba(20,20,20,0.04), 0 18px 48px -28px rgba(20,20,20,0.32)',
    overlay: '0 24px 70px -24px rgba(20,20,20,0.48)',
  },
}

const DEFAULT_AI: Omit<Required<DocumentEditorAiConfig>, 'redactionDetector'> = {
  askDocumentEndpoint: '/api/ask-document',
  selectionEndpoint: '/api/selection-ai',
  complianceEndpoint: '/api/compliance-analysis',
  contractEndpoint: '/api/contract-analysis',
  writingEndpoint: '/api/writing-assistant',
}

const CONFIG_KEYS = new Set([
  'initialContent',
  'placeholder',
  'theme',
  'readonly',
  'toolbar',
  'voice',
  'ai',
  'knowledgeSources',
  'preview',
  'streaming',
  'animations',
  'keyboardShortcuts',
  'commandPalette',
  'collaboration',
  'productivity',
  'identity',
  'contractPlaybook',
  'callbacks',
  'plugins',
])

const THEME_KEYS = new Set([
  'colors',
  'typography',
  'spacing',
  'radius',
  'icons',
  'animationDuration',
  'shadows',
])

const CALLBACK_KEYS = new Set([
  'onReady',
  'onEditorChange',
  'onSelectionChange',
  'onAIRequest',
  'onAIResponse',
  'onInsert',
  'onKnowledgeSourceAdded',
  'onKnowledgeSourceRemoved',
  'onKnowledgeSourceActivated',
  'onPreviewOpen',
  'onPreviewClose',
  'onCollaborationStatus',
  'onCollaboratorsChange',
  'onSearchIndexChange',
  'onSearch',
  'onFormSubmit',
  'onIdentityAudit',
  'onError',
])

function warn(message: string, warnings: string[]) {
  warnings.push(`[DocumentEditor] ${message}`)
}

function validBoolean(
  value: unknown,
  fallback: boolean,
  key: string,
  warnings: string[],
): boolean {
  if (value === undefined) return fallback
  if (typeof value === 'boolean') return value
  warn(`"${key}" must be a boolean. Using ${String(fallback)}.`, warnings)
  return fallback
}

function validString(
  value: unknown,
  fallback: string,
  key: string,
  warnings: string[],
): string {
  if (value === undefined) return fallback
  if (typeof value === 'string' && value.trim()) return value
  warn(`"${key}" must be a non-empty string. Using the default.`, warnings)
  return fallback
}

function mergeStringTokens<Group extends Record<string, string>>(
  value: unknown,
  defaults: Group,
  key: string,
  warnings: string[],
): Group {
  if (value === undefined) return { ...defaults }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn(`"${key}" must be an object. Using default tokens.`, warnings)
    return { ...defaults }
  }

  const input = value as Record<string, unknown>
  const result: Record<string, string> = { ...defaults }
  for (const token of Object.keys(input)) {
    if (!(token in defaults)) {
      warn(`Unknown theme token "${key}.${token}" was ignored.`, warnings)
    }
  }
  for (const [token, fallback] of Object.entries(defaults)) {
    result[token] = validString(input[token], fallback, `${key}.${token}`, warnings)
  }
  return result as Group
}

function mergeIcons(
  value: unknown,
  warnings: string[],
): Partial<DocumentEditorIconSlots> {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"theme.icons" must be an object. Custom icons were ignored.', warnings)
    return {}
  }

  const input = value as Record<string, unknown>
  const result: Partial<DocumentEditorIconSlots> = {}
  for (const [name, icon] of Object.entries(input)) {
    if (name !== 'askDocument' && name !== 'commandPalette') {
      warn(`Unknown theme icon "${name}" was ignored.`, warnings)
      continue
    }
    const isComponent =
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && '$$typeof' in icon)
    if (!isComponent) {
      warn(`"theme.icons.${name}" must be a React component.`, warnings)
      continue
    }
    result[name] = icon as DocumentEditorIconSlots[typeof name]
  }
  return result
}

function mergeTheme(
  theme: unknown,
  warnings: string[],
): DocumentEditorTheme {
  if (theme === undefined) return getDefaultDocumentEditorTheme()
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
    warn('"theme" must be an object. Using the default theme.', warnings)
    return getDefaultDocumentEditorTheme()
  }

  const overrides = theme as DocumentEditorThemeOverrides
  for (const key of Object.keys(overrides)) {
    if (!THEME_KEYS.has(key)) warn(`Unknown theme option "${key}" was ignored.`, warnings)
  }
  return {
    colors: mergeStringTokens(
      overrides.colors,
      DEFAULT_THEME.colors,
      'theme.colors',
      warnings,
    ),
    typography: mergeStringTokens(
      overrides.typography,
      DEFAULT_THEME.typography,
      'theme.typography',
      warnings,
    ),
    spacing: mergeStringTokens(
      overrides.spacing,
      DEFAULT_THEME.spacing,
      'theme.spacing',
      warnings,
    ),
    radius: mergeStringTokens(
      overrides.radius,
      DEFAULT_THEME.radius,
      'theme.radius',
      warnings,
    ),
    icons: mergeIcons(overrides.icons, warnings),
    animationDuration: validString(
      overrides.animationDuration,
      DEFAULT_THEME.animationDuration,
      'theme.animationDuration',
      warnings,
    ),
    shadows: mergeStringTokens(
      overrides.shadows,
      DEFAULT_THEME.shadows,
      'theme.shadows',
      warnings,
    ),
  }
}

function resolveAi(value: unknown, warnings: string[]): ResolvedDocumentEditorConfig['ai'] {
  if (value === false) return false
  if (value === undefined || value === true) return { ...DEFAULT_AI }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"ai" must be a boolean or configuration object. AI remains enabled.', warnings)
    return { ...DEFAULT_AI }
  }

  const ai = value as DocumentEditorAiConfig
  return {
    askDocumentEndpoint: validString(
      ai.askDocumentEndpoint,
      DEFAULT_AI.askDocumentEndpoint,
      'ai.askDocumentEndpoint',
      warnings,
    ),
    selectionEndpoint: validString(
      ai.selectionEndpoint,
      DEFAULT_AI.selectionEndpoint,
      'ai.selectionEndpoint',
      warnings,
    ),
    complianceEndpoint: validString(
      ai.complianceEndpoint,
      DEFAULT_AI.complianceEndpoint,
      'ai.complianceEndpoint',
      warnings,
    ),
    contractEndpoint: validString(
      ai.contractEndpoint,
      DEFAULT_AI.contractEndpoint,
      'ai.contractEndpoint',
      warnings,
    ),
    writingEndpoint: validString(
      ai.writingEndpoint,
      DEFAULT_AI.writingEndpoint,
      'ai.writingEndpoint',
      warnings,
    ),
    redactionDetector: typeof ai.redactionDetector?.detect === 'function'
      ? ai.redactionDetector
      : undefined,
  }
}

function resolveContractPlaybook(value: unknown, warnings: string[]): ContractPlaybook | null {
  if (value === undefined) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"contractPlaybook" must be an object and was ignored.', warnings)
    return null
  }
  const playbook = value as Partial<ContractPlaybook>
  if (typeof playbook.id !== 'string' || !playbook.id.trim() || typeof playbook.name !== 'string' || !playbook.name.trim() || !Array.isArray(playbook.rules)) {
    warn('"contractPlaybook" requires id, name, and rules and was ignored.', warnings)
    return null
  }
  return value as ContractPlaybook
}

function resolveProductivity(
  value: unknown,
  warnings: string[],
): false | ProductivityProviderConfig {
  if (value === false) return false
  if (value === undefined || value === true) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"productivity" must be a boolean or provider configuration. Local providers will be used.', warnings)
    return {}
  }
  const input = value as Record<string, unknown>
  const known = new Set(['imageProvider', 'grammarProvider', 'voiceProvider'])
  for (const key of Object.keys(input)) {
    if (!known.has(key)) warn(`Unknown productivity option "${key}" was ignored.`, warnings)
  }
  const result: ProductivityProviderConfig = {}
  const image = input.imageProvider as ProductivityProviderConfig['imageProvider']
  const grammar = input.grammarProvider as ProductivityProviderConfig['grammarProvider']
  const voice = input.voiceProvider as ProductivityProviderConfig['voiceProvider']
  if (image !== undefined) {
    if (image?.kind === 'image' && typeof image.generate === 'function') result.imageProvider = image
    else warn('"productivity.imageProvider" is invalid. The local mock provider will be used.', warnings)
  }
  if (grammar !== undefined) {
    if (grammar?.kind === 'grammar' && typeof grammar.analyze === 'function') result.grammarProvider = grammar
    else warn('"productivity.grammarProvider" is invalid. The local grammar provider will be used.', warnings)
  }
  if (voice !== undefined) {
    if (voice?.kind === 'voice' && typeof voice.createSession === 'function') result.voiceProvider = voice
    else warn('"productivity.voiceProvider" is invalid. The browser voice provider will be used.', warnings)
  }
  return result
}

function resolveIdentity(
  value: unknown,
  warnings: string[],
): false | IdentityConfig {
  if (value === false) return false
  if (value === undefined || value === true) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"identity" must be a boolean or identity configuration. Local administrator access will be used.', warnings)
    return {}
  }
  const input = value as IdentityConfig & Record<string, unknown>
  const known = new Set([
    'providers',
    'defaultProviderId',
    'principal',
    'token',
    'context',
    'roles',
    'permissionOverrides',
    'auditAdapter',
    'auditBufferSize',
    'permissionCacheTtlMs',
  ])
  for (const key of Object.keys(input)) {
    if (!known.has(key)) warn(`Unknown identity option "${key}" was ignored.`, warnings)
  }

  const providers = Array.isArray(input.providers)
    ? input.providers.filter((provider, index) => {
        const valid = Boolean(
          provider &&
          typeof provider.id === 'string' &&
          provider.id.trim() &&
          typeof provider.name === 'string' &&
          provider.name.trim() &&
          typeof provider.protocol === 'string' &&
          typeof provider.resolveIdentity === 'function',
        )
        if (!valid) warn(`Identity provider at index ${index} is invalid and was ignored.`, warnings)
        return valid
      })
    : []
  if (input.providers !== undefined && !Array.isArray(input.providers)) {
    warn('"identity.providers" must be an array.', warnings)
  }

  const roles = Array.isArray(input.roles)
    ? input.roles.filter((role, index) => {
        const valid = Boolean(
          role &&
          typeof role.id === 'string' &&
          role.id.trim() &&
          typeof role.name === 'string' &&
          role.name.trim() &&
          typeof role.description === 'string' &&
          Array.isArray(role.permissions) &&
          role.permissions.every((permission) => IDENTITY_PERMISSIONS.includes(permission)),
        )
        if (!valid) warn(`Identity role at index ${index} is invalid and was ignored.`, warnings)
        return valid
      })
    : []
  if (input.roles !== undefined && !Array.isArray(input.roles)) {
    warn('"identity.roles" must be an array.', warnings)
  }

  const principal = input.principal &&
    typeof input.principal.id === 'string' &&
    input.principal.id.trim() &&
    typeof input.principal.displayName === 'string' &&
    input.principal.displayName.trim() &&
    Array.isArray(input.principal.roleIds)
    ? input.principal
    : undefined
  if (input.principal !== undefined && !principal) {
    warn('"identity.principal" requires id, displayName, and roleIds and was ignored.', warnings)
  }

  const token = input.token &&
    typeof input.token.value === 'string' &&
    input.token.value
    ? input.token
    : undefined
  if (input.token !== undefined && !token) {
    warn('"identity.token" requires a non-empty value and was ignored.', warnings)
  }

  const permissionOverrides = Array.isArray(input.permissionOverrides)
    ? input.permissionOverrides.filter((override, index) => {
        const valid = Boolean(
          override &&
          typeof override.id === 'string' &&
          override.id.trim() &&
          (override.effect === 'allow' || override.effect === 'deny') &&
          Array.isArray(override.permissions) &&
          override.permissions.every((permission) => IDENTITY_PERMISSIONS.includes(permission)),
        )
        if (!valid) warn(`Permission override at index ${index} is invalid and was ignored.`, warnings)
        return valid
      })
    : []
  if (
    input.permissionOverrides !== undefined &&
    !Array.isArray(input.permissionOverrides)
  ) {
    warn('"identity.permissionOverrides" must be an array.', warnings)
  }

  const auditAdapter = input.auditAdapter &&
    typeof input.auditAdapter.write === 'function'
    ? input.auditAdapter
    : undefined
  if (input.auditAdapter !== undefined && !auditAdapter) {
    warn('"identity.auditAdapter" requires a write function and was ignored.', warnings)
  }

  return {
    providers,
    roles,
    permissionOverrides,
    principal,
    token,
    auditAdapter,
    ...(typeof input.defaultProviderId === 'string' && input.defaultProviderId.trim()
      ? { defaultProviderId: input.defaultProviderId }
      : {}),
    ...(input.context && typeof input.context === 'object'
      ? { context: { ...input.context } }
      : {}),
    ...(typeof input.auditBufferSize === 'number'
      ? { auditBufferSize: input.auditBufferSize }
      : {}),
    ...(typeof input.permissionCacheTtlMs === 'number'
      ? { permissionCacheTtlMs: input.permissionCacheTtlMs }
      : {}),
  }
}

function resolveCallbacks(value: unknown, warnings: string[]): DocumentEditorCallbacks {
  if (value === undefined) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"callbacks" must be an object. Invalid callbacks were ignored.', warnings)
    return {}
  }

  const result: Record<string, unknown> = {}
  for (const [name, callback] of Object.entries(value)) {
    if (!CALLBACK_KEYS.has(name)) {
      warn(`Unknown callback "${name}" was ignored.`, warnings)
      continue
    }
    if (typeof callback !== 'function') {
      warn(`"callbacks.${name}" must be a function and was ignored.`, warnings)
      continue
    }
    result[name] = callback
  }
  return result as DocumentEditorCallbacks
}

function validTransport(value: unknown): value is CollaborationTransport {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as CollaborationTransport).connect === 'function' &&
    typeof (value as CollaborationTransport).send === 'function' &&
    typeof (value as CollaborationTransport).disconnect === 'function',
  )
}

function resolveCollaboration(
  value: unknown,
  warnings: string[],
): false | ResolvedCollaborationConfig {
  if (value === false || value === undefined) return false
  const fallbackUser = createGuestCollaborationUser()
  if (value === true) {
    return {
      roomId: 'document-editor-demo',
      user: fallbackUser,
      awarenessThrottleMs: 80,
      syncBatchMs: 120,
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    warn('"collaboration" must be a boolean or configuration object. Collaboration remains disabled.', warnings)
    return false
  }
  const input = value as CollaborationConfig
  const user = input.user && typeof input.user === 'object' ? input.user : fallbackUser
  if (!input.user) warn('"collaboration.user" was not provided. A local guest identity is being used.', warnings)
  const transport = input.transport === undefined || validTransport(input.transport)
    ? input.transport
    : undefined
  if (input.transport !== undefined && !transport) {
    warn('"collaboration.transport" is invalid. The browser transport will be used.', warnings)
  }
  return {
    roomId: validString(input.roomId, 'document-editor-demo', 'collaboration.roomId', warnings),
    user: {
      id: validString(user.id, fallbackUser.id, 'collaboration.user.id', warnings),
      name: validString(user.name, fallbackUser.name, 'collaboration.user.name', warnings),
      color: validString(user.color, fallbackUser.color, 'collaboration.user.color', warnings),
      ...(typeof user.avatarUrl === 'string' && user.avatarUrl.trim()
        ? { avatarUrl: user.avatarUrl }
        : {}),
    },
    transport,
    awarenessThrottleMs: typeof input.awarenessThrottleMs === 'number' && input.awarenessThrottleMs >= 40
      ? input.awarenessThrottleMs
      : 80,
    syncBatchMs: typeof input.syncBatchMs === 'number' && input.syncBatchMs >= 50
      ? input.syncBatchMs
      : 120,
  }
}

export interface DocumentEditorConfigValidation {
  config: ResolvedDocumentEditorConfig
  warnings: string[]
}

export function validateDocumentEditorConfig(value: unknown): DocumentEditorConfigValidation {
  const warnings: string[] = []
  const input =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as DocumentEditorConfig & Record<string, unknown>)
      : {}

  if (value !== undefined && input !== value) {
    warn('Configuration must be an object. Using defaults.', warnings)
  }
  for (const key of Object.keys(input)) {
    if (!CONFIG_KEYS.has(key)) warn(`Unknown configuration option "${key}" was ignored.`, warnings)
  }

  const plugins = Array.isArray(input.plugins)
    ? input.plugins.filter((plugin, index) => {
        const valid =
          plugin &&
          typeof plugin === 'object' &&
          typeof plugin.name === 'string' &&
          plugin.name.trim().length > 0 &&
          typeof plugin.setup === 'function'
        if (!valid) warn(`Plugin at index ${index} is invalid and was ignored.`, warnings)
        return valid
      })
    : []
  if (input.plugins !== undefined && !Array.isArray(input.plugins)) {
    warn('"plugins" must be an array. No plugins were registered.', warnings)
  }

  let initialContent: DocumentEditorContent = ''
  if (
    typeof input.initialContent === 'string' ||
    (input.initialContent !== null &&
      typeof input.initialContent === 'object' &&
      !Array.isArray(input.initialContent))
  ) {
    initialContent = input.initialContent
  } else if (input.initialContent !== undefined) {
    warn('"initialContent" must be a string or editor JSON object.', warnings)
  }

  return {
    warnings,
    config: {
      initialContent,
      placeholder: validString(input.placeholder, 'Start writing…', 'placeholder', warnings),
      theme: mergeTheme(input.theme, warnings),
      readonly: validBoolean(input.readonly, false, 'readonly', warnings),
      toolbar: validBoolean(input.toolbar, true, 'toolbar', warnings),
      voice: validBoolean(input.voice, true, 'voice', warnings),
      ai: resolveAi(input.ai, warnings),
      knowledgeSources: validBoolean(
        input.knowledgeSources,
        true,
        'knowledgeSources',
        warnings,
      ),
      preview: validBoolean(input.preview, true, 'preview', warnings),
      streaming: validBoolean(input.streaming, true, 'streaming', warnings),
      animations: validBoolean(input.animations, true, 'animations', warnings),
      keyboardShortcuts: validBoolean(
        input.keyboardShortcuts,
        true,
        'keyboardShortcuts',
        warnings,
      ),
      commandPalette: validBoolean(
        input.commandPalette,
        true,
        'commandPalette',
        warnings,
      ),
      collaboration: resolveCollaboration(input.collaboration, warnings),
      productivity: resolveProductivity(input.productivity, warnings),
      identity: resolveIdentity(input.identity, warnings),
      contractPlaybook: resolveContractPlaybook(input.contractPlaybook, warnings),
      callbacks: resolveCallbacks(input.callbacks, warnings),
      plugins,
    },
  }
}

export function resolveDocumentEditorConfig(
  config: DocumentEditorConfig = {},
): ResolvedDocumentEditorConfig {
  const result = validateDocumentEditorConfig(config)
  for (const warning of result.warnings) console.warn(warning)
  return result.config
}

export function getDefaultDocumentEditorTheme(): DocumentEditorTheme {
  return {
    ...DEFAULT_THEME,
    colors: { ...DEFAULT_THEME.colors },
    typography: { ...DEFAULT_THEME.typography },
    spacing: { ...DEFAULT_THEME.spacing },
    radius: { ...DEFAULT_THEME.radius },
    icons: {},
    shadows: { ...DEFAULT_THEME.shadows },
  }
}
