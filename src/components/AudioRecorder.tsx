'use client'

import { useState, useRef } from 'react'

type Props = {
  onRecorded: (blob: Blob, extension: string) => void
  disabled?: boolean
}

function getSupportedMimeType(): { mimeType: string; extension: string } {
  const types = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/mp4', extension: 'm4a' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/ogg', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ]

  if (typeof MediaRecorder !== 'undefined') {
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t.mimeType)) {
        return t
      }
    }
  }

  // Fallback - let the browser pick
  return { mimeType: '', extension: 'webm' }
}

export default function AudioRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mimeRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' })

  const start = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Seu navegador não suporta gravação de áudio. Tente usar o Chrome ou Safari.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const supported = getSupportedMimeType()
      mimeRef.current = supported

      const options: MediaRecorderOptions = {}
      if (supported.mimeType) {
        options.mimeType = supported.mimeType
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const mimeType = supported.mimeType || mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        onRecorded(blob, supported.extension)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(1000) // collect data every second for better compatibility
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        alert('Permissão de microfone negada. Vá em Ajustes > Safari > Microfone e permita o acesso para este site.')
      } else {
        alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
      }
    }
  }

  const stop = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        recording
          ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
          : 'bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100'
      } disabled:opacity-50`}
    >
      {recording ? (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {formatTime(seconds)} - Parar
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          Gravar
        </>
      )}
    </button>
  )
}
