'use client'

import { useState } from 'react'

export default function DemoVideo() {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative w-full h-full">
      {/* Placeholder — visible until video loads or if it fails */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-hairline">
        <div className="w-10 h-10 border border-muted/25 flex items-center justify-center">
          {/* Simple play triangle */}
          <div
            className="ml-0.5"
            style={{
              width: 0,
              height: 0,
              borderTop:    '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft:   '12px solid rgba(107,107,107,0.35)',
            }}
          />
        </div>
        <p className="text-xs text-muted/40 tracking-widest uppercase font-body">
          demo.mp4
        </p>
      </div>

      {/* Video — covers placeholder once loaded */}
      {!failed && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-contain"
        >
          <source src="/demo.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  )
}
