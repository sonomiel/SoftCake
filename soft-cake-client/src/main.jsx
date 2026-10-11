import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'

import "primereact/resources/themes/lara-light-cyan/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"
import "primeflex/primeflex.css"
import "./index.css"

import App from './App.jsx'
import { PermisosProvider } from "./components/context/permisoscontext.jsx"
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrimeReactProvider>          
      <BrowserRouter>
        <PermisosProvider>
          <App />
        </PermisosProvider>
      </BrowserRouter>
    </PrimeReactProvider>          
  </StrictMode>,
)