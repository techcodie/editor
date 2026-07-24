import type { CSSProperties } from 'react'
import type { DocumentEditorTheme } from './types'

interface ThemeVariables extends CSSProperties {
  '--document-editor-background': string
  '--document-editor-surface': string
  '--document-editor-text': string
  '--document-editor-muted-text': string
  '--document-editor-border': string
  '--document-editor-accent': string
  '--document-editor-selection': string
  '--document-editor-font-family': string
  '--document-editor-font-size': string
  '--document-editor-workspace-spacing': string
  '--document-editor-panel-gap': string
  '--document-editor-radius-sm': string
  '--document-editor-radius-md': string
  '--document-editor-radius-lg': string
  '--document-editor-animation-duration': string
  '--document-editor-shadow-surface': string
  '--document-editor-shadow-overlay': string
}

export function createThemeVariables(theme: DocumentEditorTheme): ThemeVariables {
  return {
    '--document-editor-background': theme.colors.background,
    '--document-editor-surface': theme.colors.surface,
    '--document-editor-text': theme.colors.text,
    '--document-editor-muted-text': theme.colors.mutedText,
    '--document-editor-border': theme.colors.border,
    '--document-editor-accent': theme.colors.accent,
    '--document-editor-selection': theme.colors.selection,
    '--document-editor-font-family': theme.typography.fontFamily,
    '--document-editor-font-size': theme.typography.editorFontSize,
    '--document-editor-workspace-spacing': theme.spacing.workspace,
    '--document-editor-panel-gap': theme.spacing.panelGap,
    '--document-editor-radius-sm': theme.radius.small,
    '--document-editor-radius-md': theme.radius.medium,
    '--document-editor-radius-lg': theme.radius.large,
    '--document-editor-animation-duration': theme.animationDuration,
    '--document-editor-shadow-surface': theme.shadows.surface,
    '--document-editor-shadow-overlay': theme.shadows.overlay,
  }
}
