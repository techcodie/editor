import { createStampAsset } from './createStampAsset'

export const FINANCE_STAMPS = [
  createStampAsset({ id: 'finance-paid', title: 'Paid', category: 'finance', description: 'Confirm that payment was received.', tags: ['invoice', 'settled', 'payment'], style: 'filled', icon: 'wallet', color: '#ffffff', background: '#047857', border: '#047857' }),
  createStampAsset({ id: 'finance-due', title: 'Payment Due', category: 'finance', description: 'Flag an outstanding payment.', tags: ['invoice', 'outstanding', 'billing'], style: 'rounded', icon: 'wallet', color: '#b45309', background: '#fffbeb' }),
  createStampAsset({ id: 'finance-audited', title: 'Audited', category: 'finance', description: 'Indicate that records were audited.', tags: ['accounts', 'reviewed', 'verified'], style: 'badge', icon: 'check', color: '#1d4ed8', background: '#eff6ff' }),
  createStampAsset({ id: 'finance-refunded', title: 'Refunded', category: 'finance', description: 'Mark a refunded transaction.', tags: ['return', 'credit', 'payment'], style: 'modern', icon: 'wallet', color: '#6d28d9', background: '#f5f3ff' }),
]
