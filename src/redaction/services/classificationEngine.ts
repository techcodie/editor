import type { SensitiveDataDetection, SensitiveDataType } from '../types/detection'
import type { ClassificationLevel } from '../types/redaction'

const DEFAULT_CLASSIFICATIONS: Record<SensitiveDataType, ClassificationLevel> = {
  name: 'confidential', address: 'confidential', email: 'confidential', phone: 'confidential',
  'national-id': 'highly-confidential', passport: 'highly-confidential',
  'driver-license': 'highly-confidential', 'bank-account': 'highly-confidential',
  'credit-card': 'highly-confidential', 'tax-id': 'restricted',
  'medical-record': 'highly-confidential', 'company-secret': 'restricted',
  'api-key': 'highly-confidential', password: 'highly-confidential', token: 'highly-confidential',
  'confidential-clause': 'restricted', custom: 'confidential',
}

export function classifyDetection(detection: SensitiveDataDetection): ClassificationLevel {
  return DEFAULT_CLASSIFICATIONS[detection.type]
}

export function validateClassification(
  detection: SensitiveDataDetection,
  classification: ClassificationLevel,
): { valid: boolean; recommendation: ClassificationLevel } {
  const recommendation = classifyDetection(detection)
  const levels: ClassificationLevel[] = ['public', 'internal', 'confidential', 'restricted', 'highly-confidential']
  return { valid: levels.indexOf(classification) >= levels.indexOf(recommendation), recommendation }
}
