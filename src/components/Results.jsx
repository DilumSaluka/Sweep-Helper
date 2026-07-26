import { useState, useEffect } from 'react'

export default function Results({ freed, count, onRestart }) {
  const [hasRestore, setHasRestore] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    window.sweep.hasRestorableItems().then(setHasRestore)
  }, [])

  const handleRestore = async () => {
    setRestoring(true)
    await window.sweep.undoLast()
    setHasRestore(false)
    setRestoring(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="text-5xl">✨</div>
      <p className="text-xl font-bold text-green-600 dark:text-green-400">
        Swept {formatSize(freed)}!
      </p>
      <p className="text-sm text-gray-400">{count} items cleaned</p>
      <p className="text-xs text-gray-400">Recoverable: {formatSize(freed)}</p>
      <p className="text-sm text-gray-400 max-w-xs">
        Your PC has more free space now. Everything is safe — files go to a restore folder, not permanent delete.
      </p>
      {hasRestore && (
        <button
          onClick={handleRestore}
          disabled={restoring}
          className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 transition-all"
        >
          {restoring ? 'Restoring...' : '↩ Restore last cleanup'}
        </button>
      )}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-xs text-green-700 dark:text-green-300 mt-2">
        ✅ Files moved to hidden restore folder (auto-deletes after 7 days)
      </div>
      <button
        onClick={() => window.sweep.openRestore()}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all"
      >
        📂 Open restore folder
      </button>
      <button
        onClick={async () => {
          await window.sweep.exportReport({
            freed: formatSize(freed),
            count,
            date: new Date().toLocaleString()
          })
        }}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all"
      >
        📄 Export report
      </button>
      <button
        onClick={onRestart}
        className="px-4 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all"
      >
        ← Back
      </button>
    </div>
  )
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}
