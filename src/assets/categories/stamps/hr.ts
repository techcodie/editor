import { createStampAsset } from './createStampAsset'

export const HR_STAMPS = [
  createStampAsset({ id: 'hr-approved', title: 'HR Approved', category: 'hr', description: 'Confirm approval from human resources.', tags: ['people', 'verified', 'policy'], style: 'badge', icon: 'users', color: '#166534', background: '#f0fdf4' }),
  createStampAsset({ id: 'hr-onboarding', title: 'Onboarding', category: 'hr', description: 'Mark onboarding documentation.', tags: ['employee', 'new hire', 'people'], style: 'modern', icon: 'users', color: '#1d4ed8', background: '#eff6ff' }),
  createStampAsset({ id: 'hr-internal', title: 'Internal Only', category: 'hr', description: 'Restrict content to internal teams.', tags: ['private', 'staff', 'restricted'], style: 'outline', icon: 'lock', color: '#7c3aed', background: '#faf5ff' }),
  createStampAsset({ id: 'hr-acknowledged', title: 'Acknowledged', category: 'hr', description: 'Record employee acknowledgement.', tags: ['policy', 'received', 'employee'], style: 'rubber', icon: 'check', color: '#0f766e', background: '#f0fdfa', rotation: -5 }),
]
