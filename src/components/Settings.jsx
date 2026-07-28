export default function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium mb-3">General</h3>
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