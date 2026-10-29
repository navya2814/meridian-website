import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { loadExtra } from './lib/engine.js';
import './styles.css';

// Restore any businesses this browser added before the first render.
loadExtra();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
