export default function Settings({ autoStart, onToggleAutostart, minimizedOnStart, onToggleMinimizedStart, explorerMenu, onToggleExplorerMenu }) {
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
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">Cleanup</h3>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">About</h3>
      </div>
    </div>
  )
}