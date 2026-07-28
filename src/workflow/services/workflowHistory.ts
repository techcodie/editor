import type { EditorApi } from '../../lib/editor-api'
import { createHistoryStorage } from '../../history/services/historyStorage'
import { createVersion } from '../../history/services/versionManager'
import type { VersionAuthor } from '../../history/types/version'
import type { Workflow, WorkflowStatus } from '../types/workflow'
import type { WorkflowHistoryEntry } from '../types/approval'

export interface WorkflowHistoryGroup { id: string; label: string; entries: WorkflowHistoryEntry[] }

export function groupWorkflowHistory(entries: WorkflowHistoryEntry[]): WorkflowHistoryGroup[] {
  const groups = new Map<string, WorkflowHistoryGroup>()
  for (const item of entries) {
    const date = new Date(item.timestamp)
    const id = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    const group = groups.get(id) ?? { id, label: date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), entries: [] }
    group.entries.push(item)
    groups.set(id, group)
  }
  return [...groups.values()]
}

export function workflowStatusLabel(status: WorkflowStatus): string {
  return ({ draft: 'Draft', 'in-review': 'In Review', 'changes-requested': 'Changes Requested', approved: 'Approved', rejected: 'Rejected', archived: 'Archived' })[status]
}

export async function createWorkflowSnapshot(
  api: EditorApi,
  namespace: string,
  author: VersionAuthor,
  workflow: Workflow,
  actionLabel: string,
): Promise<string> {
  const storage = createHistoryStorage(namespace)
  const versions = (await storage.load()).toSorted((left, right) => right.createdAt - left.createdAt)
  const stage = workflow.stages[workflow.currentStage]
  const version = await createVersion({
    name: `${workflow.name}: ${actionLabel}`,
    description: `Workflow snapshot before ${actionLabel.toLocaleLowerCase()}${stage ? ` in ${stage.name}` : ''}.`,
    reason: 'Approval workflow decision',
    comments: `Workflow ${workflow.id}`,
    author,
    source: 'workflow',
    content: { document: api.getDocumentSnapshot(), text: api.getDocumentText() },
  }, versions)
  await storage.save([version, ...versions])
  return version.id
}
