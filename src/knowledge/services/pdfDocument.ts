import type { PDFDocumentProxy } from 'pdfjs-dist'

let pdfModulePromise: Promise<typeof import('pdfjs-dist')> | null = null

async function getPdfModule() {
  pdfModulePromise ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjs
  })
  return pdfModulePromise
}

export async function loadPdfDocument(file: File): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfModule()
  const data = await file.arrayBuffer()
  return pdfjs.getDocument({
    data,
    stopAtErrors: true,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  }).promise
}
