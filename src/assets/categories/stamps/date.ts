import { createStampAsset } from './createStampAsset'

export const DATE_STAMPS = [
  createStampAsset({ id: 'date-received', title: 'Date Received', text: 'DATE RECEIVED', category: 'date', description: 'Reserve a received-date marker.', tags: ['calendar', 'intake', 'received'], style: 'outline', icon: 'calendar', color: '#334155', background: '#f8fafc' }),
  createStampAsset({ id: 'date-filed', title: 'Date Filed', text: 'DATE FILED', category: 'date', description: 'Reserve a filing-date marker.', tags: ['calendar', 'records', 'filed'], style: 'vintage', icon: 'calendar', color: '#1d4ed8', background: '#eff6ff' }),
  createStampAsset({ id: 'date-reviewed', title: 'Date Reviewed', text: 'DATE REVIEWED', category: 'date', description: 'Reserve a review-date marker.', tags: ['calendar', 'review', 'checked'], style: 'rounded', icon: 'calendar', color: '#047857', background: '#ecfdf5' }),
  createStampAsset({ id: 'date-expired', title: 'Expired', category: 'date', description: 'Mark expired material.', tags: ['calendar', 'invalid', 'past due'], style: 'diagonal', icon: 'calendar', color: '#b91c1c', background: '#fef2f2', rotation: -8 }),
]
