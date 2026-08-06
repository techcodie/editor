import type { FormField, FormFieldValue } from '../../forms/types/field'
import type { FormDefinition } from '../../forms/types/form'
import type {
  FormShareArtifact,
  FormShareOptions,
  FormSubmissionMessage,
} from '../types/viewer'

export const FORM_SUBMISSION_MESSAGE = 'techcodie:form-submit' as const

export function getFormSubmissionChannelName(shareId: string): string {
  return `${FORM_SUBMISSION_MESSAGE}:${shareId}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeFileName(value: string): string {
  const safe = value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '')
  return `${safe || 'document-form'}.html`
}

function constraints(field: FormField): string {
  const validation = field.validation
  return [
    field.required ? ' required' : '',
    field.readonly ? ' readonly' : '',
    validation.minLength === undefined ? '' : ` minlength="${validation.minLength}"`,
    validation.maxLength === undefined ? '' : ` maxlength="${validation.maxLength}"`,
    validation.pattern ? ` pattern="${escapeHtml(validation.pattern)}"` : '',
  ].join('')
}

function renderField(field: FormField): string {
  if (field.visibility === 'hidden') return ''
  const id = escapeHtml(field.id)
  const label = escapeHtml(field.label || 'Unlabelled field')
  const placeholder = escapeHtml(field.placeholder)
  const required = field.required ? '<span aria-hidden="true"> *</span>' : ''
  const help = field.helpText
    ? `<small id="${id}-help">${escapeHtml(field.helpText)}</small>`
    : ''
  const describedBy = field.helpText ? ` aria-describedby="${id}-help"` : ''
  let control = ''

  if (field.type === 'paragraph') {
    control = `<textarea id="${id}" name="${id}" placeholder="${placeholder}"${constraints(field)}${describedBy}>${escapeHtml(String(field.defaultValue))}</textarea>`
  } else if (field.type === 'checkbox') {
    control = `<label class="choice"><input id="${id}" name="${id}" type="checkbox"${field.defaultValue ? ' checked' : ''}${field.required ? ' required' : ''}${field.readonly ? ' disabled' : ''}> ${placeholder || label}</label>`
  } else if (field.type === 'radio-group') {
    control = `<fieldset><legend class="sr-only">${label}</legend>${field.options.map((option) => `<label class="choice"><input type="radio" name="${id}" value="${escapeHtml(option.value)}"${field.defaultValue === option.value ? ' checked' : ''}${field.required ? ' required' : ''}${field.readonly ? ' disabled' : ''}> ${escapeHtml(option.label)}</label>`).join('')}</fieldset>`
  } else if (field.type === 'dropdown') {
    control = `<select id="${id}" name="${id}"${field.required ? ' required' : ''}${field.readonly ? ' disabled' : ''}${describedBy}><option value="">${placeholder || 'Select an option'}</option>${field.options.map((option) => `<option value="${escapeHtml(option.value)}"${field.defaultValue === option.value ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select>`
  } else if (field.type === 'signature' || field.type === 'initials') {
    control = `<input id="${id}" name="${id}" type="text" placeholder="${placeholder || label}"${constraints(field)}${describedBy}>`
  } else if (field.type === 'file-upload') {
    control = `<input id="${id}" name="${id}" type="file"${field.required ? ' required' : ''}${field.readonly ? ' disabled' : ''}${describedBy}>`
  } else {
    const type = field.type === 'phone'
      ? 'tel'
      : field.type === 'currency'
        ? 'number'
        : field.type
    control = `<input id="${id}" name="${id}" type="${type}" value="${escapeHtml(String(field.defaultValue))}" placeholder="${placeholder}"${constraints(field)}${describedBy}>`
  }

  return `<div class="field" style="--field-width:${field.width}%"><label for="${id}">${label}${required}</label>${control}${help}</div>`
}

export function createFormShareHtml(
  form: FormDefinition,
  options: FormShareOptions,
  shareId = crypto.randomUUID(),
): string {
  const title = escapeHtml(options.title || form.title)
  const description = options.description?.trim()
    ? `<p class="description">${escapeHtml(options.description.trim())}</p>`
    : ''
  const template = options.documentText?.trim()
    ? `<section class="template" aria-label="Read-only document template"><h2>Document</h2><div>${escapeHtml(options.documentText.trim()).replaceAll('\n', '<br>')}</div></section>`
    : ''
  const empty = form.fields.length === 0
    ? '<p class="empty">This document does not contain any form fields.</p>'
    : ''
  let submissionTargetOrigin: string | null = null
  if (options.submissionTargetOrigin) {
    try {
      const target = new URL(options.submissionTargetOrigin)
      if (target.protocol === 'http:' || target.protocol === 'https:') {
        submissionTargetOrigin = target.origin
      }
    } catch {
      // Invalid origins disable the optional cross-window callback.
    }
  }
  const scriptConfig = JSON.stringify({
    shareId,
    formId: form.id,
    messageType: FORM_SUBMISSION_MESSAGE,
    channelName: getFormSubmissionChannelName(shareId),
    submissionTargetOrigin,
  }).replaceAll('<', '\\u003c')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>*{box-sizing:border-box}html{color-scheme:light dark;background:#f4f4f2}body{margin:0;color:#171717;font:15px/1.6 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{width:min(760px,calc(100% - 32px));margin:32px auto}.header{margin-bottom:24px}.eyebrow{margin:0 0 5px;color:#6366f1;font-size:12px;font-weight:700;text-transform:uppercase}h1{margin:0;font-size:28px;line-height:1.2}h2{margin:0 0 12px;font-size:15px}.description{margin:8px 0 0;color:#666}.template{margin-bottom:18px;padding:20px;border:1px solid #ddd;border-radius:8px;background:#fff}.template div{max-height:220px;overflow:auto;white-space:normal;color:#555}.form{padding:24px;border:1px solid #ddd;border-radius:8px;background:#fff;box-shadow:0 18px 50px -36px #0008}.fields{display:flex;flex-wrap:wrap;gap:18px 16px}.field{width:var(--field-width);max-width:100%;min-width:min(100%,220px)}label,legend{display:block;margin-bottom:6px;font-size:13px;font-weight:650}input:not([type=checkbox]):not([type=radio]),textarea,select{width:100%;min-height:42px;padding:9px 11px;border:1px solid #bbb;border-radius:6px;background:#fff;color:#171717;font:inherit}textarea{min-height:110px;resize:vertical}.choice{display:flex;align-items:center;gap:8px;font-weight:500}fieldset{margin:0;padding:0;border:0}.field small{display:block;margin-top:5px;color:#666}.submit{width:100%;min-height:44px;margin-top:22px;border:0;border-radius:6px;background:#171717;color:#fff;font:inherit;font-weight:700;cursor:pointer}.submit:hover{background:#303030}.submit:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #6366f155;outline-offset:2px}.status{min-height:24px;margin:12px 0 0;text-align:center;color:#166534}.empty{padding:18px;border:1px dashed #ccc;border-radius:6px;text-align:center;color:#666}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.shell{width:min(100% - 20px,760px);margin:18px auto}.form,.template{padding:18px}.field{width:100%}h1{font-size:23px}}@media(prefers-color-scheme:dark){html{background:#171717}body{color:#f5f5f5}.form,.template{border-color:#404040;background:#242424}.description,.template div,.field small,.empty{color:#b8b8b8}input:not([type=checkbox]):not([type=radio]),textarea,select{border-color:#555;background:#1c1c1c;color:#f5f5f5}.submit{background:#f5f5f5;color:#171717}.submit:hover{background:#ddd}}</style></head>
<body><main class="shell"><header class="header"><p class="eyebrow">Shared form</p><h1>${title}</h1>${description}</header>${template}<form class="form" id="shared-form"><div class="fields">${form.fields.map(renderField).join('')}</div>${empty}${form.fields.length ? '<button class="submit" type="submit">Submit form</button>' : ''}<p class="status" id="form-status" role="status" aria-live="polite"></p></form></main>
<script>const config=${scriptConfig};const form=document.getElementById('shared-form');form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);const values={};for(const [key,value] of data.entries())values[key]=value instanceof File?value.name:value;for(const checkbox of form.querySelectorAll('input[type=checkbox]'))values[checkbox.name]=checkbox.checked;const payload={shareId:config.shareId,formId:config.formId,submittedAt:Date.now(),values};const message={type:config.messageType,payload};window.dispatchEvent(new CustomEvent(config.messageType,{detail:payload}));if(typeof BroadcastChannel==='function'){const channel=new BroadcastChannel(config.channelName);channel.postMessage(message);channel.close()}if(config.submissionTargetOrigin&&window.opener&&!window.opener.closed)window.opener.postMessage(message,config.submissionTargetOrigin);document.getElementById('form-status').textContent='Submission sent to the host application.';});</script></body></html>`
}

export function createFormShareArtifact(
  form: FormDefinition,
  options: FormShareOptions,
): FormShareArtifact {
  const id = crypto.randomUUID()
  const html = createFormShareHtml(form, options, id)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return {
    id,
    form,
    html,
    blob,
    url: URL.createObjectURL(blob),
    fileName: safeFileName(options.title || form.title),
  }
}

export function revokeFormShareArtifact(artifact: FormShareArtifact | null): void {
  if (artifact) URL.revokeObjectURL(artifact.url)
}

export function isFormSubmissionMessage(value: unknown): value is FormSubmissionMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<FormSubmissionMessage>
  const payload = message.payload
  return Boolean(
    message.type === FORM_SUBMISSION_MESSAGE &&
    payload &&
    typeof payload.shareId === 'string' &&
    typeof payload.formId === 'string' &&
    typeof payload.submittedAt === 'number' &&
    payload.values &&
    typeof payload.values === 'object' &&
    !Array.isArray(payload.values),
  )
}

export function normalizeSubmissionValues(
  values: Record<string, FormFieldValue>,
): Record<string, FormFieldValue> {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? [[key, value]]
        : [],
    ),
  )
}
