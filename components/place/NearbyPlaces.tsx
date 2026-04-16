import Link from 'next/link'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { PlaceRow, Ohaeng } from '@/types/database'

interface NearbyPlacesProps {
  places: PlaceRow[]
  currentId: string
}

export default function NearbyPlaces({ places, currentId }: NearbyPlacesProps) {
  const nearby = places.filter((p) => p.id !== currentId).slice(0, 3)
  if (nearby.length === 0) return null

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        근처 명당
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {nearby.map((place) => {
          const ohaeng = place.ohaeng[0] as Ohaeng
          const color = OHAENG_COLOR[ohaeng]
          return (
            <Link
              key={place.id}
              href={`/place/${place.id}`}
              className="flex-shrink-0 w-40 rounded-2xl border border-gray-100 overflow-hidden"
              style={{
                boxShadow: 'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 16px',
              }}
            >
              <div
                className="h-20 w-full"
                style={{ background: `linear-gradient(135deg, ${color.bg}, ${color.hex}33)` }}
              >
                <div className="h-full flex items-center justify-center text-2xl">
                  {OHAENG_EMOJI[ohaeng]}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-gray-900 truncate">{place.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{place.trust_score}점</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
