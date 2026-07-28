import type { Workflow, WorkflowStoragePayload } from '../types/workflow'

const WORKFLOW_PREFIX = 'techcodie:editor:workflow:v1'
export const WORKFLOW_STORAGE_EVENT = 'techcodie:workflow-storage'

function keyFor(namespace: string) { return `${WORKFLOW_PREFIX}:${namespace}` }

function isWorkflow(value: unknown): value is Workflow {
  return Boolean(value && typeof value === 'object' && 'id' in value && 'status' in value && 'stages' in value)
}

export async function loadWorkflow(namespace: string): Promise<Workflow | null> {
  try {
    const value = window.localStorage.getItem(keyFor(namespace))
    if (!value) return null
    const payload = JSON.parse(value) as Partial<WorkflowStoragePayload>
    return payload.formatVersion === 1 && isWorkflow(payload.workflow) ? structuredClone(payload.workflow) : null
  } catch { return null }
}

export async function saveWorkflow(namespace: string, workflow: Workflow | null): Promise<void> {
  const payload: WorkflowStoragePayload = { formatVersion: 1, updatedAt: Date.now(), workflow: workflow ? structuredClone(workflow) : null }
  try {
    window.localStorage.setItem(keyFor(namespace), JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(WORKFLOW_STORAGE_EVENT, { detail: { namespace } }))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') throw new Error('Local workflow storage is full.')
  }
}

export async function clearWorkflow(namespace: string): Promise<void> {
  try { window.localStorage.removeItem(keyFor(namespace)) } catch { /* Local storage is optional. */ }
  window.dispatchEvent(new CustomEvent(WORKFLOW_STORAGE_EVENT, { detail: { namespace } }))
}

export function serializeWorkflow(workflow: Workflow): string {
  return JSON.stringify({ format: 'techcodie-approval-workflow', workflow }, null, 2)
}
