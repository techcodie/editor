import { createStampAsset } from './createStampAsset'

export const WORKFLOW_STAMPS = [
  createStampAsset({ id: 'workflow-approved', title: 'Approved', category: 'workflow', description: 'Mark work as approved.', tags: ['accept', 'complete', 'verified'], style: 'rubber', icon: 'check', color: '#15803d', background: '#f0fdf4', rotation: -7 }),
  createStampAsset({ id: 'workflow-draft', title: 'Draft', category: 'workflow', description: 'Identify work still in progress.', tags: ['working', 'review', 'unfinished'], style: 'diagonal', color: '#b45309', background: '#fffbeb', rotation: -9 }),
  createStampAsset({ id: 'workflow-final', title: 'Final', category: 'workflow', description: 'Mark a final deliverable.', tags: ['complete', 'release', 'done'], style: 'double-border', icon: 'check', color: '#1d4ed8', background: '#eff6ff' }),
  createStampAsset({ id: 'workflow-rejected', title: 'Rejected', category: 'workflow', description: 'Mark work that was not accepted.', tags: ['declined', 'failed', 'review'], style: 'outline', icon: 'x', color: '#b91c1c', background: '#fef2f2', rotation: -6 }),
]
