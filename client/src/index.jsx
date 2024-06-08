import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { RawIntlProvider, intl } from './i18n'
import './index.css'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
    <RawIntlProvider value={intl}>
        <App />
    </RawIntlProvider>
)
