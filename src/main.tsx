import React from 'react'
import ReactDOM from 'react-dom/client'
import { AdminPortal } from './app/components/Admin/AdminPortal'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <AdminPortal />
    </React.StrictMode>,
)