import { createStampAsset } from './createStampAsset'

export const SECURITY_STAMPS = [
  createStampAsset({ id: 'security-restricted', title: 'Restricted', category: 'security', description: 'Restrict access to authorized readers.', tags: ['access', 'private', 'classified'], style: 'double-border', icon: 'lock', color: '#b91c1c', background: '#fef2f2' }),
  createStampAsset({ id: 'security-verified', title: 'Verified Secure', category: 'security', description: 'Confirm a security verification.', tags: ['approved', 'checked', 'access'], style: 'badge', icon: 'shield', color: '#047857', background: '#ecfdf5' }),
  createStampAsset({ id: 'security-monitor', title: 'Under Review', category: 'security', description: 'Flag content for security review.', tags: ['watch', 'inspection', 'pending'], style: 'modern', icon: 'eye', color: '#6d28d9', background: '#f5f3ff' }),
  createStampAsset({ id: 'security-denied', title: 'Access Denied', category: 'security', description: 'Indicate denied access.', tags: ['blocked', 'restricted', 'private'], style: 'filled', icon: 'x', color: '#ffffff', background: '#991b1b', border: '#991b1b' }),
]
