const fs = require('fs')
const path = require('path')
const os = require('os')

const SAFE_BIN_DIR = path.join(os.homedir(), '.sweep-helper-restore')
const METADATA_FILE = path.join(SAFE_BIN_DIR, 'metadata.json')

function ensureSafeBin() {
  if (!fs.existsSync(SAFE_BIN_DIR)) {
    fs.mkdirSync(SAFE_BIN_DIR, { recursive: true })
  }
}

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'))
    }
  } catch {}
  return { sessions: [] }
}

function saveMetadata(data) {
  ensureSafeBin()
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

exports.moveToSafeBin = (sourcePath) => {
  ensureSafeBin()
  const timestamp = Date.now()
  const destName = String(timestamp) + '-' + path.basename(sourcePath)
  const destPath = path.join(SAFE_BIN_DIR, destName)
  try {
    fs.renameSync(sourcePath, destPath)
    const meta = loadMetadata()
    const entry = { id: destName, originalPath: sourcePath, movedTo: destPath, timestamp, restored: false }
    if (!meta.sessions.length || meta.sessions[0].timestamp < Date.now() - 86400000) {
      meta.sessions.unshift({ timestamp, items: [entry] })
    } else {
      meta.sessions[0].items.push(entry)
    }
    saveMetadata(meta)
    return entry
  } catch { return null }
}

exports.restoreLast = async () => {
  const meta = loadMetadata()
  if (!meta.sessions.length) return false
  const session = meta.sessions[0]
  let restored = 0
  for (const item of session.items) {
    try {
      const dir = path.dirname(item.originalPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.renameSync(item.movedTo, item.originalPath)
      item.restored = true
      restored++
    } catch {}
  }
  saveMetadata(meta)
  return restored > 0
}

exports.hasRestorableItems = () => {
  const meta = loadMetadata()
  return meta.sessions.length > 0 && meta.sessions[0].items.some(i => !i.restored)
}

exports.purgeOldItems = () => {
  const meta = loadMetadata()
  const cutoff = Date.now() - 7 * 86400000
  const keeper = { sessions: [] }
  for (const session of meta.sessions) {
    if (session.timestamp < cutoff) {
      for (const item of session.items) {
        try { fs.unlinkSync(item.movedTo) } catch {}
      }
    } else {
      keeper.sessions.push(session)
    }
  }
  saveMetadata(keeper)
}