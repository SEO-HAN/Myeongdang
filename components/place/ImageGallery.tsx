'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ImageGalleryProps {
  imageUrls: string[]
  altText: string
  ohaengHex: string
}

export default function ImageGallery({ imageUrls, altText, ohaengHex }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const images = imageUrls.length > 0 ? imageUrls : []

  // 이미지 없을 때: 오행 그라디언트 배경
  if (images.length === 0) {
    return (
      <div
        className="relative h-56 w-full"
        style={{ background: `linear-gradient(135deg, #0D0D1A 0%, ${ohaengHex}33 100%)` }}
      />
    )
  }

  return (
    <div className="relative h-56 overflow-hidden bg-gray-900">
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={images[current]}
            alt={`${altText} ${current + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            priority={current === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* 좌우 이동 버튼 (이미지 2장 이상일 때) */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
            aria-label="이전 이미지"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
            aria-label="다음 이미지"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 도트 인디케이터 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                aria-label={`이미지 ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
