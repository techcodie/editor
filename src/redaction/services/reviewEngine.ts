import type { ClassificationLevel, RedactionDecision, RedactionRecord } from '../types/redaction'

export function decideRedaction(
  record: RedactionRecord,
  decision: Exclude<RedactionDecision, 'pending'>,
  actor: string,
): RedactionRecord {
  const reviewedAt = Date.now()
  return {
    ...record, decision, reviewer: actor, reviewedAt,
    audit: [...record.audit, {
      id: crypto.randomUUID(), action: decision === 'restored' ? 'restored' : decision,
      actor, createdAt: reviewedAt, detail: `Redaction ${decision}.`,
    }],
  }
}

export function addRedactionComment(record: RedactionRecord, text: string, actor: string): RedactionRecord {
  const createdAt = Date.now()
  const value = text.trim().slice(0, 1_000)
  if (!value) return record
  return {
    ...record,
    comments: [...record.comments, { id: crypto.randomUUID(), author: actor, text: value, createdAt }],
    audit: [...record.audit, { id: crypto.randomUUID(), action: 'commented', actor, createdAt, detail: 'Added a review comment.' }],
  }
}

export function setRedactionClassification(
  record: RedactionRecord,
  classification: ClassificationLevel,
  actor: string,
): RedactionRecord {
  if (record.classification === classification) return record
  const createdAt = Date.now()
  return {
    ...record, classification,
    audit: [...record.audit, { id: crypto.randomUUID(), action: 'classified', actor, createdAt, detail: `Classified as ${classification}.` }],
  }
}
