'use client'

import { useState, useRef } from 'react'

export default function DemoVideo() {
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed]   = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.play()
    }
    setPlaying(true)
  }

  return (
    <div className="relative w-full h-full">

      {/* ── Custom placeholder ── */}
      {!playing && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-warm-white px-8">

          {/* Mark — û at display scale */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none"
            width={56}
            height={56}
            aria-hidden="true"
          >
            <text
              x="16" y="25"
              textAnchor="middle"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fontStyle="italic"
              fontWeight={500}
              fontSize={22}
              fill="#1F1F1F"
            >u</text>
            <path
              d="M13 12 L16 9 L19 12"
              stroke="#C0392B"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="miter"
              fill="none"
            />
          </svg>

          {/* Copy */}
          <div className="text-center space-y-2">
            <p className="font-display italic text-xl text-ink leading-snug">
              A 60-second auction.<br />Started with a QR code.
            </p>
            <p className="text-xs text-muted">
              AI-generated demo
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 text-xs tracking-widest uppercase text-terracotta
                       hover:opacity-60 transition-opacity duration-200 font-body"
          >
            <span
              style={{
                display: 'inline-block',
                width: 0,
                height: 0,
                borderTop:    '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft:   '8px solid #C0392B',
              }}
            />
            Watch the demo
          </button>

        </div>
      )}

      {/* ── Video — autoplays muted on desktop; placeholder shown until onPlay fires ── */}
      {!failed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          controls
          onPlay={() => setPlaying(true)}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
          style={{ opacity: playing ? 1 : 0, pointerEvents: playing ? 'auto' : 'none' }}
        >
          <source src="/demo.mp4" type="video/mp4" />
        </video>
      )}

      {/* ── Failed state ── */}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-warm-white">
          <p className="text-sm text-muted text-center px-8">
            Video unavailable.<br />
            <span className="text-xs">Drop demo.mp4 in /public to enable.</span>
          </p>
        </div>
      )}

    </div>
  )
}
