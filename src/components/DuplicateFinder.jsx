import { useState, useEffect } from 'react'

export default function DuplicateFinder() {
  const [drives, setDrives] = useState([])
  const [selectedDrive, setSelectedDrive] = useState('')
  const [groups, setGroups] = useState([])
  const [scanning, setScanning] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [checked, setChecked] = useState(new Map())
  const [deleting, setDeleting] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [progress, setProgress] = useState('')
  const [sortByNameAsc, setSortByNameAsc] = useState(true)
  const [ctxMenu, setCtxMenu] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const list = await window.sweep.listDupDrives()
        setDrives(list)
        if (list.length > 0) setSelectedDrive(list[0].root)
      } catch {}
    })()
  }, [])

  const handleScan = async () => {
    if (!selectedDrive) return
    setScanning(true)
    setGroups([])
    setExpanded(new Set())
    setChecked(new Map())
    setScanned(false)
    setProgress('Scanning files by size...')
    try {
      const data = await window.sweep.scanDuplicates(selectedDrive)
      setGroups(data)
      setExpanded(new Set())
    } catch {}
    setScanning(false)
    setScanned(true)
    setProgress('')
  }

  useEffect(() => {
    const handler = () => setCtxMenu(null)
    if (ctxMenu) window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [ctxMenu])

  const totalDupSize = groups.reduce((sum, g) => sum + g.size * (g.files.length - 1), 0)

  const toggleGroup = (i) => {
    const next = new Set(expanded)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setExpanded(next)
  }

  const toggleFile = (groupIdx, filePath) => {
    const key = `${groupIdx}::${filePath}`
    const next = new Map(checked)
    if (next.has(key)) next.delete(key)
    else next.set(key, filePath)
    setChecked(next)
  }

  const handleDelete = async () => {
    const paths = [...checked.values()]
    if (paths.length >= 5 && !window.confirm(`Delete ${paths.length} duplicate files? This action can be undone (files go to restore folder).`)) return
    if (paths.length === 0) return
    setDeleting(true)
    try {
      await window.sweep.deleteDuplicates(paths)
      setGroups(prev => prev.map(g => ({
        ...g,
        files: g.files.filter(f => !paths.includes(f))
      })).filter(g => g.files.length > 1))
      setChecked(new Map())
    } catch {}
    setDeleting(false)
  }

  const handleSortByName = () => {
    const nextAsc = !sortByNameAsc
    setSortByNameAsc(nextAsc)
    setGroups(prev => [...prev].sort((a, b) => {
      const nameA = a.files[0].split('\\').pop().toLowerCase()
      const nameB = b.files[0].split('\\').pop().toLowerCase()
      return nextAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    }))
  }

  const checkedCount = checked.size

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={selectedDrive}
          onChange={e => { setSelectedDrive(e.target.value); setScanned(false); setGroups([]); setChecked(new Map()) }}
          className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          {drives.map(d => (
            <option key={d.root} value={d.root}>
              {d.root} ({formatSize(d.used)} used)
            </option>
          ))}
        </select>
        <button
          onClick={handleScan}
          disabled={scanning || !selectedDrive}
          className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            scanning
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {scanning ? (
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              Scanning
            </span>
          ) : scanned ? 'Rescan' : 'Scan'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">
          {scanning ? progress : scanned ? `${groups.length} duplicate groups · ${formatSize(totalDupSize)} wasted` : 'Pick a drive and scan for duplicates'}
        </p>
        {scanned && groups.length > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                const all = new Map()
                groups.forEach((g, i) => g.files.forEach(f => all.set(`${i}::${f}`, f)))
                setChecked(all)
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              All
            </button>
            <button
              onClick={() => {
                setChecked(new Map())
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              None
            </button>
            <button
              onClick={() => {
                const allKeys = new Set()
                groups.forEach((g, i) => g.files.forEach(f => allKeys.add(`${i}::${f}`)))
                const inverted = new Map()
                groups.forEach((g, i) => g.files.forEach(f => {
                  const key = `${i}::${f}`
                  if (!checked.has(key)) inverted.set(key, f)
                }))
                setChecked(inverted)
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              Invert
            </button>
            <button
              onClick={() => {
                const oldest = new Map()
                groups.forEach((g, i) => {
                  const sorted = [...g.files].sort()
                  for (let j = 1; j < sorted.length; j++) {
                    oldest.set(`${i}::${sorted[j]}`, sorted[j])
                  }
                })
                setChecked(oldest)
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              Keep Oldest
            </button>
            <button
              onClick={() => {
                const newest = new Map()
                groups.forEach((g, i) => {
                  const sorted = [...g.files].sort().reverse()
                  for (let j = 1; j < sorted.length; j++) {
                    newest.set(i + '::' + sorted[j], sorted[j])
                  }
                })
                setChecked(newest)
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              Keep Newest
            </button>
            <button
              onClick={() => setExpanded(new Set())}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              Collapse
            </button>
            <button
              onClick={handleSortByName}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              title={sortByNameAsc ? 'Sorted A-Z' : 'Sorted Z-A'}
            >
              Name {sortByNameAsc ? '↑' : '↓'}
            </button>
            <button
              onClick={() => window.sweep.exportDuplicates(groups)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              📄 Export
            </button>
          </div>
        )}
        {checkedCount > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              deleting
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800'
            }`}
          >
            {deleting ? 'Moving...' : `Delete (${checkedCount})`}
          </button>
        )}
      </div>

      {scanning && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">{progress}</p>
        </div>
      )}

      {!scanning && (
        <div className="flex-1 overflow-y-auto space-y-1">
          {groups.map((group, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div
                onClick={(e) => {
                  if (e.shiftKey) {
                    const allInGroup = new Map(checked)
                    group.files.forEach(f => {
                      const k = i + '::' + f
                      if (allInGroup.has(k)) allInGroup.delete(k)
                      else allInGroup.set(k, f)
                    })
                    setChecked(allInGroup)
                  } else {
                    toggleGroup(i)
                  }
                }}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 shrink-0">{expanded.has(i) ? '▼' : '▶'}</span>
                  <p className="text-xs font-medium truncate">{group.files[0].split('\\').pop()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{group.files.length} copies</span>
                  <span className="text-xs font-semibold text-rose-500">{formatSize(group.size)}</span>
                </div>
              </div>
              {expanded.has(i) && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {group.files.map((file, j) => {
                    const key = `${i}::${file}`
                    const isChecked = checked.has(key)
                    return (
                    <div
                      key={j}
                      onClick={() => toggleFile(i, file)}
                      onContextMenu={e => {
                        e.preventDefault()
                        setCtxMenu({ x: e.clientX, y: e.clientY, file, groupIdx: i })
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs ${
                        isChecked ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isChecked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="truncate text-gray-500 flex-1" title={file}>{file}</span>
                      <button
                        title="Copy path"
                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(file) }}
                        className="shrink-0 text-gray-400 hover:text-blue-500 text-xs"
                      >
                        📋
                      </button>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          {scanned && groups.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg">🎉 No duplicates found</p>
              <p className="text-xs text-gray-400 mt-1">No duplicate files on {selectedDrive}.</p>
            </div>
          )}
          {!scanned && (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm text-gray-400">Pick a drive and scan for duplicate files</p>
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
            Open location
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(ctxMenu.file); setCtxMenu(null) }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Copy path
          </button>
          <button
            onClick={() => { toggleFile(ctxMenu.groupIdx, ctxMenu.file); setCtxMenu(null) }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
          >
            Toggle select
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
