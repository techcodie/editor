import type { CSSProperties } from 'react'
import type { DocumentEditorTheme } from './types'

interface ThemeVariables extends CSSProperties {
  '--document-editor-background': string
  '--document-editor-surface': string
  '--document-editor-text': string
  '--document-editor-muted-text': string
  '--document-editor-border': string
  '--document-editor-border-strong': string
  '--document-editor-accent': string
  '--document-editor-selection': string
  '--document-editor-hover-surface': string
  '--document-editor-active-surface': string
  '--document-editor-focus-ring': string
  '--document-editor-danger': string
  '--document-editor-danger-surface': string
  '--document-editor-warning': string
  '--document-editor-warning-surface': string
  '--document-editor-success': string
  '--document-editor-success-surface': string
  '--document-editor-info': string
  '--document-editor-info-surface': string
  '--document-editor-font-family': string
  '--document-editor-font-size': string
  '--document-editor-workspace-spacing': string
  '--document-editor-panel-gap': string
  '--document-editor-radius-sm': string
  '--document-editor-radius-md': string
  '--document-editor-radius-lg': string
  '--document-editor-animation-duration': string
  '--document-editor-shadow-surface': string
  '--document-editor-shadow-raised': string
  '--document-editor-shadow-overlay': string
}

export function createThemeVariables(theme: DocumentEditorTheme): ThemeVariables {
  return {
    '--document-editor-background': theme.colors.background,
    '--document-editor-surface': theme.colors.surface,
    '--document-editor-text': theme.colors.text,
    '--document-editor-muted-text': theme.colors.mutedText,
    '--document-editor-border': theme.colors.border,
    '--document-editor-border-strong': theme.colors.borderStrong,
    '--document-editor-accent': theme.colors.accent,
    '--document-editor-selection': theme.colors.selection,
    '--document-editor-hover-surface': theme.colors.hoverSurface,
    '--document-editor-active-surface': theme.colors.activeSurface,
    '--document-editor-focus-ring': theme.colors.focusRing,
    '--document-editor-danger': theme.colors.danger,
    '--document-editor-danger-surface': theme.colors.dangerSurface,
    '--document-editor-warning': theme.colors.warning,
    '--document-editor-warning-surface': theme.colors.warningSurface,
    '--document-editor-success': theme.colors.success,
    '--document-editor-success-surface': theme.colors.successSurface,
    '--document-editor-info': theme.colors.info,
    '--document-editor-info-surface': theme.colors.infoSurface,
    '--document-editor-font-family': theme.typography.fontFamily,
    '--document-editor-font-size': theme.typography.editorFontSize,
    '--document-editor-workspace-spacing': theme.spacing.workspace,
    '--document-editor-panel-gap': theme.spacing.panelGap,
    '--document-editor-radius-sm': theme.radius.small,
    '--document-editor-radius-md': theme.radius.medium,
    '--document-editor-radius-lg': theme.radius.large,
    '--document-editor-animation-duration': theme.animationDuration,
    '--document-editor-shadow-surface': theme.shadows.surface,
    '--document-editor-shadow-raised': theme.shadows.raised,
    '--document-editor-shadow-overlay': theme.shadows.overlay,
  }
}
