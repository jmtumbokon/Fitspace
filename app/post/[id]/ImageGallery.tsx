'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function ImageGallery({ urls, alt }: { urls: string[]; alt: string }) {
  const [index, setIndex] = useState(0)

  return (
    <div>
      <div className="relative aspect-[4/5] bg-neutral-100 md:overflow-hidden md:rounded-xl">
        <Image
          src={urls[index]}
          alt={`${alt} — photo ${index + 1}`}
          fill
          sizes="(min-width: 768px) 672px, 100vw"
          className="object-cover"
          priority
        />
        {urls.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1}/{urls.length}
          </span>
        )}
      </div>

      {urls.length > 1 && (
        <div className="mt-2 flex gap-2 px-4 md:px-0">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-[4/5] w-16 overflow-hidden rounded-md ${
                i === index ? 'ring-2 ring-black' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
