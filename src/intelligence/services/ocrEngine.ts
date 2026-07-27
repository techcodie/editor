import type { OCROptions, OCRPageResult } from '../types/ocr'

function abortError(): DOMException {
  return new DOMException('Document recognition was cancelled.', 'AbortError')
}

export async function recognizeImage(
  image: File | Blob | HTMLCanvasElement,
  options: OCROptions = {},
): Promise<OCRPageResult> {
  if (options.signal?.aborted) throw abortError()
  const { createWorker } = await import('tesseract.js')
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null
  const handleAbort = () => {
    if (worker) void worker.terminate().catch(() => undefined)
  }
  options.signal?.addEventListener('abort', handleAbort, { once: true })

  try {
    worker = await createWorker(options.language ?? 'eng', undefined, {
      logger: (message) => {
        options.onProgress?.({
          status: message.status,
          progress: Math.max(0, Math.min(1, message.progress)),
        })
      },
    })
    if (options.signal?.aborted) throw abortError()
    const result = await worker.recognize(
      image,
      {},
      { blocks: true, text: true },
    )
    if (options.signal?.aborted) throw abortError()

    const width = options.width ?? 1
    const height = options.height ?? 1
    const pageNumber = options.pageNumber ?? 1
    const regions = (result.data.blocks ?? []).flatMap((block) =>
      block.paragraphs
        .filter((paragraph) => paragraph.text.trim())
        .map((paragraph) => ({
          id: crypto.randomUUID(),
          pageNumber,
          text: paragraph.text.trim(),
          confidence: paragraph.confidence,
          boundingBox: {
            x: paragraph.bbox.x0,
            y: paragraph.bbox.y0,
            width: paragraph.bbox.x1 - paragraph.bbox.x0,
            height: paragraph.bbox.y1 - paragraph.bbox.y0,
            pageWidth: width,
            pageHeight: height,
          },
        })),
    )

    return {
      pageNumber,
      text: result.data.text.trim(),
      confidence: result.data.confidence,
      width,
      height,
      regions,
    }
  } catch (error) {
    if (options.signal?.aborted) throw abortError()
    throw error
  } finally {
    options.signal?.removeEventListener('abort', handleAbort)
    if (worker) await worker.terminate().catch(() => undefined)
  }
}
