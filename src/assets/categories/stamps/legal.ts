import { createStampAsset } from './createStampAsset'

export const LEGAL_STAMPS = [
  createStampAsset({ id: 'legal-confidential', title: 'Confidential', category: 'legal', description: 'Mark legally sensitive material.', tags: ['private', 'restricted', 'nda'], style: 'double-border', icon: 'lock', color: '#b91c1c', background: '#fff1f2' }),
  createStampAsset({ id: 'legal-privileged', title: 'Privileged', category: 'legal', description: 'Identify privileged communication.', tags: ['attorney', 'protected', 'private'], style: 'outline', icon: 'shield', color: '#7c3aed', background: '#faf5ff' }),
  createStampAsset({ id: 'legal-executed', title: 'Executed', category: 'legal', description: 'Mark an agreement as executed.', tags: ['contract', 'signed', 'complete'], style: 'vintage', icon: 'signature', color: '#334155', background: '#f8fafc', rotation: -5 }),
  createStampAsset({ id: 'legal-void', title: 'Void', category: 'legal', description: 'Invalidate a document or clause.', tags: ['cancelled', 'invalid', 'contract'], style: 'diagonal', icon: 'x', color: '#be123c', background: '#fff1f2', rotation: -11 }),
]
