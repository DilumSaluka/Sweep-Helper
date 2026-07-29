export default function LoadingScreen({ message, fullScreen }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{message || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">{message || 'Loading...'}</p>
    </div>
  )
}
