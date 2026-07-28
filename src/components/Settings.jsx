export default function Settings({ autoStart, onToggleAutostart }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">General</h3>
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