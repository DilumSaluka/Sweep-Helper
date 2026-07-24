const { execFile } = require('child_process')

const PS = process.env.SystemRoot + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

async function list() {
  const script = `
    $items = @()
    $paths = @(
      'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
      'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce'
    )
    foreach ($p in $paths) {
      if (-not (Test-Path $p)) { continue }
      Get-ItemProperty $p -ErrorAction SilentlyContinue | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -notmatch '^(PSPath|PSParentPath|PSChildName|PSDrive|PSProvider)$' } | ForEach-Object {
        $name = $_.Name
        $val = (Get-ItemProperty -Path $p -Name $name -ErrorAction SilentlyContinue).$name
        $items += [PSCustomObject]@{ Name = $name; Command = $val; Source = if ($p -match '^HKLM') { 'HKLM' } else { 'HKCU' }; Type = 'Registry' }
      }
    }
    $startupFolder = [Environment]::GetFolderPath('Startup')
    if (Test-Path $startupFolder) {
      Get-ChildItem $startupFolder -File | ForEach-Object {
        $items += [PSCustomObject]@{ Name = $_.BaseName; Command = $_.FullName; Source = 'Folder'; Type = 'Shortcut' }
      }
    }
    $items | Sort-Object Name | ConvertTo-Json -Compress
  `
  return new Promise((resolve) => {
    const child = execFile(PS, ['-NoProfile', '-Command', script], { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }, (err, stdout) => {
      if (err) { resolve([]); return }
      try {
        const data = JSON.parse(stdout.trim())
        if (!data) { resolve([]); return }
        const arr = Array.isArray(data) ? data : [data]
        resolve(arr.map(a => ({ name: a.Name, command: a.Command, source: a.Source, type: a.Type })))
      } catch { resolve([]) }
    })
  })
}

async function toggle(item, enable) {
  if (item.source === 'Folder') {
    const folder = process.env.APPDATA + '\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'
    const filePath = folder + '\\' + item.name + '.lnk'
    const newPath = folder + '\\' + (enable ? item.name : '_disabled_' + item.name) + '.lnk'
    const from = enable ? newPath : filePath
    const to = (enable ? item.name : '_disabled_' + item.name) + '.lnk'
    const script = `Rename-Item -Path '${from.replace(/'/g, "''")}' -NewName '${to.replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue; Write-Output 'ok'`
    return new Promise((resolve) => {
      const child = execFile(PS, ['-NoProfile', '-Command', script], { timeout: 10000 }, (err) => resolve({ success: !err }))
    })
  }
  const regPath = item.source === 'HKLM'
    ? 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
    : 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
  if (enable) {
    const script = `Set-ItemProperty -Path '${regPath}' -Name '${item.name.replace(/'/g, "''")}' -Value '${item.command.replace(/'/g, "''")}' -ErrorAction SilentlyContinue; Write-Output 'ok'`
    return new Promise((resolve) => {
      const child = execFile(PS, ['-NoProfile', '-Command', script], { timeout: 10000 }, (err) => resolve({ success: !err }))
    })
  }
  const script = `Remove-ItemProperty -Path '${regPath}' -Name '${item.name.replace(/'/g, "''")}' -ErrorAction SilentlyContinue; Write-Output 'ok'`
  return new Promise((resolve) => {
    const child = execFile(PS, ['-NoProfile', '-Command', script], { timeout: 10000 }, (err) => resolve({ success: !err }))
  })
}

module.exports = { list, toggle }
