import { memo, useId } from 'react'
import {
  CalendarDays,
  Check,
  Eye,
  HeartPulse,
  LockKeyhole,
  PenLine,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { StampIcon, StampRendererProps } from '../../types/stamp'

const ICONS: Record<StampIcon, LucideIcon> = {
  check: Check,
  x: X,
  lock: LockKeyhole,
  wallet: WalletCards,
  truck: Truck,
  shield: ShieldCheck,
  eye: Eye,
  calendar: CalendarDays,
  signature: PenLine,
  heart: HeartPulse,
  wrench: Wrench,
  users: Users,
}

function StampRendererComponent({
  text,
  style,
  icon,
  color,
  background,
  border,
  width = 200,
  height = 88,
  rotation = 0,
  className,
  title = text,
}: StampRendererProps) {
  const titleId = useId()
  const Icon = icon ? ICONS[icon] : null
  const isCircular = style === 'circular'
  const borderWidth = style === 'filled' || style === 'modern' ? 2 : 4
  const radius = style === 'rounded' || style === 'modern' ? 14 : 5
  const inset = 6
  const iconSize = Math.min(30, height * 0.32)
  const fontSize = Math.max(13, Math.min(25, height * 0.28))
  const textX = Icon ? width / 2 + iconSize * 0.38 : width / 2
  const availableTextWidth = width - (Icon ? iconSize * 2.1 : 30)
  const estimatedTextWidth = text.length * fontSize * 0.64
  const compressedTextLength = estimatedTextWidth > availableTextWidth ? availableTextWidth : undefined
  const dashArray = style === 'rubber' ? '8 3' : style === 'vintage' ? '3 3' : undefined
  const fontFamily = style === 'vintage' || style === 'rubber'
    ? 'Georgia, Times New Roman, serif'
    : 'Inter, ui-sans-serif, system-ui, sans-serif'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={titleId}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={titleId}>{title}</title>
      <g
        transform={`rotate(${rotation} ${width / 2} ${height / 2})`}
        opacity={style === 'rubber' ? 0.88 : 1}
      >
        {isCircular ? (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2 - inset}
            ry={height / 2 - inset}
            fill={background}
            stroke={border}
            strokeWidth={borderWidth}
          />
        ) : style === 'badge' ? (
          <path
            d={`M ${inset + 10} ${inset} H ${width - inset - 10} L ${width - inset} ${inset + 10} V ${height - inset - 10} L ${width - inset - 10} ${height - inset} H ${inset + 10} L ${inset} ${height - inset - 10} V ${inset + 10} Z`}
            fill={background}
            stroke={border}
            strokeWidth={borderWidth}
          />
        ) : (
          <rect
            x={inset}
            y={inset}
            width={width - inset * 2}
            height={height - inset * 2}
            rx={radius}
            fill={background}
            stroke={border}
            strokeWidth={borderWidth}
            strokeDasharray={dashArray}
          />
        )}

        {style === 'double-border' && (
          <rect
            x={inset + 6}
            y={inset + 6}
            width={width - (inset + 6) * 2}
            height={height - (inset + 6) * 2}
            rx={Math.max(2, radius - 2)}
            fill="none"
            stroke={border}
            strokeWidth={1.5}
          />
        )}

        {style === 'diagonal' && (
          <path
            d={`M ${inset + 4} ${height - inset - 8} L ${width - inset - 4} ${inset + 8}`}
            stroke={border}
            strokeWidth={2}
            opacity={0.28}
          />
        )}

        {Icon && (
          <Icon
            x={Math.max(18, width * 0.12)}
            y={(height - iconSize) / 2}
            width={iconSize}
            height={iconSize}
            color={color}
            strokeWidth={2.2}
            aria-hidden
          />
        )}

        <text
          x={textX}
          y={height / 2}
          dy="0.35em"
          fill={color}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={style === 'modern' ? 650 : 800}
          letterSpacing={style === 'modern' ? 0 : 1.5}
          textLength={compressedTextLength}
          lengthAdjust={compressedTextLength ? 'spacingAndGlyphs' : undefined}
        >
          {text.toLocaleUpperCase()}
        </text>
      </g>
    </svg>
  )
}

export const StampRenderer = memo(StampRendererComponent)
