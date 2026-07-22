const fs = require('fs')
const path = require('path')
const os = require('os')

const BROWSER_CACHE_DIRS = [
  { id: 'cache-chrome', label: 'Google Chrome', path: path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache') },
  { id: 'cache-chrome2', label: 'Google Chrome (Code Cache)', path: path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache') },
  { id: 'cache-edge', label: 'Microsoft Edge', path: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache') },
  { id: 'cache-edge2', label: 'Microsoft Edge (Code Cache)', path: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache') },
  { id: 'cache-firefox', label: 'Firefox', path: path.join(os.homedir(), 'AppData', 'Local', 'Mozilla', 'Firefox', 'Profiles') }
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
        } else if (entry.isDirectory()) {
          total += getDirSizeRecursive(fullPath)
        }
      } catch {}
    }
    return total
  } catch {
    return 0
  }
}

function getDirSizeRecursive(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    let total = 0
    for (const entry of entries) {
      try {
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isFile()) {
          total += fs.statSync(fullPath).size
        } else if (entry.isDirectory()) {
          total += getDirSizeRecursive(fullPath)
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

  for (const dir of BROWSER_CACHE_DIRS) {
    if (dir.id === 'cache-firefox') {
      try {
        if (fs.existsSync(dir.path)) {
          const profiles = fs.readdirSync(dir.path)
          let firefoxSize = 0
          for (const profile of profiles) {
            const cachePath = path.join(dir.path, profile, 'cache2')
            const entries = path.join(dir.path, profile, 'thumbnails')
            firefoxSize += getDirSizeRecursive(cachePath)
            firefoxSize += getDirSizeRecursive(entries)
          }
          totalBytes += firefoxSize
          results.push({ id: 'browser', subId: dir.id, label: dir.label, size: firefoxSize, path: dir.path })
        }
      } catch {}
    } else {
      const size = getDirSizeRecursive(dir.path)
      totalBytes += size
      results.push({ id: 'browser', subId: dir.id, label: dir.label, size, path: dir.path })
    }
  }

  return [{ id: 'browser', label: 'Browser Cache', size: totalBytes, subCategories: results }]
}

exports.clean = async (subCategories) => {
  for (const sub of subCategories) {
    const dir = BROWSER_CACHE_DIRS.find(d => d.id === sub.subId)
    if (!dir) continue
    try {
      if (fs.existsSync(dir.path)) {
        if (dir.id === 'cache-firefox') {
          const profiles = fs.readdirSync(dir.path)
          for (const profile of profiles) {
            const cachePath = path.join(dir.path, profile, 'cache2')
            if (fs.existsSync(cachePath)) {
              const entries = fs.readdirSync(cachePath)
              for (const e of entries) {
                try { fs.rmSync(path.join(cachePath, e), { recursive: true, force: true }) } catch {}
              }
            }
          }
        } else {
          const entries = fs.readdirSync(dir.path)
          for (const e of entries) {
            try { fs.rmSync(path.join(dir.path, e), { recursive: true, force: true }) } catch {}
          }
        }
      }
    } catch {}
  }
  return { success: true }
}
