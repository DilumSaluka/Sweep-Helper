const { execFile } = require('child_process')

const POWER_SHELL = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

async function list() {
  const script = `
    $paths = @(
      'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
      'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
      'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
    )
    $results = @()
    foreach ($regPath in $paths) {
      if (-not (Test-Path $regPath)) { continue }
      Get-ItemProperty $regPath -ErrorAction SilentlyContinue | Where-Object {
        $_.DisplayName -and $_.SystemComponent -ne 1 -and $_.ParentKeyName -eq $null -and $_.DisplayName -notmatch '^(KB[0-9]+|Update for|Security Update|Hotfix)'
      } | ForEach-Object {
        $size = if ($_.EstimatedSize) { $_.EstimatedSize * 1024 } else { 0 }
        [PSCustomObject]@{
          Name = $_.DisplayName
          Version = $_.DisplayVersion
          Publisher = $_.Publisher
          Size = $size
          InstallDate = $_.InstallDate
          UninstallString = $_.UninstallString
          QuietUninstallString = $_.QuietUninstallString
        }
      }
    }
    $results | Sort-Object Name | ConvertTo-Json -Compress
  `
  return new Promise((resolve) => {
    const child = execFile(POWER_SHELL, ['-NoProfile', '-Command', script], { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }, (err, stdout) => {
      if (err) { resolve([]); return }
      try {
        const data = JSON.parse(stdout.trim())
        if (!data) { resolve([]); return }
        const arr = Array.isArray(data) ? data : [data]
        resolve(arr.map(a => ({
          name: a.Name,
          version: a.Version || '',
          publisher: a.Publisher || '',
          size: a.Size || 0,
          installDate: a.InstallDate || '',
          uninstallString: a.UninstallString || '',
          quietString: a.QuietUninstallString || ''
        })))
      } catch { resolve([]) }
    })
  })
}

async function uninstall(app) {
  const cmd = app.quietString || app.uninstallString
  if (!cmd) return { success: false, error: 'No uninstall string found' }

  return new Promise((resolve) => {
    const child = execFile(POWER_SHELL, ['-NoProfile', '-Command', `Start-Process -FilePath '${cmd.replace(/'/g, "''")}' -Verb RunAs -Wait`], { maxBuffer: 1024 * 1024, timeout: 120000 }, (err) => {
      resolve({ success: !err, error: err ? err.message : undefined })
    })
  })
}

module.exports = { list, uninstall }
