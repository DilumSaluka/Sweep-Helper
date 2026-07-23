import { useState } from 'react'

export default function LargeFileFinder() {
  const [files, setFiles] = useState([])
  const [scanning, setScanning] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [scanned, setScanned] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    setFiles([])
    setSelected(new Set())
    setScanned(false)
    try {
      const data = await window.sweep.scanLargeFiles()
      setFiles(data)
    } catch {}
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          {scanned ? `${files.length} files >100MB found` : 'Scan your PC for large files'}
        </p>
        <div className="flex gap-2">
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
              {deleting ? 'Moving to safe bin...' : `Delete (${selected.size})`}
            </button>
          )}
          <button
            onClick={handleScan}
            disabled={scanning}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
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
            ) : scanned ? 'Rescan' : 'Scan Now'}
          </button>
        </div>
      </div>

      {scanning && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Searching for large files...</p>
        </div>
      )}

      {!scanning && (
        <div className="flex-1 overflow-y-auto space-y-1">
          {files.map((file, i) => (
            <div
              key={i}
              onClick={() => toggleFile(file.path)}
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
              <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {formatSize(file.size)}
              </span>
            </div>
          ))}
          {scanned && files.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg">🎉 No large files found</p>
              <p className="text-xs text-gray-400 mt-1">Nothing over 100 MB in your user folders.</p>
            </div>
          )}
          {!scanned && (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-sm text-gray-400">Hit "Scan Now" to find files over 100 MB</p>
            </div>
          )}
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
