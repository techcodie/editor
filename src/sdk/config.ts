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

const DEFAULT_AI: Required<DocumentEditorAiConfig> = {
  askDocumentEndpoint: '/api/ask-document',
  selectionEndpoint: '/api/selection-ai',
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

function resolveAi(value: unknown, warnings: string[]): false | Required<DocumentEditorAiConfig> {
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
