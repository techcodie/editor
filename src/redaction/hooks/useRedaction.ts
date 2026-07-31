import { useCallback, useMemo, useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import { createHistoryStorage } from '../../history/services/historyStorage'
import { createVersion } from '../../history/services/versionManager'
import type { VersionAuthor } from '../../history/types/version'
import { createRedaction, summarizeRedactions, updateRedactionStyle } from '../services/redactionEngine'
import { addRedactionComment, decideRedaction, setRedactionClassification } from '../services/reviewEngine'
import type { SensitiveDataDetection } from '../types/detection'
import type { ClassificationLevel, RedactionRecord, RedactionStyle } from '../types/redaction'
import type { IdentityAuditInput } from '../../identity/types/identity'

export function useRedaction({ api, namespace, author, onAudit }: { api: EditorApi | null; namespace: string; author: VersionAuthor; onAudit?: (input: IdentityAuditInput) => void }) {
  const [records, setRecords] = useState<RedactionRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const summary = useMemo(() => summarizeRedactions(records), [records])

  const createRecoverySnapshot = useCallback(async (detection: SensitiveDataDetection) => {
    if (!api) return null
    const storage = createHistoryStorage(namespace)
    const versions = await storage.load()
    const version = await createVersion({
      name: `Redaction restore point: ${detection.label}`,
      description: 'Automatic snapshot created before a redaction entered review.',
      reason: 'Sensitive data redaction review',
      comments: `Protected range ${detection.range.from}-${detection.range.to}.`,
      author, source: 'redaction',
      content: { document: api.getDocumentSnapshot(), text: api.getDocumentText() },
    }, versions)
    await storage.save([version, ...versions])
    return version.id
  }, [api, author, namespace])

  const add = useCallback(async (detection: SensitiveDataDetection) => {
    if (records.some((record) => record.detection.range.from === detection.range.from && record.detection.range.to === detection.range.to && record.decision !== 'restored')) return null
    try {
      const snapshotId = await createRecoverySnapshot(detection)
      const record = createRedaction(detection, { actor: author.name, snapshotId })
      setRecords((current) => [...current, record])
      onAudit?.({
        category: 'redaction',
        action: 'redaction.created',
        outcome: 'success',
        resourceId: record.id,
        details: { type: detection.type },
      })
      return record
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The redaction restore point could not be created.')
      onAudit?.({
        category: 'redaction',
        action: 'redaction.create',
        outcome: 'failure',
        details: { type: detection.type },
      })
      return null
    }
  }, [author.name, createRecoverySnapshot, onAudit, records])

  const update = useCallback((id: string, updater: (record: RedactionRecord) => RedactionRecord) => {
    setRecords((current) => current.map((record) => record.id === id ? updater(record) : record))
  }, [])

  return {
    records, summary, error, clearError: () => setError(null), add,
    setStyle: (id: string, style: RedactionStyle) => {
      update(id, (record) => updateRedactionStyle(record, style))
      onAudit?.({
        category: 'redaction',
        action: 'redaction.style-updated',
        outcome: 'success',
        resourceId: id,
        details: { style },
      })
    },
    setClassification: (id: string, level: ClassificationLevel) => {
      update(id, (record) => setRedactionClassification(record, level, author.name))
      onAudit?.({
        category: 'redaction',
        action: 'redaction.classified',
        outcome: 'success',
        resourceId: id,
        details: { level },
      })
    },
    decide: (id: string, decision: 'approved' | 'rejected' | 'restored') => {
      update(id, (record) => decideRedaction(record, decision, author.name))
      onAudit?.({
        category: 'redaction',
        action: `redaction.${decision}`,
        outcome: 'success',
        resourceId: id,
      })
    },
    addComment: (id: string, text: string) => {
      update(id, (record) => addRedactionComment(record, text, author.name))
      onAudit?.({
        category: 'redaction',
        action: 'redaction.comment-added',
        outcome: 'success',
        resourceId: id,
      })
    },
  }
}
