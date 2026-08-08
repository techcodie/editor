import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CircleAlert, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  title?: string
  description?: string
  compact?: boolean
  /**
   * Several lazy panels stay mounted after their first open (an intentional
   * instant-reopen tradeoff), so this boundary would otherwise never unmount
   * and a caught error's retry card would keep rendering even after the
   * panel is closed. Pass something that changes when the panel closes (its
   * `isOpen` boolean, or the parent's active-panel id) to clear the error
   * state then, the same way `react-error-boundary`'s `resetKeys` works.
   */
  resetKey?: unknown
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Editor workspace boundary caught an error', error, info)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.reset()
    }
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const title = this.props.title ?? 'The workspace could not be displayed'
    const description =
      this.props.description ?? 'Your document is still safe. Retry this view to continue.'

    return (
      <section
        role="alert"
        className={
          this.props.compact
            ? 'flex h-full min-h-64 flex-col items-center justify-center border border-red-200 bg-white px-6 text-center'
            : 'mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center'
        }
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100">
          <CircleAlert size={20} strokeWidth={1.8} aria-hidden />
        </span>
        <h1 className="mt-4 text-base font-semibold text-neutral-950">{title}</h1>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-neutral-600">{description}</p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-neutral-900 px-3.5 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] hover:bg-neutral-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2"
        >
          <RefreshCw size={14} strokeWidth={2} aria-hidden />
          Retry
        </button>
      </section>
    )
  }
}
