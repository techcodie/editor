import { createStampAsset } from './createStampAsset'

export const SIGNATURE_STAMPS = [
  createStampAsset({ id: 'signature-signed', title: 'Signed', category: 'signature', description: 'Mark a document as signed.', tags: ['executed', 'signature', 'complete'], style: 'circular', icon: 'signature', color: '#1d4ed8', background: '#eff6ff', width: 150, height: 150 }),
  createStampAsset({ id: 'signature-witnessed', title: 'Witnessed', category: 'signature', description: 'Mark a signature as witnessed.', tags: ['verified', 'signature', 'legal'], style: 'badge', icon: 'eye', color: '#6d28d9', background: '#faf5ff' }),
  createStampAsset({ id: 'signature-authorized', title: 'Authorized', category: 'signature', description: 'Confirm an authorized signature.', tags: ['signature', 'approved', 'permission'], style: 'modern', icon: 'signature', color: '#047857', background: '#ecfdf5' }),
  createStampAsset({ id: 'signature-pending', title: 'Signature Pending', category: 'signature', description: 'Flag a document awaiting signature.', tags: ['signature', 'waiting', 'incomplete'], style: 'rounded', icon: 'signature', color: '#b45309', background: '#fffbeb' }),
]
