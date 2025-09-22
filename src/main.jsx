/*
 * Entry point that boots the React app, applies global styles, and mounts App
 * into the static root element provided by Vite.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
