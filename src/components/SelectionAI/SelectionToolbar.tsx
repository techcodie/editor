import type { CSSProperties } from 'react'
import { ChevronDown, WandSparkles } from 'lucide-react'
import {
  SELECTION_AI_ACTIONS,
  type SelectionAiAction,
} from '../../../shared/ai'
import type { EditorSelectionBounds } from '../../lib/editor-api'

interface SelectionToolbarProps {
  bounds: EditorSelectionBounds
  onSelect: (action: SelectionAiAction) => void
}

interface ToolbarPosition extends CSSProperties {
  '--selection-ai-left': string
  '--selection-ai-top': string
}

const QUICK_ACTIONS: SelectionAiAction[] = ['improve-writing', 'rewrite', 'simplify']

export function SelectionToolbar({ bounds, onSelect }: SelectionToolbarProps) {
  const center = (bounds.left + bounds.right) / 2
  const left = Math.min(Math.max(center, 170), window.innerWidth - 170)
  const style: ToolbarPosition = {
    '--selection-ai-left': `${left}px`,
    '--selection-ai-top': `${bounds.top - 10}px`,
  }

  return (
    <div
      role="toolbar"
      aria-label="AI actions for selected text"
      style={style}
      className="fixed left-[var(--selection-ai-left)] top-[var(--selection-ai-top)] z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-[0_1px_2px_rgba(20,20,20,0.05),0_16px_36px_-18px_rgba(20,20,20,0.4)] [animation:selection-ai-in_150ms_ease-out] max-sm:bottom-[4.5rem] max-sm:left-3 max-sm:right-3 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:p-1.5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm" aria-hidden>
        <WandSparkles size={15} strokeWidth={1.9} />
      </span>
      {QUICK_ACTIONS.map((actionId, index) => {
        const action = SELECTION_AI_ACTIONS.find(({ id }) => id === actionId)
        if (!action) return null

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelect(action.id)}
            className={`${index > 0 ? 'max-sm:hidden' : ''} inline-flex h-8 shrink-0 items-center rounded-md px-2.5 text-xs font-medium text-neutral-700 transition-[background-color,color,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]`}
          >
            {action.label}
          </button>
        )
      })}
      <div className="relative ml-auto shrink-0">
        <label htmlFor="selection-ai-more-actions" className="sr-only">
          More AI actions
        </label>
        <select
          id="selection-ai-more-actions"
          value=""
          onChange={(event) => {
            if (event.target.value) onSelect(event.target.value as SelectionAiAction)
          }}
          className="h-8 cursor-pointer appearance-none rounded-md border-0 bg-neutral-100 py-0 pl-2.5 pr-7 text-xs font-medium text-neutral-700 outline-none transition-colors hover:bg-neutral-200/70 focus-visible:ring-2 focus-visible:ring-[var(--document-editor-focus-ring)]"
        >
          <option value="">More</option>
          {SELECTION_AI_ACTIONS.filter(({ id }) => id !== 'improve-writing').map((action) => (
            <option key={action.id} value={action.id}>
              {action.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500"
          aria-hidden
        />
      </div>
    </div>
  )
}
