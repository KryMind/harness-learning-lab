import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './monaco'
import App from './App'
import { ThemeProvider } from './theme'
import { DataProvider } from './data'
import '@xyflow/react/dist/style.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter：GitHub Pages 子路径下刷新不 404（如 /#/architecture） */}
    <HashRouter>
      <ThemeProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)
