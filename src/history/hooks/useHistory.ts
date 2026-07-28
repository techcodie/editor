import { useCallback, useEffect, useState } from 'react'
import type { DocumentComparison } from '../../comparison/types/comparison'
import type { EditorApi } from '../../lib/editor-api'
import { HISTORY_STORAGE_EVENT } from '../services/historyStorage'
import {
  compareVersionToCurrent,
  compareVersions,
  createVersion,
  deleteVersion,
  exportComparison,
  exportTimeline,
  exportVersion,
  updateVersion,
} from '../services/versionManager'
import { resolveSnapshot } from '../services/snapshotEngine'
import type { HistoryStorageAdapter } from '../types/history'
import type { CreateVersionInput, Version, VersionAuthor } from '../types/version'

interface UseHistoryOptions {
  api: EditorApi | null
  storage: HistoryStorageAdapter
  author: VersionAuthor
}

type SnapshotDetails = Omit<CreateVersionInput, 'author' | 'content' | 'source'>

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Version history could not complete that action.'
}

export function useHistory({ api, storage, author }: UseHistoryOptions) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const reload = () => {
      void storage.load().then((stored) => {
        if (active) setVersions(stored.toSorted((left, right) => right.createdAt - left.createdAt))
      })
    }
    setLoaded(false)
    void storage.load().then((stored) => {
      if (!active) return
      setVersions(stored.toSorted((left, right) => right.createdAt - left.createdAt))
      setLoaded(true)
    }).catch((reason) => {
      if (!active) return
      setError(messageFrom(reason))
      setLoaded(true)
    })
    window.addEventListener(HISTORY_STORAGE_EVENT, reload)
    return () => { active = false; window.removeEventListener(HISTORY_STORAGE_EVENT, reload) }
  }, [storage])

  const persist = useCallback(async (next: Version[]) => {
    await storage.save(next)
    setVersions(next)
  }, [storage])

  const saveSnapshot = useCallback(async (details: SnapshotDetails) => {
    if (!api || saving) return null
    setSaving(true)
    setError(null)
    try {
      const version = await createVersion({
        ...details,
        author,
        content: {
          document: api.getDocumentSnapshot(),
          text: api.getDocumentText(),
        },
      }, versions)
      await persist([version, ...versions])
      return version
    } catch (reason) {
      setError(messageFrom(reason))
      return null
    } finally {
      setSaving(false)
    }
  }, [api, author, persist, saving, versions])

  const restore = useCallback(async (version: Version) => {
    if (!api || saving) return false
    setSaving(true)
    setError(null)
    try {
      const current = {
        document: api.getDocumentSnapshot(),
        text: api.getDocumentText(),
      }
      const recovery = await createVersion({
        name: `Recovery before ${version.name}`,
        description: `Automatic recovery snapshot created before restoring ${version.name}.`,
        reason: 'Restore recovery point',
        comments: `Created automatically before restoring the version from ${new Date(version.createdAt).toLocaleString()}.`,
        author,
        source: 'recovery',
        content: current,
      }, versions)
      const next = [recovery, ...versions]
      await storage.save(next)
      setVersions(next)
      const content = await resolveSnapshot(version, next)
      if (!api.replaceDocumentSnapshot(content.document)) {
        throw new Error('The editor could not restore this version.')
      }
      return true
    } catch (reason) {
      setError(messageFrom(reason))
      return false
    } finally {
      setSaving(false)
    }
  }, [api, author, saving, storage, versions])

  const remove = useCallback(async (versionId: string) => {
    if (saving) return false
    setSaving(true)
    setError(null)
    try {
      const next = await deleteVersion(versions, versionId)
      await persist(next)
      return true
    } catch (reason) {
      setError(messageFrom(reason))
      return false
    } finally {
      setSaving(false)
    }
  }, [persist, saving, versions])

  const update = useCallback(async (
    versionId: string,
    patch: Parameters<typeof updateVersion>[2],
  ) => {
    if (saving) return false
    const next = updateVersion(versions, versionId, patch)
    try {
      await persist(next)
      setError(null)
      return true
    } catch (reason) {
      setError(messageFrom(reason))
      return false
    }
  }, [persist, saving, versions])

  const compareToCurrent = useCallback((version: Version) => {
    if (!api) return Promise.resolve<DocumentComparison | null>(null)
    return compareVersionToCurrent(version, versions, api.getDocumentText())
      .catch((reason) => { setError(messageFrom(reason)); return null })
  }, [api, versions])

  const compareSaved = useCallback((left: Version, right: Version) => (
    compareVersions(left, right, versions)
      .catch((reason) => { setError(messageFrom(reason)); return null })
  ), [versions])

  return {
    versions,
    loaded,
    saving,
    error,
    clearError: () => setError(null),
    saveSnapshot,
    restore,
    remove,
    update,
    compareToCurrent,
    compareSaved,
    exportVersion: (version: Version) => exportVersion(version, versions),
    exportTimeline: () => exportTimeline(versions),
    exportComparison,
  }
}
