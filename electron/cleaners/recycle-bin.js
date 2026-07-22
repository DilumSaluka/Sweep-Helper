const { execSync } = require('child_process')

exports.scan = async () => {
  try {
    const cmd = 'powershell -Command "(New-Object -ComObject Shell.Application).NameSpace(0x0a).Items() | foreach { $_.Size } | Measure-Object -Sum | Select-Object -ExpandProperty Sum"'
    const output = execSync(cmd, { timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] })
    const size = parseInt(output.toString().trim()) || 0
    return [{ id: 'recycle', label: 'Recycle Bin', size, path: 'shell:RecycleBinFolder' }]
  } catch {
    return [{ id: 'recycle', label: 'Recycle Bin', size: 0, path: 'shell:RecycleBinFolder' }]
  }
}

exports.clean = async () => {
  try {
    execSync('powershell -Command "Clear-RecycleBin -Force"', { timeout: 10000, stdio: 'ignore' })
  } catch {
    try {
      execSync('cmd /c rd /s /q C:\\$Recycle.bin 2>nul', { timeout: 5000, stdio: 'ignore' })
    } catch {}
  }
  return { success: true }
}