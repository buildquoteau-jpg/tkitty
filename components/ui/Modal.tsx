'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-xl w-full animate-slide-up',
          sizeClasses[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
            <h2 className="font-serif text-lg text-stone-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors text-xl leading-none z-10"
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
