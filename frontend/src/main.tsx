import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import { store } from './app/store'
import { prefetchOnIntent, preloadInitialRoute } from './app/routeChunks'
import './index.css'

// the app decides where each page starts (App.tsx), not the browser's scroll memory
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
preloadInitialRoute()
prefetchOnIntent()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
