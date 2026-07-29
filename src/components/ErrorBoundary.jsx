import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-medium text-red-500">Something went wrong</p>
          <p className="text-xs text-gray-400 max-w-xs">{this.state.error.message}</p>
          <pre className="text-[10px] text-gray-500 max-w-sm overflow-auto text-left bg-gray-100 dark:bg-gray-800 p-2 rounded">{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
