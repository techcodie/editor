import { createStampAsset } from './createStampAsset'

export const ENGINEERING_STAMPS = [
  createStampAsset({ id: 'engineering-reviewed', title: 'Reviewed', category: 'engineering', description: 'Confirm an engineering review.', tags: ['checked', 'quality', 'inspection'], style: 'modern', icon: 'eye', color: '#0369a1', background: '#f0f9ff' }),
  createStampAsset({ id: 'engineering-revision', title: 'Revision Required', category: 'engineering', description: 'Request technical revisions.', tags: ['changes', 'drawing', 'update'], style: 'rounded', icon: 'wrench', color: '#c2410c', background: '#fff7ed' }),
  createStampAsset({ id: 'engineering-released', title: 'Released', category: 'engineering', description: 'Release a drawing or specification.', tags: ['production', 'drawing', 'final'], style: 'filled', icon: 'check', color: '#ffffff', background: '#0369a1', border: '#0369a1' }),
  createStampAsset({ id: 'engineering-hold', title: 'On Hold', category: 'engineering', description: 'Pause technical work or release.', tags: ['paused', 'blocked', 'pending'], style: 'rubber', color: '#a16207', background: '#fefce8', rotation: -6 }),
]
