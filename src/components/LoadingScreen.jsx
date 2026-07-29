import { useState, useEffect } from 'react'

export default function LoadingScreen({ message, fullScreen, pulse }) {
  const [pulseMsg, setPulseMsg] = useState(0)
  const pulses = pulse || [
    'Scanning temporary files...',
    'Checking browser cache...',
    'Analyzing Recycle Bin...',
    'Measuring disk usage...',
    'Almost ready...'
  ]

  useEffect(() => {
    if (!pulse) return
    const timer = setInterval(() => {
      setPulseMsg(i => (i + 1) % pulses.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [pulse, pulses.length])

  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message || 'Loading...'}</p>
        {pulse && (
          <p className="text-xs text-gray-400 mt-1.5 animate-pulse">{pulses[pulseMsg]}</p>
        )}
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-10 py-8 shadow-2xl border border-gray-200 dark:border-gray-700">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
      {content}
    </div>
  )
}
