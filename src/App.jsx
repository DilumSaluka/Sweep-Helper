import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import Results from './components/Results'
import ThemeToggle from './components/ThemeToggle'
import UninstallManager from './components/UninstallManager'
import LargeFileFinder from './components/LargeFileFinder'
import StartupManager from './components/StartupManager'
import DuplicateFinder from './components/DuplicateFinder'
import Settings from './components/Settings'

const TABS = [
  { id: 'clean', label: 'Cleaner', icon: '🧹' },
  { id: 'uninstall', label: 'Uninstall', icon: '🗑️' },
  { id: 'files', label: 'Files', icon: '📂' },
  { id: 'startup', label: 'Startup', icon: '⚡' },
  { id: 'duplicates', label: 'Duplicates', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
]

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('sweep-dark')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [tab, setTab] = useState(() => localStorage.getItem('sweep-tab') || 'clean')
  const [items, setItems] = useState([])
  const [scanning, setScanning] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [results, setResults] = useState(null)
  const [canUndo, setCanUndo] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [dlProgress, setDlProgress] = useState(null)
  const [updateError, setUpdateError] = useState(null)
  const [showAbout, setShowAbout] = useState(false)
  const [isAdmin, setIsAdmin] = useState(true)
  const [autoStart, setAutoStart] = useState(false)
  const [showWhatsNew, setShowWhatsNew] = useState(false)
  const [showRestorePoints, setShowRestorePoints] = useState(false)
  const [restorePoints, setRestorePoints] = useState([])
  const [scheduleActive, setScheduleActive] = useState(false)
  const [minimizedOnStart, setMinimizedOnStart] = useState(false)
  const [explorerMenu, setExplorerMenu] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('sweep-whatsnew')
    if (seen !== 'v1.5.0') {
      setShowWhatsNew(true)
      localStorage.setItem('sweep-whatsnew', 'v1.5.0')
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    localStorage.setItem('sweep-dark', JSON.stringify(dark))
  }, [dark])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    ;(async () => {
      try {
        const info = await window.sweep.checkUpdate()
        if (info.available) setUpdateInfo(info)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    window.sweep.isAdmin().then(setIsAdmin).catch(() => {})
  }, [])

  useEffect(() => {
    window.sweep.getAutostart().then(setAutoStart).catch(() => {})
  }, [])

  useEffect(() => {
    window.sweep.scheduleStatus().then(r => setScheduleActive(r.success)).catch(() => {})
  }, [])

  useEffect(() => {
    window.sweep.getStartMinimized().then(setMinimizedOnStart).catch(() => {})
  }, [])

  useEffect(() => {
    window.sweep.checkExplorerMenu().then(setExplorerMenu).catch(() => {})
  }, [])

  const scan = useCallback(async () => {
    setScanning(true)
    setResults(null)
    try {
      const data = await window.sweep.scanDisk()
      setItems(data)
      const hasUndo = await window.sweep.hasRestorableItems()
      setCanUndo(hasUndo)
      setLastScan(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch {}
    setScanning(false)
  }, [])

  useEffect(() => { if (tab === 'clean') scan() }, [tab, scan])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || (e.ctrlKey && e.key === 'w')) window.sweep.closeWindow()
      if (e.ctrlKey && e.key === 'r') { e.preventDefault(); if (tab === 'clean') scan() }
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); setTab('duplicates') }
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); setTab('uninstall') }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); setTab('files') }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); setTab('startup') }
      if (e.ctrlKey && e.key === 'g') { e.preventDefault(); setTab('settings') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tab, scan])

  const handleToggleAutostart = async () => {
    const next = !autoStart
    await window.sweep.setAutostart(next)
    setAutoStart(next)
  }

  const handleToggleMinimizedStart = async () => {
    const next = !minimizedOnStart
    await window.sweep.setStartMinimized(next)
    setMinimizedOnStart(next)
  }

  const handleClean = useCallback(async () => {
    const total = items.reduce((sum, i) => sum + i.size, 0)
    const sizeLabel = total > 1073741824 ? (total / 1073741824).toFixed(1) + ' GB' : (total / 1048576).toFixed(1) + ' MB'
    if (total > 500 * 1024 * 1024) {
      if (!window.confirm(`Sweep ${sizeLabel} of files? This will free a lot of space.`)) return
    }
    try { await window.sweep.createRestorePoint() } catch {}
    setCleaning(true)
    const before = total
    try {
      await window.sweep.cleanItems(items)
    } catch {}
    setResults({ freed: before, count: items.reduce((s, i) => s + (i.subCategories?.length || 1), 0) })
    setCleaning(false)
  }, [items])

  const handleUndo = async () => {
    try {
      await window.sweep.undoLast()
    } catch {}
    setCanUndo(false)
    scan()
  }

  const handleScheduleToggle = async () => {
    if (scheduleActive) {
      await window.sweep.scheduleRemove()
      setScheduleActive(false)
    } else {
      const r = await window.sweep.scheduleWeekly()
      setScheduleActive(r.success)
    }
  }

  const handleViewRestorePoints = async () => {
    try {
      const points = await window.sweep.listRestorePoints()
      setRestorePoints(Array.isArray(points) ? points : [points])
    } catch { setRestorePoints([]) }
    setShowRestorePoints(true)
  }

  const handleRestart = () => {
    setResults(null)
    setItems([])
    scan()
  }

  const handleCheckUpdate = async () => {
    try {
      const info = await window.sweep.checkUpdate()
      if (info.available) setUpdateInfo(info)
    } catch {}
  }

  const handleUpdate = useCallback(async () => {
    if (!updateInfo?.url) return
    setDlProgress('Downloading...')
    setUpdateError(null)
    try {
      const result = await window.sweep.downloadUpdate(updateInfo.url)
      if (result.success) {
        setDlProgress('Installing...')
        await window.sweep.installUpdate(result.path)
      } else {
        setDlProgress(null)
        setUpdateError('Download failed: ' + (result.error || 'Unknown error'))
      }
    } catch {
      setDlProgress(null)
      setUpdateError('Download failed — check your connection')
    }
  }, [updateInfo])

  const updateBanner = (updateInfo || updateError) && (
    <div className={`no-drag flex items-center justify-between px-4 py-1.5 border-b ${
      updateError
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }`}>
      <p className={`text-xs ${updateError ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
        {updateError || `Update v${updateInfo.version} available`}
      </p>
      <button
        onClick={updateError ? () => { setUpdateError(null); handleCheckUpdate() } : handleUpdate}
        disabled={!!dlProgress}
        className={`text-xs px-3 py-0.5 rounded-full font-medium disabled:opacity-50 ${
          updateError
            ? 'bg-gray-600 text-white hover:bg-gray-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {dlProgress || (updateError ? 'Retry' : 'Update')}
      </button>
    </div>
  )

  return (
    <div className={`h-screen flex flex-col ${dark ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="drag flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧹</span>
            <span className="font-semibold text-sm tracking-tight">Sweep Helper <span onClick={() => setShowAbout(true)} className="font-normal text-[10px] text-gray-400 cursor-pointer hover:text-blue-500">v1.5</span>{isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 ml-1">👑 Admin</span>}</span>
          </div>
          <div className="no-drag flex items-center gap-2">
            {canUndo && tab === 'clean' && (
              <button onClick={handleUndo} className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors">
                ↩ Undo
              </button>
            )}
            {pendingCount > 0 && (
              <>
                <button
                  onClick={async () => {
                    await window.sweep.deleteLargeFiles(pendingFiles)
                    setPendingFiles([])
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800"
                >
                  Batch Sweep ({pendingCount})
                </button>
                <button onClick={() => setPendingFiles([])} className="text-xs text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </>
            )}
            <button title="Check for Updates" onClick={handleCheckUpdate} className="text-xs text-gray-400 hover:text-blue-500">🔄</button>
            <button
              title={explorerMenu ? 'Explorer context menu on' : 'Explorer context menu off'}
              onClick={async () => {
                if (explorerMenu) {
                  await window.sweep.removeExplorerMenu()
                  setExplorerMenu(false)
                } else {
                  const r = await window.sweep.installExplorerMenu()
                  if (r.success) setExplorerMenu(true)
                }
              }}
              className={`text-xs ${explorerMenu ? 'text-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              🖱️
            </button>
            <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            <button title="Minimize" onClick={() => window.sweep.minimizeWindow()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">─</button>
            <button title="Close (Esc)" onClick={() => window.sweep.closeWindow()} className="text-gray-400 hover:text-red-500 text-lg leading-none">✕</button>
          </div>
        </div>

        {updateBanner}

        <div className="no-drag flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.id === 'clean' ? 'Ctrl+R to rescan' : t.id === 'uninstall' ? 'Ctrl+U' : t.id === 'files' ? 'Ctrl+F' : t.id === 'startup' ? 'Ctrl+S' : t.id === 'settings' ? 'Ctrl+G' : 'Ctrl+D'}
              className={`flex-1 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'clean' && (
            results ? (
              <Results freed={results.freed} count={results.count} onRestart={handleRestart} />
            ) : (
              <Dashboard
                items={items}
                scanning={scanning}
                cleaning={cleaning}
                onClean={handleClean}
                lastScan={lastScan}
                onRestorePoints={handleViewRestorePoints}
              />
            )
          )}
          {tab === 'uninstall' && <UninstallManager />}
          {tab === 'files' && <LargeFileFinder />}
          {tab === 'startup' && <StartupManager />}
          {tab === 'duplicates' && <DuplicateFinder />}
          {tab === 'settings' && <Settings autoStart={autoStart} onToggleAutostart={handleToggleAutostart} minimizedOnStart={minimizedOnStart} onToggleMinimizedStart={handleToggleMinimizedStart} />}
        </div>
        <div className="no-drag flex items-center justify-center gap-2 text-[10px] text-gray-400 pb-2">
          <span>© 2026 Dilum Saluka</span>
          <span>·</span>
          <a href="https://github.com/DilumSaluka/Sweep-Helper/issues" target="_blank" className="hover:text-blue-500">Feedback</a>
          <span>·</span>
          <button onClick={handleScheduleToggle} className={`hover:text-blue-500 ${scheduleActive ? 'text-green-500' : ''}`}>
            {scheduleActive ? 'Weekly ✓' : 'Schedule'}
          </button>
          {!isAdmin && <span className="text-amber-500">⚠️ Limited mode</span>}
        </div>
      </div>

      {showWhatsNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowWhatsNew(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-5 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm text-left" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-sm mb-2">🎉 What's New in v1.5</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>🔄 Silent auto-update (no install wizard)</li>
              <li>🛡️ View system restore points dialog</li>
              <li>📅 Schedule weekly automatic cleanup</li>
              <li>💾 Disk donut chart in Dashboard</li>
              <li>⌨️ Ctrl+D/U/F/S keyboard shortcuts</li>
              <li>👑 Admin badge in title bar</li>
              <li>📁 File counts in cleaner subcategories</li>
              <li>💾 Save & restore window position</li>
              <li>⏹️ Cancel scan button for large files</li>
              <li>📅 Keep Newest button in Duplicates</li>
              <li>🖱️ Right-click context menu on duplicates</li>
              <li>🔄 Shift+click select entire group</li>
              <li>⊟ Start minimized to tray option</li>
              <li>🖱️ Explorer right-click context menu</li>
              <li>🛡️ Manual restore point button</li>
            </ul>
            <button onClick={() => setShowWhatsNew(false)} className="mt-4 w-full px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Got it!</button>
          </div>
        </div>
      )}
      {showRestorePoints && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRestorePoints(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-5 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm">System Restore Points</p>
              <button onClick={() => setShowRestorePoints(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">✕</button>
            </div>
            {restorePoints.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No restore points found.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {restorePoints.map((rp, i) => (
                  <div key={rp.SequenceNumber || i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium">{rp.Description || 'Restore Point'}</p>
                    <p className="text-[10px] text-gray-400">{rp.CreationTime ? new Date(rp.CreationTime).toLocaleString() : ''}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowRestorePoints(false)} className="mt-4 w-full px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Close</button>
          </div>
        </div>
      )}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAbout(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-5 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-xs text-center" onClick={e => e.stopPropagation()}>
            <p className="text-2xl mb-2">🧹</p>
            <p className="font-bold text-sm">Sweep Helper v1.5</p>
            <p className="text-xs text-gray-400 mt-1">Clean your PC in one click</p>
            <p className="text-xs text-gray-400 mt-3">By <a href="https://github.com/DilumSaluka" className="text-blue-500 hover:underline" target="_blank">Dilum Saluka</a></p>
            <p className="text-xs text-gray-400">MIT License</p>
            <button onClick={() => setShowAbout(false)} className="mt-4 px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}