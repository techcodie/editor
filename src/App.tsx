import { EditorWorkspace } from './components/EditorWorkspace'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

export default function App() {
  return (
    <main className="min-h-screen w-full bg-[#f6f6f4] text-neutral-950">
      <ErrorBoundary>
        <EditorWorkspace />
      </ErrorBoundary>
    </main>
  )
}
