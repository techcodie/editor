import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'

interface AssetSearchProps {
  value: string
  onChange: (value: string) => void
}

export const AssetSearch = forwardRef<HTMLInputElement, AssetSearchProps>(
  function AssetSearch({ value, onChange }, ref) {
    return (
      <div className="relative block">
        <label htmlFor="asset-library-search" className="sr-only">Search assets</label>
        <Search
          size={16}
          strokeWidth={1.9}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          id="asset-library-search"
          ref={ref}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search assets"
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-9 text-sm text-neutral-900 outline-none transition-[background-color,border-color,box-shadow] placeholder:text-neutral-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear asset search"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    )
  },
)
