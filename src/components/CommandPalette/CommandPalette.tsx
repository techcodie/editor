import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  FileInput,
  FileSearch,
  ListPlus,
  MessageSquareText,
  PanelRight,
  Search,
  TextCursorInput,
  X,
} from 'lucide-react'

export type WorkspaceCommandId =
  | 'ask-ai'
  | 'upload-source'
  | 'open-preview'
  | 'insert-last-response'
  | 'toggle-sidebar'
  | 'focus-editor'

interface CommandPaletteProps {
  isOpen: boolean
  commands?: readonly WorkspaceCommandId[]
  onClose: () => void
  onSelect: (command: WorkspaceCommandId) => void
}

const COMMANDS = [
  {
    id: 'ask-ai',
    label: 'Ask AI',
    description: 'Open Ask Document and focus the message input',
    icon: MessageSquareText,
  },
  {
    id: 'upload-source',
    label: 'Upload Source',
    description: 'Add a knowledge source to this workspace',
    icon: FileInput,
  },
  {
    id: 'open-preview',
    label: 'Open Preview',
    description: 'Preview the first available knowledge source',
    icon: FileSearch,
  },
  {
    id: 'insert-last-response',
    label: 'Insert Last Response',
    description: 'Insert the latest assistant response at the cursor',
    icon: ListPlus,
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Open or close Ask Document',
    icon: PanelRight,
  },
  {
    id: 'focus-editor',
    label: 'Focus Editor',
    description: 'Move focus back to the document',
    icon: TextCursorInput,
  },
] satisfies Array<{
  id: WorkspaceCommandId
  label: string
  description: string
  icon: typeof Search
}>

export function CommandPalette({
  isOpen,
  commands,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const visibleCommands = useMemo(() => {
    const availableCommands = commands
      ? COMMANDS.filter((command) => commands.includes(command.id))
      : COMMANDS
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return availableCommands
    return availableCommands.filter(
      ({ label, description }) =>
        label.toLocaleLowerCase().includes(normalizedQuery) ||
        description.toLocaleLowerCase().includes(normalizedQuery),
    )
  }, [commands, query])

  useEffect(() => {
    if (!isOpen) return

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setQuery('')
    setActiveIndex(0)
    window.requestAnimationFrame(() => inputRef.current?.focus())

    return () => {
      previousFocus?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeIndex >= visibleCommands.length) setActiveIndex(0)
  }, [activeIndex, visibleCommands.length])

  if (!isOpen) return null

  const runCommand = (command: WorkspaceCommandId) => {
    onClose()
    window.requestAnimationFrame(() => onSelect(command))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (visibleCommands.length === 0) return
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(
        (current) => (current + direction + visibleCommands.length) % visibleCommands.length,
      )
      return
    }

    if (event.key === 'Enter' && visibleCommands[activeIndex]) {
      event.preventDefault()
      runCommand(visibleCommands[activeIndex].id)
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    const first = focusable[0]
    const last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-neutral-950/20 px-3 pt-[12vh] backdrop-blur-[2px] [animation:dialog-backdrop-in_140ms_ease-out] sm:px-6 sm:pt-[15vh]"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        aria-describedby="command-palette-description"
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_24px_70px_-24px_rgba(20,20,20,0.48)] outline-none [animation:command-palette-in_160ms_ease-out]"
      >
        <h2 id="command-palette-title" className="sr-only">
          Workspace commands
        </h2>
        <p id="command-palette-description" className="sr-only">
          Search commands, then use arrow keys and Enter to run one.
        </p>
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4">
          <Search size={17} strokeWidth={1.9} className="shrink-0 text-neutral-400" aria-hidden />
          <label htmlFor="command-palette-search" className="sr-only">
            Search commands
          </label>
          <input
            ref={inputRef}
            id="command-palette-search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="workspace-command-list"
            aria-expanded="true"
            aria-activedescendant={
              visibleCommands[activeIndex]
                ? `workspace-command-${visibleCommands[activeIndex].id}`
                : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            autoComplete="off"
            placeholder="Search commands..."
            className="h-13 min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            title="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
          >
            <X size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div
          id="workspace-command-list"
          role="listbox"
          aria-label="Available commands"
          className="max-h-[min(22rem,55vh)] overflow-y-auto p-1.5"
        >
          {visibleCommands.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-neutral-700">No matching commands</p>
              <p className="mt-1 text-xs text-neutral-500">Try a different search.</p>
            </div>
          ) : (
            visibleCommands.map((command, index) => {
              const Icon = command.icon
              const isActive = index === activeIndex
              return (
                <button
                  key={command.id}
                  id={`workspace-command-${command.id}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runCommand(command.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-700'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-200">
                    <Icon size={15} strokeWidth={1.9} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">{command.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-neutral-500">
                      {command.description}
                    </span>
                  </span>
                  <span className="hidden rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-neutral-400 sm:inline">
                    Enter
                  </span>
                </button>
              )
            })
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-[10px] text-neutral-500">
          <span>Navigate with arrow keys</span>
          <span>Esc to close</span>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
