export default function Results({ freed, onRestart }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="text-5xl">✨</div>
      <p className="text-xl font-bold text-green-600 dark:text-green-400">
        Swept {formatSize(freed)}!
      </p>
      <p className="text-sm text-gray-400 max-w-xs">
        Your PC has more free space now. Everything is safe — files go to a restore folder, not permanent delete.
      </p>
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-xs text-green-700 dark:text-green-300 mt-2">
        ✅ Files moved to hidden restore folder (auto-deletes after 7 days)
      </div>
      <button
        onClick={onRestart}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
      >
        Scan Again
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
