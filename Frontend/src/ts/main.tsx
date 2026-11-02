import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '../styles/reset.css';
import '../styles/assets.css';
import '../styles/button.css';
import '../styles/menu.css';
import '../styles/host.css';
import '../styles/tekst.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);