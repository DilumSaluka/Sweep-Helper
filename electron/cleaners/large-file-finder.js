const { execFile } = require('child_process')

const POWER_SHELL = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

async function listDrives() {
  const script = `Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 } | ForEach-Object { [PSCustomObject]@{ Root = $_.Root; Used = $_.Used; Free = $_.Free } } | ConvertTo-Json -Compress`
  return new Promise((resolve) => {
    const child = execFile(POWER_SHELL, ['-NoProfile', '-Command', script], { maxBuffer: 1024 * 1024, timeout: 10000 }, (err, stdout) => {
      if (err) { resolve([]); return }
      try {
        const data = JSON.parse(stdout.trim())
        if (!data) { resolve([]); return }
        const arr = Array.isArray(data) ? data : [data]
        resolve(arr.map(d => ({
          root: d.Root.replace('\\', ''),
          used: d.Used,
          free: d.Free
        })))
      } catch { resolve([]) }
    })
  })
}

async function scan(driveRoot) {
  const script = `
    $root = '${driveRoot.replace(/\\/g, '\\\\')}'
    $results = @()
    try {
      Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue -Depth 6 | Where-Object { $_.Length -gt 104857600 } | ForEach-Object {
        [PSCustomObject]@{ FullName = $_.FullName; Length = $_.Length; LastWrite = $_.LastWriteTime.ToString('yyyy-MM-dd') }
      }
    } catch {}
    $results | Sort-Object Length -Descending | ConvertTo-Json -Compress
  `
  return new Promise((resolve) => {
    const child = execFile(POWER_SHELL, ['-NoProfile', '-Command', script], { maxBuffer: 100 * 1024 * 1024, timeout: 120000 }, (err, stdout) => {
      if (err) { resolve([]); return }
      try {
        const data = JSON.parse(stdout.trim())
        if (!data) { resolve([]); return }
        const arr = Array.isArray(data) ? data : [data]
        resolve(arr.map(f => ({
          path: f.FullName,
          size: f.Length,
          modified: f.LastWrite
        })))
      } catch { resolve([]) }
    })
  })
}

async function deleteFiles(filePaths) {
  const script = `
    $restoreRoot = [Environment]::GetFolderPath('UserProfile') + '\\.sweep-helper-restore'
    if (-not (Test-Path $restoreRoot)) { New-Item -ItemType Directory -Path $restoreRoot -Force | Out-Null }
    $batch = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
    foreach ($p in @(${filePaths.map(p => `'${p.replace(/'/g, "''")}'`).join(',')})) {
      $dest = \"$restoreRoot\\$batch\\$([IO.Path]::GetFileName($p))\"
      $i = 1
      while (Test-Path $dest) { $dest = \"$restoreRoot\\$batch\\$([IO.Path]::GetFileNameWithoutExtension($p))_$i$([IO.Path]::GetExtension($p))\"; $i++ }
      $parent = Split-Path $dest -Parent
      if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
      try { Move-Item -Path $p -Destination $dest -Force -ErrorAction Stop } catch {}
    }
    Write-Output 'ok'
  `
  return new Promise((resolve) => {
    const child = execFile(POWER_SHELL, ['-NoProfile', '-Command', script], { maxBuffer: 50 * 1024 * 1024, timeout: 60000 }, (err) => {
      resolve({ success: !err })
    })
  })
}

module.exports = { listDrives, scan, deleteFiles }
