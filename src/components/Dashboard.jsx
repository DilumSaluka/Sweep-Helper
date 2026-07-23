export default function Dashboard({ items, scanning, cleaning, onClean, lastScan }) {
  const totalSize = items.reduce((sum, i) => sum + i.size, 0)
  const hasItems = items.some(i => i.size > 0)

  if (scanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Scanning your PC...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Available to free</p>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {formatSize(totalSize)}
        </p>
        {lastScan && <p className="text-[10px] text-gray-400 mt-1">Last scan: {lastScan}</p>}
      </div>

      <div className="flex-1 space-y-2">
        {items.map(cat => (
          <CategoryRow key={cat.id} cat={cat} />
        ))}
      </div>

      {!hasItems && (
        <div className="text-center py-6">
          <p className="text-lg">✨ Your PC looks clean!</p>
          <p className="text-xs text-gray-400 mt-1">Nothing to sweep right now.</p>
        </div>
      )}

      <div className="pt-3">
        <button
          onClick={onClean}
          disabled={cleaning || !hasItems}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            cleaning
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-wait'
              : hasItems
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-[0.98]'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {cleaning ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sweeping...
            </span>
          ) : hasItems ? (
            `🧹 Sweep ${formatSize(totalSize)}`
          ) : 'Nothing to Sweep'}
        </button>
      </div>
    </div>
  )
}

function CategoryRow({ cat }) {
  const icon = cat.id === 'temp' ? '📁' : cat.id === 'recycle' ? '🗑️' : '🌐'
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-medium">{cat.label}</span>
        </div>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatSize(cat.size)}</span>
      </div>
      {cat.subCategories && cat.subCategories.length > 0 && (
        <>
          <p className="text-[10px] text-gray-400 ml-7">{cat.subCategories.length} items</p>
          <div className="ml-7 space-y-0.5">
          {cat.subCategories.map(sub => (
            <div key={sub.subId} className="flex justify-between text-xs text-gray-400">
              <span>{sub.label}</span>
              <span>{formatSize(sub.size)}</span>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  )
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}
