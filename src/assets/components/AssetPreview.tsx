import { StampRenderer } from '../categories/stamps/StampRenderer'
import { isStampMetadata } from '../services/assetRenderer'
import type { Asset } from '../types/asset'

interface AssetPreviewProps {
  asset: Asset
  className?: string
}

export function AssetPreview({ asset, className }: AssetPreviewProps) {
  if (asset.renderer === 'stamp' && isStampMetadata(asset.metadata)) {
    return (
      <StampRenderer
        text={asset.metadata.text}
        style={asset.metadata.style}
        icon={asset.metadata.icon}
        color={asset.metadata.color}
        background={asset.metadata.background}
        border={asset.metadata.border}
        width={asset.metadata.width}
        height={asset.metadata.height}
        rotation={asset.metadata.rotation}
        title={`${asset.title} preview`}
        className={className}
      />
    )
  }

  return (
    <div className={className} role="img" aria-label={`${asset.title} preview`}>
      {asset.title}
    </div>
  )
}
