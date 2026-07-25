import { useState, useEffect } from 'react'

export default function StartupManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const data = await window.sweep.listStartup()
        setItems(data.map(d => ({ ...d, enabled: d.source !== 'Folder' || !d.command.includes('_disabled_') })))
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleToggle = async (item) => {
    setToggling(item.name)
    const newState = !item.enabled
    try {
      await window.sweep.toggleStartup({ name: item.name, command: item.command, source: item.source, type: item.type }, newState)
      setItems(prev => prev.map(i => i.name === item.name ? { ...i, enabled: newState } : i))
    } catch {}
    setToggling(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading startup items...</p>
      </div>
    )
  }

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.command.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Search by name or command..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-8"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-2">{filtered.length} of {items.length} startup {items.length === 1 ? 'item' : 'items'}</p>
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-gray-400 truncate">{item.command}</p>
            </div>
            <button
              onClick={() => handleToggle(item)}
              disabled={toggling === item.name}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                toggling === item.name
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  : item.enabled
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {toggling === item.name ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                </span>
              ) : item.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            {search ? 'No matching startup items found' : 'No startup items found'}
          </p>
        )}
      </div>
    </div>
  )
}
