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
  const [dark, setDark] = useState(true)
  const [tab, setTab] = useState('clean')
  const [items, setItems] = useState([])
  const [scanning, setScanning] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [results, setResults] = useState(null)
  const [canUndo, setCanUndo] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [dlProgress, setDlProgress] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || (e.ctrlKey && e.key === 'w')) window.sweep.closeWindow()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const info = await window.sweep.checkUpdate()
        if (info.available) setUpdateInfo(info)
      } catch {}
    })()
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

  const handleClean = async () => {
    const total = items.reduce((sum, i) => sum + i.size, 0)
    const sizeLabel = total > 1073741824 ? (total / 1073741824).toFixed(1) + ' GB' : (total / 1048576).toFixed(1) + ' MB'
    if (total > 500 * 1024 * 1024) {
      if (!window.confirm(`Sweep ${sizeLabel} of files? This will free a lot of space.`)) return
    }
    setCleaning(true)
    const before = total
    try {
      await window.sweep.cleanItems(items)
    } catch {}
    setResults({ freed: before, count: items.reduce((s, i) => s + (i.subCategories?.length || 1), 0) })
    setCleaning(false)
  }

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

  const handleUpdate = async () => {
    if (!updateInfo?.url) return
    setDlProgress('Downloading...')
    try {
      const result = await window.sweep.downloadUpdate(updateInfo.url)
      if (result.success) {
        setDlProgress('Installing...')
        await window.sweep.installUpdate(result.path)
      } else {
        setDlProgress(null)
      }
    } catch {
      setDlProgress(null)
    }
  }

  const updateBanner = updateInfo && (
    <div className="no-drag flex items-center justify-between px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <p className="text-xs text-blue-600 dark:text-blue-400">
        Update v{updateInfo.version} available
      </p>
      <button
        onClick={handleUpdate}
        disabled={!!dlProgress}
        className="text-xs px-3 py-0.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {dlProgress || 'Update'}
      </button>
    </div>
  )

  return (
    <div className={`h-screen flex flex-col ${dark ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="drag flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧹</span>
            <span className="font-semibold text-sm tracking-tight">Sweep Helper <span className="font-normal text-[10px] text-gray-400">v1.2</span></span>
          </div>
          <div className="no-drag flex items-center gap-2">
            {canUndo && tab === 'clean' && (
              <button onClick={handleUndo} className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors">
                ↩ Undo
              </button>
            )}
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
        <div className="no-drag text-center text-[10px] text-gray-400 pb-2">
          © 2026 Dilum Saluka
        </div>
      </div>
    </div>
  )
}
