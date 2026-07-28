import type { EditorApi } from '../../lib/editor-api'
import { createHistoryStorage } from '../../history/services/historyStorage'
import { createVersion } from '../../history/services/versionManager'

export async function saveCollaborationCheckpoint(
  api: EditorApi,
  namespace: string,
  author: { id: string; name: string },
): Promise<void> {
  const storage = createHistoryStorage(namespace)
  const versions = await storage.load()
  const version = await createVersion({
    name: `Collaboration checkpoint ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    description: 'Automatic checkpoint after a collaborative editing session update.',
    reason: 'Collaborative document synchronization',
    comments: 'Created automatically after remote changes settled.',
    author,
    source: 'collaboration',
    content: {
      document: api.getDocumentSnapshot(),
      text: api.getDocumentText(),
    },
  }, versions)
  if (versions[0]?.documentHash !== version.documentHash) {
    await storage.save([version, ...versions])
  }
}
