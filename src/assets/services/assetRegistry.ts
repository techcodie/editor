import { DATE_STAMPS } from '../categories/stamps/date'
import { ENGINEERING_STAMPS } from '../categories/stamps/engineering'
import { FINANCE_STAMPS } from '../categories/stamps/finance'
import { HEALTHCARE_STAMPS } from '../categories/stamps/healthcare'
import { HR_STAMPS } from '../categories/stamps/hr'
import { LEGAL_STAMPS } from '../categories/stamps/legal'
import { LOGISTICS_STAMPS } from '../categories/stamps/logistics'
import { SECURITY_STAMPS } from '../categories/stamps/security'
import { SIGNATURE_STAMPS } from '../categories/stamps/signature'
import { WORKFLOW_STAMPS } from '../categories/stamps/workflow'
import type { Asset, AssetCategory, AssetCategoryDefinition } from '../types/asset'

export const ASSET_CATEGORIES: readonly AssetCategoryDefinition[] = [
  { id: 'workflow', label: 'Workflow', description: 'Review and approval states' },
  { id: 'finance', label: 'Finance', description: 'Billing and account states' },
  { id: 'legal', label: 'Legal', description: 'Contracts and protected content' },
  { id: 'engineering', label: 'Engineering', description: 'Technical review states' },
  { id: 'healthcare', label: 'Healthcare', description: 'Clinical and patient workflows' },
  { id: 'hr', label: 'Human Resources', description: 'People and policy workflows' },
  { id: 'logistics', label: 'Logistics', description: 'Shipment and delivery states' },
  { id: 'security', label: 'Security', description: 'Access and verification states' },
  { id: 'date', label: 'Date', description: 'Document date markers' },
  { id: 'signature', label: 'Signature', description: 'Signature status markers' },
]

const ASSET_REGISTRY: readonly Asset[] = [
  ...WORKFLOW_STAMPS,
  ...FINANCE_STAMPS,
  ...LEGAL_STAMPS,
  ...ENGINEERING_STAMPS,
  ...HEALTHCARE_STAMPS,
  ...HR_STAMPS,
  ...LOGISTICS_STAMPS,
  ...SECURITY_STAMPS,
  ...DATE_STAMPS,
  ...SIGNATURE_STAMPS,
]

export function getAssets(): readonly Asset[] {
  return ASSET_REGISTRY
}

export function getAssetById(id: string): Asset | undefined {
  return ASSET_REGISTRY.find((asset) => asset.id === id)
}

export function getAssetsByCategory(category: AssetCategory): readonly Asset[] {
  return ASSET_REGISTRY.filter((asset) => asset.category === category)
}

export function searchAssets(query: string, assets: readonly Asset[] = ASSET_REGISTRY): Asset[] {
  const terms = query
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (terms.length === 0) return [...assets]

  return assets.filter((asset) => {
    const searchable = [
      asset.title,
      asset.description,
      asset.category,
      asset.type,
      ...asset.tags,
    ]
      .join(' ')
      .toLocaleLowerCase()
    return terms.every((term) => searchable.includes(term))
  })
}
