import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import Results from './components/Results'
import ThemeToggle from './components/ThemeToggle'
import UninstallManager from './components/UninstallManager'
import LargeFileFinder from './components/LargeFileFinder'
import StartupManager from './components/StartupManager'
import DuplicateFinder from './components/DuplicateFinder'

const TABS = [
  { id: 'clean', label: 'Cleaner', icon: '🧹' },
  { id: 'uninstall', label: 'Uninstall', icon: '🗑️' },
  { id: 'files', label: 'Files', icon: '📂' },
  { id: 'startup', label: 'Startup', icon: '⚡' },
  { id: 'duplicates', label: 'Duplicates', icon: '📋' }
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    localStorage.setItem('sweep-dark', JSON.stringify(dark))
  }, [dark])

  useEffect(() => {
    localStorage.setItem('sweep-tab', tab)
  }, [tab])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || (e.ctrlKey && e.key === 'w')) window.sweep.closeWindow()
      if (e.ctrlKey && e.key === 'r') { e.preventDefault(); if (tab === 'clean') scan() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tab, scan])

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
            <span className="font-semibold text-sm tracking-tight">Sweep Helper <span onClick={() => setShowAbout(true)} className="font-normal text-[10px] text-gray-400 cursor-pointer hover:text-blue-500">v1.3</span></span>
          </div>
          <div className="no-drag flex items-center gap-2">
            {canUndo && tab === 'clean' && (
              <button onClick={handleUndo} className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors">
                ↩ Undo
              </button>
            )}
            <button title="Check for Updates" onClick={handleCheckUpdate} className="text-xs text-gray-400 hover:text-blue-500">🔄</button>
            <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            <button
              title={autoStart ? 'Auto-start on' : 'Auto-start off'}
              onClick={async () => {
                const next = !autoStart
                await window.sweep.setAutostart(next)
                setAutoStart(next)
              }}
              className={`text-xs ${autoStart ? 'text-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              ⚡
            </button>
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
              />
            )
          )}
          {tab === 'uninstall' && <UninstallManager />}
          {tab === 'files' && <LargeFileFinder />}
          {tab === 'startup' && <StartupManager />}
          {tab === 'duplicates' && <DuplicateFinder />}
        </div>
        <div className="no-drag flex items-center justify-center gap-2 text-[10px] text-gray-400 pb-2">
          <span>© 2026 Dilum Saluka</span>
          <span>·</span>
          <a href="https://github.com/DilumSaluka/Sweep-Helper/issues" target="_blank" className="hover:text-blue-500">Feedback</a>
          {!isAdmin && <span className="text-amber-500">⚠️ Limited mode</span>}
        </div>
      </div>

      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAbout(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-5 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-xs text-center" onClick={e => e.stopPropagation()}>
            <p className="text-2xl mb-2">🧹</p>
            <p className="font-bold text-sm">Sweep Helper v1.3</p>
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
