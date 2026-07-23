const { execFile } = require('child_process')

const POWER_SHELL = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

async function scan() {
  const script = `
    $dirs = @(
      [Environment]::GetFolderPath('Desktop'),
      [Environment]::GetFolderPath('MyDocuments'),
      [Environment]::GetFolderPath('MyPictures'),
      [Environment]::GetFolderPath('MyMusic'),
      [Environment]::GetFolderPath('MyVideos'),
      [Environment]::GetFolderPath('UserProfile') + '\\Downloads'
    )
    $results = @()
    foreach ($dir in $dirs) {
      if (-not (Test-Path $dir)) { continue }
      try {
        Get-ChildItem -Path $dir -Recurse -File -ErrorAction Stop -Depth 4 | Where-Object { $_.Length -gt 104857600 } | ForEach-Object {
          [PSCustomObject]@{ FullName = $_.FullName; Length = $_.Length; LastWrite = $_.LastWriteTime.ToString('yyyy-MM-dd') }
        }
      } catch {}
    }
    $root = [Environment]::GetFolderPath('SystemDrive')
    try {
      Get-ChildItem -Path $root -File -ErrorAction Stop | Where-Object { $_.Length -gt 104857600 } | ForEach-Object {
        [PSCustomObject]@{ FullName = $_.FullName; Length = $_.Length; LastWrite = $_.LastWriteTime.ToString('yyyy-MM-dd') }
      }
    } catch {}
    $results | Sort-Object Length -Descending | ConvertTo-Json -Compress
  `
  return new Promise((resolve) => {
    const child = execFile(POWER_SHELL, ['-NoProfile', '-Command', script], { maxBuffer: 50 * 1024 * 1024, timeout: 60000 }, (err, stdout) => {
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

module.exports = { scan, deleteFiles }
