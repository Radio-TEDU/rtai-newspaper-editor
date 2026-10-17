import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './Workspace';
import './styles.css';
import './editor-enhancements.css';
import './workspace.css';
import './hub-theme.css';
import { initHubTheme } from './hub-theme';

initHubTheme();
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
