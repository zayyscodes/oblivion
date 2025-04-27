import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './Routes';
import { BrowserRouter as Router } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AppRoutes />
    </Router>
  </StrictMode>,
)
