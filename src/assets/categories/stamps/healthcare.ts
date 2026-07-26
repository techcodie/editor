import { createStampAsset } from './createStampAsset'

export const HEALTHCARE_STAMPS = [
  createStampAsset({ id: 'healthcare-reviewed', title: 'Clinical Review', category: 'healthcare', description: 'Confirm a clinical review.', tags: ['medical', 'patient', 'verified'], style: 'badge', icon: 'heart', color: '#be123c', background: '#fff1f2' }),
  createStampAsset({ id: 'healthcare-urgent', title: 'Urgent', category: 'healthcare', description: 'Flag time-sensitive healthcare content.', tags: ['priority', 'medical', 'immediate'], style: 'filled', icon: 'heart', color: '#ffffff', background: '#dc2626', border: '#dc2626' }),
  createStampAsset({ id: 'healthcare-private', title: 'Patient Private', category: 'healthcare', description: 'Mark protected patient information.', tags: ['phi', 'confidential', 'medical'], style: 'double-border', icon: 'lock', color: '#7e22ce', background: '#faf5ff' }),
  createStampAsset({ id: 'healthcare-cleared', title: 'Medically Cleared', category: 'healthcare', description: 'Indicate medical clearance.', tags: ['approved', 'patient', 'fitness'], style: 'rounded', icon: 'check', color: '#047857', background: '#ecfdf5' }),
]
