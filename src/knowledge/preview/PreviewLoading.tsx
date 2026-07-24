export function PreviewLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse px-4 py-8 sm:px-8 sm:py-12" role="status">
      <span className="sr-only">Preparing document preview</span>
      <div className="rounded-lg border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:px-12 sm:py-12">
        <div className="h-7 w-2/5 rounded-md bg-neutral-200" />
        <div className="mt-4 h-4 w-3/5 rounded bg-neutral-100" />
        <div className="mt-10 space-y-3">
          <div className="h-3.5 w-full rounded bg-neutral-100" />
          <div className="h-3.5 w-11/12 rounded bg-neutral-100" />
          <div className="h-3.5 w-4/5 rounded bg-neutral-100" />
          <div className="h-3.5 w-full rounded bg-neutral-100" />
          <div className="h-3.5 w-2/3 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  )
}
