import type { SensitiveDataDetection, SensitiveDataType } from './detection'

export type ClassificationLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'highly-confidential'

export type RedactionStyle =
  | 'black-box'
  | 'blur'
  | 'mask'
  | 'label'
  | 'placeholder'
  | 'temporary-hide'

export type RedactionDecision = 'pending' | 'approved' | 'rejected' | 'restored'

export interface RedactionComment {
  id: string
  author: string
  text: string
  createdAt: number
}

export interface RedactionAuditEntry {
  id: string
  action: 'created' | 'approved' | 'rejected' | 'restored' | 'commented' | 'classified'
  actor: string
  createdAt: number
  detail: string
}

export interface RedactionRecord {
  id: string
  detection: SensitiveDataDetection
  classification: ClassificationLevel
  style: RedactionStyle
  replacement: string
  decision: RedactionDecision
  reviewer: string | null
  reviewedAt: number | null
  snapshotId: string | null
  comments: RedactionComment[]
  audit: RedactionAuditEntry[]
  createdAt: number
}

export interface RedactionSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  restored: number
  byClassification: Partial<Record<ClassificationLevel, number>>
}

export const CLASSIFICATION_LABELS: Record<ClassificationLevel, string> = {
  public: 'Public',
  internal: 'Internal',
  confidential: 'Confidential',
  restricted: 'Restricted',
  'highly-confidential': 'Highly Confidential',
}

export const REDACTION_STYLE_LABELS: Record<RedactionStyle, string> = {
  'black-box': 'Black Box',
  blur: 'Blur',
  mask: 'Mask',
  label: 'Replace with Label',
  placeholder: 'Replace with Placeholder',
  'temporary-hide': 'Temporary Hide',
}

export const SENSITIVE_DATA_LABELS: Record<SensitiveDataType, string> = {
  name: 'Name', address: 'Address', email: 'Email', phone: 'Phone',
  'national-id': 'National ID', passport: 'Passport', 'driver-license': 'Driver Licence',
  'bank-account': 'Bank Account', 'credit-card': 'Credit Card', 'tax-id': 'Tax ID',
  'medical-record': 'Medical Record', 'company-secret': 'Company Secret', 'api-key': 'API Key',
  password: 'Password', token: 'Token', 'confidential-clause': 'Confidential Clause', custom: 'Custom',
}
