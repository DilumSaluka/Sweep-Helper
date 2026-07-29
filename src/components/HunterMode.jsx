import { useState, useEffect, useRef } from 'react'

export default function HunterMode() {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [uninstallInfo, setUninstallInfo] = useState(null)
  const [leftovers, setLeftovers] = useState(null)
  const [hunting, setHunting] = useState(false)
  const [crosshairPos, setCrosshairPos] = useState(null)
  const overlayRef = useRef(null)

  const loadProcesses = async () => {
    setLoading(true)
    try {
      const list = await window.sweep.hunterListProcesses()
      setProcesses(Array.isArray(list) ? list : [])
    } catch { setProcesses([]) }
    setLoading(false)
  }

  useEffect(() => { loadProcesses() }, [])

  const filtered = processes.filter(p =>
    p.ProcessName?.toLowerCase().includes(search.toLowerCase()) ||
    p.WindowTitle?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (proc) => {
    setSelected(proc)
    setUninstallInfo(null)
    setLeftovers(null)
    const info = await window.sweep.hunterGetUninstallInfo(proc.ProcessName)
    if (info) setUninstallInfo(Array.isArray(info) ? info : [info])
  }

  const handleKill = async () => {
    if (!selected) return
    const r = await window.sweep.hunterKillProcess(selected.Id)
    if (r.success) {
      loadProcesses()
      setSelected(null)
    }
  }

  const handleScanLeftovers = async () => {
    if (!selected) return
    const name = uninstallInfo?.[0]?.DisplayName || selected.ProcessName
    const result = await window.sweep.hunterScanLeftovers(name)
    setLeftovers(result)
  }

  const handleUninstall = async () => {
    if (!uninstallInfo?.[0]?.UninstallString) return
    await window.sweep.hunterRunUninstaller(uninstallInfo[0].UninstallString)
  }

  const startHunt = () => {
    setHunting(true)
    document.body.style.cursor = 'crosshair'
  }

  const handleOverlayClick = async (e) => {
    e.stopPropagation()
    setHunting(false)
    document.body.style.cursor = ''
    const result = await window.sweep.hunterGetWindowAtCursor()
    if (result?.Id) {
      const match = processes.find(p => p.Id === result.Id)
      if (match) handleSelect(match)
      else {
        setSelected(result)
        const info = await window.sweep.hunterGetUninstallInfo(result.ProcessName)
        if (info) setUninstallInfo(Array.isArray(info) ? info : [info])
      }
    }
  }

  const cancelHunt = () => {
    setHunting(false)
    document.body.style.cursor = ''
  }

  return (
    <div className="space-y-4">
      {hunting && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-transparent cursor-crosshair"
          onClick={handleOverlayClick}
          onContextMenu={(e) => { e.preventDefault(); cancelHunt() }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-lg text-sm">
            Click on any window to detect — right-click to cancel
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hunter Mode</h2>
        <button
          onClick={startHunt}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1.5"
        >
          <span className="text-base">🎯</span> Hunt
        </button>
      </div>
      <p className="text-xs text-gray-400">Detect running programs and uninstall, kill, or clean leftovers.</p>

      <div className="flex gap-4">
        <div className="flex-1">
          <input
            placeholder="Search processes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
          />
          <div className="max-h-80 overflow-y-auto space-y-1">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No processes with windows found</p>
            ) : filtered.map(p => (
              <button
                key={p.Id}
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  selected?.Id === p.Id
                    ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.ProcessName}</span>
                  <span className="text-[10px] text-gray-400">PID {p.Id}</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.WindowTitle || '—'}</p>
              </button>
            ))}
          </div>
          <button onClick={loadProcesses} className="mt-2 text-[10px] text-blue-500 hover:text-blue-600">
            ↻ Refresh
          </button>
        </div>

        {selected && (
          <div className="w-72 shrink-0 space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <h3 className="text-xs font-medium mb-2">{selected.ProcessName}</h3>
              <div className="space-y-1 text-[10px] text-gray-400">
                <p>PID: {selected.Id}</p>
                <p>Window: {selected.WindowTitle || '—'}</p>
                {selected.StartTime && <p>Started: {selected.StartTime}</p>}
              </div>
              <div className="flex gap-1.5 mt-3">
                <button onClick={handleKill} className="flex-1 px-2 py-1 rounded text-[10px] font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800">
                  ⚡ Kill
                </button>
                <button onClick={() => selected.ProcessName && window.sweep.openLocation?.(selected.ProcessName)} className="flex-1 px-2 py-1 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 border border-gray-200 dark:border-gray-600">
                  📂 Open
                </button>
              </div>
            </div>

            {uninstallInfo && uninstallInfo.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <h3 className="text-xs font-medium mb-2">Uninstall Info</h3>
                {uninstallInfo.map((u, i) => (
                  <div key={i} className="space-y-1 text-[10px] text-gray-400">
                    <p>Name: {u.DisplayName}</p>
                    {u.DisplayVersion && <p>Version: {u.DisplayVersion}</p>}
                    {u.Publisher && <p>Publisher: {u.Publisher}</p>}
                    {u.UninstallString && (
                      <button onClick={handleUninstall} className="mt-2 w-full px-2 py-1 rounded text-[10px] font-medium bg-red-600 text-white hover:bg-red-700">
                        🗑️ Uninstall
                      </button>
                    )}
                  </div>
                ))}
                {!uninstallInfo[0]?.UninstallString && (
                  <p className="text-[10px] text-amber-500">No uninstaller found</p>
                )}
              </div>
            )}

            {selected && (
              <button onClick={handleScanLeftovers} className="w-full px-3 py-1.5 rounded-lg text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800">
                🔍 Scan Leftovers
              </button>
            )}

            {leftovers && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <h3 className="text-xs font-medium mb-2">Leftovers</h3>
                {leftovers.files?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Files ({leftovers.files.length})</p>
                    <div className="max-h-20 overflow-y-auto space-y-0.5">
                      {leftovers.files.map((f, i) => (
                        <p key={i} className="text-[10px] text-gray-400 truncate">{f.FullName}</p>
                      ))}
                    </div>
                  </div>
                )}
                {leftovers.registry?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Registry ({leftovers.registry.length})</p>
                    <div className="max-h-20 overflow-y-auto space-y-0.5">
                      {leftovers.registry.map((r, i) => (
                        <p key={i} className="text-[10px] text-gray-400 truncate">{r.Path}</p>
                      ))}
                    </div>
                  </div>
                )}
                {(!leftovers.files?.length && !leftovers.registry?.length) && (
                  <p className="text-[10px] text-green-500">No leftovers found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
