import "vite/client"
import "vite-plugin-pages/client"

declare global {
  interface Window {
    MonacoEnvironment: {
      getWorker(moduleId: string, label: string): Worker | void
    }
  }
}
