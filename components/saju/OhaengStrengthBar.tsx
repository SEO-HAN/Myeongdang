'use client'

import { motion } from 'framer-motion'
import { OHAENG_EMOJI, OHAENG_COLOR } from '@/lib/saju/types'
import type { Ohaeng } from '@/lib/saju/types'

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수']

interface OhaengStrengthBarProps {
  strength: Record<Ohaeng, number>
}

export default function OhaengStrengthBar({ strength }: OhaengStrengthBarProps) {
  return (
    <div className="space-y-2.5">
      {OHAENG_ORDER.map((o, idx) => {
        const pct = Math.round(strength[o])
        const color = OHAENG_COLOR[o]
        return (
          <div key={o} className="flex items-center gap-2">
            <span
              className="text-xs font-semibold w-12 text-right tabular-nums"
              style={{ color: color.text }}
            >
              {OHAENG_EMOJI[o]} {o}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: color.hex }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, delay: idx * 0.08, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs tabular-nums w-8 text-right" style={{ color: '#6E6A7A' }}>
              {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
