import type { FormDefinition } from '../../forms/types/form'
import type { FormFieldValue } from '../../forms/types/field'

export type DocumentViewMode =
  | 'editor'
  | 'pdf-preview'
  | 'carousel'
  | 'book'
  | 'reading'

export type ViewerZoom = 50 | 75 | 100 | 125 | 150

export interface ViewerPage {
  number: number
  text: string
}

export interface FormShareOptions {
  title: string
  description?: string
  documentText?: string
}

export interface FormShareArtifact {
  id: string
  form: FormDefinition
  html: string
  blob: Blob
  url: string
  fileName: string
}

export interface FormSubmission {
  shareId: string
  formId: string
  submittedAt: number
  values: Record<string, FormFieldValue>
}

export interface FormSubmissionMessage {
  type: 'techcodie:form-submit'
  payload: FormSubmission
}
