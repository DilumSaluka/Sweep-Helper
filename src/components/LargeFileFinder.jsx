import { useState, useEffect, useRef } from 'react'

export default function LargeFileFinder() {
  const [drives, setDrives] = useState([])
  const [selectedDrive, setSelectedDrive] = useState('')
  const [files, setFiles] = useState([])
  const [scanning, setScanning] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [sortAsc, setSortAsc] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [typeCounts, setTypeCounts] = useState(null)
  const [scanStartTime, setScanStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    ;(async () => {
      try {
        const list = await window.sweep.listDrives()
        setDrives(list)
        if (list.length > 0) setSelectedDrive(list[0].root)
      } catch {}
    })()
  }, [])

  const handleScan = async () => {
    if (!selectedDrive) return
    setScanning(true)
    setScanProgress(0)
    setFiles([])
    setSelected(new Set())
    setScanned(false)
    setElapsed(0)
    const start = Date.now()
    setScanStartTime(start)
    const elapsedInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    const progressInterval = setInterval(() => {
      setScanProgress(p => Math.min(p + 5, 90))
    }, 500)
    try {
      const data = await window.sweep.scanLargeFiles(selectedDrive)
      setFiles(data)
      const counts = {}
      data.forEach(f => {
        const ext = (f.path.split('.').pop() || 'none').toLowerCase()
        counts[ext] = (counts[ext] || 0) + 1
      })
      setTypeCounts(counts)
    } catch {}
    clearInterval(progressInterval)
    clearInterval(elapsedInterval)
    setScanProgress(100)
    setScanning(false)
    setScanned(true)
  }

  const toggleFile = (path) => {
    const next = new Set(selected)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setSelected(next)
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      await window.sweep.deleteLargeFiles([...selected])
      setFiles(files.filter(f => !selected.has(f.path)))
      setSelected(new Set())
    } catch {}
    setDeleting(false)
  }

  useEffect(() => {
    const handler = () => setCtxMenu(null)
    if (ctxMenu) window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [ctxMenu])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <select
          value={selectedDrive}
          onChange={e => { setSelectedDrive(e.target.value); setScanned(false); setFiles([]); setSelected(new Set()) }}
          className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {drives.map(d => (
            <option key={d.root} value={d.root}>
              {d.root} ({formatSize(d.used)} used / {formatSize(d.free)} free)
            </option>
          ))}
        </select>
        <button
          title="Refresh drives"
          onClick={async () => {
            const list = await window.sweep.listDrives()
            setDrives(list)
            if (list.length > 0) setSelectedDrive(list[0].root)
          }}
          className="shrink-0 px-2 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
        >
          ↻
        </button>
        <button
          onClick={handleScan}
          disabled={scanning || !selectedDrive}
          className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            scanning
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {scanning ? (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Scanning
            </span>
          ) : scanned ? 'Rescan' : 'Scan'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">
          {scanned ? `${files.length} files >100MB` : 'Select a drive and scan'}
        </p>
        {typeCounts && (
          <div className="flex flex-wrap gap-1 mb-1">
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([ext, count]) => (
              <span key={ext} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">.{ext} ×{count}</span>
            ))}
          </div>
        )}
        <div className="flex gap-1 flex-wrap">
          {scanned && files.length > 0 && (
            <>
              <button
                onClick={() => setSelected(new Set(files.filter(f => f.size > 1_073_741_824).map(f => f.path)))}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              >
                &gt;1GB
              </button>
              <button
                onClick={() => setSelected(new Set(files.filter(f => f.size > 524_288_000).map(f => f.path)))}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              >
                &gt;500MB
              </button>
              <button
                onClick={() => setSelected(new Set(files.filter(f => f.size > 209_715_200).map(f => f.path)))}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              >
                &gt;200MB
              </button>
            </>
          )}
          {scanned && files.length > 0 && (
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              title={sortAsc ? 'Sorted small to large' : 'Sorted large to small'}
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          )}
          {scanned && files.length > 0 && (
            <button
              onClick={() => {
                if (selected.size === files.length) setSelected(new Set())
                else setSelected(new Set(files.map(f => f.path)))
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              {selected.size === files.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={() => {
                navigator.clipboard.writeText([...selected].join('\n'))
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              📋 Copy paths
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                deleting
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800'
              }`}
            >
              {deleting ? 'Moving...' : `Delete (${selected.size})`}
            </button>
          )}
        </div>
      </div>

      {scanning && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(scanProgress, 100)}%` }} />
          </div>
          <p className="text-sm text-gray-400">Scanning {selectedDrive}... {Math.min(scanProgress, 100)}% · {elapsed}s elapsed</p>
        </div>
      )}

      {!scanning && (
        <div className="flex-1 overflow-y-auto space-y-1">
          {[...files].sort((a, b) => sortAsc ? a.size - b.size : b.size - a.size).map((file, i) => (
            <div
              key={i}
              onClick={() => toggleFile(file.path)}
              onDoubleClick={() => window.sweep.openLocation(file.path)}
              onContextMenu={e => {
                e.preventDefault()
                setCtxMenu({ x: e.clientX, y: e.clientY, file: file.path })
              }}
              className={`flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border cursor-pointer transition-all ${
                selected.has(file.path)
                  ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30'
                  : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                selected.has(file.path)
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selected.has(file.path) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.path}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(file.size)} · {file.modified}
                </p>
              </div>
              <button
                title="Open location"
                onClick={e => { e.stopPropagation(); window.sweep.openLocation(file.path) }}
                className="shrink-0 p-1 text-gray-400 hover:text-blue-500"
              >
                📂
              </button>
              <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {formatSize(file.size)}
              </span>
            </div>
          ))}
          {scanned && files.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg">🎉 No large files found</p>
              <p className="text-xs text-gray-400 mt-1">Nothing over 100 MB on {selectedDrive}.</p>
            </div>
          )}
          {!scanned && (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <p className="text-4xl mb-3">💾</p>
              <p className="text-sm text-gray-400">Pick a drive and hit Scan</p>
            </div>
          )}
        </div>
      )}

      {ctxMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 text-xs min-w-[140px]"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <button
            onClick={() => { window.sweep.openLocation(ctxMenu.file); setCtxMenu(null) }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            📂 Open location
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(ctxMenu.file); setCtxMenu(null) }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            📋 Copy path
          </button>
          <button
            onClick={() => { toggleFile(ctxMenu.file); setCtxMenu(null) }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
          >
            🗑️ Select for delete
          </button>
        </div>
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
