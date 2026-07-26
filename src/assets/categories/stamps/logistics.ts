import { createStampAsset } from './createStampAsset'

export const LOGISTICS_STAMPS = [
  createStampAsset({ id: 'logistics-dispatched', title: 'Dispatched', category: 'logistics', description: 'Mark goods as dispatched.', tags: ['shipment', 'sent', 'delivery'], style: 'filled', icon: 'truck', color: '#ffffff', background: '#0369a1', border: '#0369a1' }),
  createStampAsset({ id: 'logistics-delivered', title: 'Delivered', category: 'logistics', description: 'Confirm successful delivery.', tags: ['shipment', 'received', 'complete'], style: 'badge', icon: 'check', color: '#15803d', background: '#f0fdf4' }),
  createStampAsset({ id: 'logistics-inspected', title: 'Inspected', category: 'logistics', description: 'Confirm shipment inspection.', tags: ['quality', 'warehouse', 'checked'], style: 'double-border', icon: 'eye', color: '#475569', background: '#f8fafc' }),
  createStampAsset({ id: 'logistics-returned', title: 'Returned', category: 'logistics', description: 'Mark returned goods.', tags: ['shipment', 'rma', 'send back'], style: 'diagonal', icon: 'truck', color: '#c2410c', background: '#fff7ed', rotation: -8 }),
]
