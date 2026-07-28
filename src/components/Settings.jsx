export default function Settings({ autoStart, onToggleAutostart, minimizedOnStart, onToggleMinimizedStart, explorerMenu, onToggleExplorerMenu, scheduleActive, onToggleSchedule, dark, onToggleTheme, sysInfo, isAdmin }) {
  const totalMem = sysInfo?.totalMem ? (sysInfo.totalMem / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : '—'

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">General</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Auto-start</p>
              <p className="text-xs text-gray-400">Launch Sweep Helper on login</p>
            </div>
            <button
              onClick={onToggleAutostart}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                autoStart
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {autoStart ? 'On' : 'Off'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Start minimized</p>
              <p className="text-xs text-gray-400">Launch to system tray</p>
            </div>
            <button
              onClick={onToggleMinimizedStart}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                minimizedOnStart
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {minimizedOnStart ? 'On' : 'Off'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Explorer context menu</p>
              <p className="text-xs text-gray-400">Right-click menu integration</p>
            </div>
            <button
              onClick={onToggleExplorerMenu}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                explorerMenu
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {explorerMenu ? 'On' : 'Off'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Theme</p>
              <p className="text-xs text-gray-400">{dark ? 'Dark mode' : 'Light mode'}</p>
            </div>
            <button
              onClick={onToggleTheme}
              className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">Cleanup</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Weekly schedule</p>
            <p className="text-xs text-gray-400">Auto-clean on a weekly schedule</p>
          </div>
          <button
            onClick={onToggleSchedule}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              scheduleActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
            }`}
          >
            {scheduleActive ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">System</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">OS</span>
            <span>{sysInfo?.platform || '—'} {sysInfo?.release || ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">RAM</span>
            <span>{totalMem}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Hostname</span>
            <span>{sysInfo?.hostname || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Admin</span>
            <span>{isAdmin ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
        <h3 className="text-sm font-medium mb-2">About</h3>
        <p className="text-sm">Sweep Helper v1.6</p>
        <p className="text-xs text-gray-400 mt-1">Clean your PC in one click</p>
        <p className="text-xs text-gray-400 mt-2">
          By <a href="https://github.com/DilumSaluka" className="text-blue-500 hover:underline" target="_blank">Dilum Saluka</a>
        </p>
        <p className="text-xs text-gray-400">MIT License</p>
        <a
          href="https://github.com/DilumSaluka/Sweep-Helper/issues"
          target="_blank"
          className="inline-block mt-3 text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Send Feedback
        </a>
      </div>
    </div>
  )
}
