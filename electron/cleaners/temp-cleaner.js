const fs = require('fs')
const path = require('path')
const os = require('os')

const TEMP_DIRS = [
  { id: 'temp-user', label: 'App temp files', path: os.tmpdir() },
  { id: 'temp-recent', label: 'Recent documents', path: path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent') },
  { id: 'temp-prefetch', label: 'Prefetch files', path: path.join(process.env.SystemRoot || 'C:\\Windows', 'Prefetch') }
]

function getDirSize(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return 0
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    let total = 0
    for (const entry of entries) {
      try {
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isFile()) {
          total += fs.statSync(fullPath).size
        }
      } catch {}
    }
    return total
  } catch {
    return 0
  }
}

exports.scan = async () => {
  const results = []
  let totalBytes = 0
  for (const dir of TEMP_DIRS) {
    const size = getDirSize(dir.path)
    totalBytes += size
    results.push({ id: 'temp', subId: dir.id, label: dir.label, size, path: dir.path })
  }
  return [{ id: 'temp', label: 'Temporary Files', size: totalBytes, subCategories: results }]
}

exports.clean = async (subCategories) => {
  for (const sub of subCategories) {
    const dir = TEMP_DIRS.find(d => d.id === sub.subId)
    if (!dir) continue
    try {
      if (fs.existsSync(dir.path)) {
        const entries = fs.readdirSync(dir.path)
        for (const entry of entries) {
          try {
            const fullPath = path.join(dir.path, entry)
            fs.rmSync(fullPath, { recursive: true, force: true })
          } catch {}
        }
      }
    } catch {}
  }
  return { success: true }
}