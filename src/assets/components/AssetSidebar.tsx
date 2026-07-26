import {
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Cog,
  HeartPulse,
  Heart,
  LockKeyhole,
  PenLine,
  Scale,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { ASSET_CATEGORIES } from '../services/assetRegistry'
import type { AssetCategory } from '../types/asset'

export type AssetSection = 'all' | 'favorites' | 'recent' | AssetCategory

const CATEGORY_ICONS: Record<AssetCategory, LucideIcon> = {
  workflow: ClipboardCheck,
  finance: CircleDollarSign,
  legal: Scale,
  engineering: Cog,
  healthcare: HeartPulse,
  hr: Users,
  logistics: Truck,
  security: LockKeyhole,
  date: CalendarDays,
  signature: PenLine,
}

interface AssetSidebarProps {
  activeSection: AssetSection
  favoriteCount: number
  recentCount: number
  onSelect: (section: AssetSection) => void
}

interface SidebarButtonProps {
  id: AssetSection
  label: string
  icon: LucideIcon
  count?: number
  activeSection: AssetSection
  onSelect: (section: AssetSection) => void
}

function SidebarButton({
  id,
  label,
  icon: Icon,
  count,
  activeSection,
  onSelect,
}: SidebarButtonProps) {
  const isActive = activeSection === id
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'flex h-9 w-full shrink-0 items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
        isActive
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
      )}
    >
      <Icon size={15} strokeWidth={1.9} aria-hidden />
      <span className="truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span aria-hidden className={cn('ml-auto text-[10px]', isActive ? 'text-neutral-300' : 'text-neutral-400')}>
          {count}
        </span>
      )}
    </button>
  )
}

export function AssetSidebar({
  activeSection,
  favoriteCount,
  recentCount,
  onSelect,
}: AssetSidebarProps) {
  return (
    <nav aria-label="Asset categories" className="flex gap-1 overflow-x-auto border-b border-neutral-200 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:w-40 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:px-2.5 lg:py-3">
      <SidebarButton id="all" label="All assets" icon={ClipboardCheck} activeSection={activeSection} onSelect={onSelect} />
      <SidebarButton id="favorites" label="Favorites" icon={Heart} count={favoriteCount} activeSection={activeSection} onSelect={onSelect} />
      <SidebarButton id="recent" label="Recent" icon={Clock3} count={recentCount} activeSection={activeSection} onSelect={onSelect} />
      <div className="mx-1 my-1 hidden h-px bg-neutral-200 lg:block" />
      {ASSET_CATEGORIES.map((category) => (
        <SidebarButton
          key={category.id}
          id={category.id}
          label={category.label}
          icon={CATEGORY_ICONS[category.id]}
          activeSection={activeSection}
          onSelect={onSelect}
        />
      ))}
    </nav>
  )
}
