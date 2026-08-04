/**
 * Central catalog of the SDK's CSS keyframes (defined in src/index.css).
 * Reference these instead of retyping raw `[animation:name_duration_easing]`
 * arbitrary-value strings so every surface stays on the same motion language.
 */
export const MOTION = {
  tooltipIn: '[animation:toolbar-tooltip-in_120ms_ease-out]',
  messageIn: '[animation:ask-message-in_160ms_ease-out]',
  fadeIn: '[animation:selection-ai-in_140ms_ease-out]',
  backdropIn: '[animation:dialog-backdrop-in_160ms_ease-out]',
  dialogIn: '[animation:knowledge-dialog-in_160ms_ease-out]',
  panelIn: '[animation:review-sidebar-in_180ms_ease-out]',
} as const
