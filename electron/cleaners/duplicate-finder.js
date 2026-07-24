const { execFile } = require('child_process')

const PS = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

async function listDrives() {
  const script = `Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 } | ForEach-Object { [PSCustomObject]@{ Root = $_.Root; Used = $_.Used; Free = $_.Free } } | ConvertTo-Json -Compress`
  return new Promise((resolve) => {
    const child = execFile(PS, ['-NoProfile', '-Command', script], { maxBuffer: 1024 * 1024, timeout: 10000 }, (err, stdout) => {
      if (err) { resolve([]); return }
      try {
        const data = JSON.parse(stdout.trim())
        if (!data) { resolve([]); return }
        const arr = Array.isArray(data) ? data : [data]
        resolve(arr.map(d => ({ root: d.Root.replace('\\', ''), used: d.Used, free: d.Free })))
      } catch { resolve([]) }
    })
  })
}

async function scan(driveRoot) {
  const script = `
    $root = '${driveRoot.replace(/\\/g, '\\\\')}'
    $sizeMap = @{}
    Get-ChildItem -Path $root -Recurse -File -ErrorAction SilentlyContinue -Depth 4 | Where-Object { $_.Length -gt 1024 -and $_.Length -lt 1073741824 } | ForEach-Object {
      $key = $_.Length
      if (-not $sizeMap.ContainsKey($key)) { $sizeMap[$key] = @() }
      $sizeMap[$key] += $_.FullName
    }
    $result = @()
    foreach ($key in $sizeMap.Keys) {
      $files = $sizeMap[$key]
      if ($files.Count -lt 2) { continue }
      $hashMap = @{}
      foreach ($f in $files) {
        try {
          $hash = (Get-FileHash -Path $f -Algorithm SHA256 -ErrorAction Stop).Hash
          if (-not $hashMap.ContainsKey($hash)) { $hashMap[$hash] = @() }
          $hashMap[$hash] += $f
        } catch {}
      }
      foreach ($h in $hashMap.Keys) {
        $dupFiles = $hashMap[$h]
        if ($dupFiles.Count -lt 2) { continue }
        $first = Get-Item $dupFiles[0] -ErrorAction SilentlyContinue
        $result += [PSCustomObject]@{
          Hash = $h
          Size = $first.Length
          Files = ($dupFiles | ForEach-Object { $_ })
        }
      }
    }
    $result | Sort-Object Size -Descending | ConvertTo-Json -Compress -Depth 10
  `
  return new Promise((resolve) => {
    const child = execFile(PS, ['-NoProfile', '-Command', script], { maxBuffer: 200 * 1024 * 1024, timeout: 300000 }, (err, stdout) => {
      if (err) { resolve([]); return }
      try {
        const data = JSON.parse(stdout.trim())
        if (!data) { resolve([]); return }
        const arr = Array.isArray(data) ? data : [data]
        resolve(arr.map(g => ({
          hash: g.Hash,
          size: g.Size,
          files: g.Files
        })))
      } catch { resolve([]) }
    })
  })
}

async function deleteFiles(filePaths) {
  const json = JSON.stringify(filePaths)
  const script = `
    $paths = '${json.replace(/'/g, "''")}' | ConvertFrom-Json
    $restoreRoot = [Environment]::GetFolderPath('UserProfile') + '\\.sweep-helper-restore'
    if (-not (Test-Path $restoreRoot)) { New-Item -ItemType Directory -Path $restoreRoot -Force | Out-Null }
    $batch = [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
    foreach ($p in $paths) {
      $dest = Join-Path $restoreRoot $batch ([IO.Path]::GetFileName($p))
      $i = 1
      while (Test-Path $dest) { $dest = Join-Path $restoreRoot $batch ('{0}_{1}{2}' -f [IO.Path]::GetFileNameWithoutExtension($p), $i, [IO.Path]::GetExtension($p)); $i++ }
      $parent = Split-Path $dest -Parent
      if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
      try { Move-Item -Path $p -Destination $dest -Force -ErrorAction Stop } catch {}
    }
    Write-Output 'ok'
  `
  return new Promise((resolve) => {
    const child = execFile(PS, ['-NoProfile', '-Command', script], { maxBuffer: 50 * 1024 * 1024, timeout: 60000 }, (err) => resolve({ success: !err }))
  })
}

module.exports = { listDrives, scan, deleteFiles }
