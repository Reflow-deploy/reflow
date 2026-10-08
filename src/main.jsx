/**
 * main.jsx — Ponto de entrada do site.
 *
 * Liga o React ao <div id="root"> do index.html e renderiza o componente App (src/App.jsx).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
