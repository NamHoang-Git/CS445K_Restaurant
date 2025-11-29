import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { RouterProvider } from 'react-router-dom';
import router from './route/index.jsx';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import { ThemeProvider } from '@/components/adminDashboard/theme-provider';

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RouterProvider router={router} />
        </ThemeProvider>
    </Provider>
    // </StrictMode>,
);
