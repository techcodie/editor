export interface FrameStreamBuffer {
  push(content: string): void
  flush(): void
  cancel(): void
}

export function createFrameStreamBuffer(onFlush: (content: string) => void): FrameStreamBuffer {
  let pending = ''
  let frameId: number | null = null

  const flush = () => {
    if (frameId !== null) window.cancelAnimationFrame(frameId)
    frameId = null
    if (!pending) return
    const content = pending
    pending = ''
    onFlush(content)
  }

  return {
    push(content) {
      pending += content
      frameId ??= window.requestAnimationFrame(flush)
    },
    flush,
    cancel() {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      frameId = null
      pending = ''
    },
  }
}
