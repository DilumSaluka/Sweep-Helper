import { useState, useEffect } from 'react'

export default function UninstallManager() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [uninstalling, setUninstalling] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await window.sweep.listUninstallApps()
        setApps(data)
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleUninstall = async (app) => {
    if (!window.confirm(`Are you sure you want to uninstall "${app.name}"?\n\nThis will remove the program from your computer.`)) return
    setUninstalling(app.name)
    try {
      await window.sweep.uninstallApp(app)
    } catch {}
    setUninstalling(null)
  }

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading installed apps...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <input
        type="text"
        placeholder="Search apps..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-3 px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map((app, i) => (
          <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm font-medium truncate">{app.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {[app.publisher, app.version].filter(Boolean).join(' · ')}
                {app.size > 0 ? ` · ${formatSize(app.size)}` : ''}
              </p>
            </div>
            <button
              onClick={() => handleUninstall(app)}
              disabled={uninstalling === app.name}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                uninstalling === app.name
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800'
              }`}
            >
              {uninstalling === app.name ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  Removing
                </span>
              ) : 'Uninstall'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            {search ? 'No matching apps found' : 'No installed apps found'}
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">{apps.length} apps total</p>
    </div>
  )
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}
