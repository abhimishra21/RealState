import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store'; // Assuming you had a store here
import { ThemeProvider } from '@mui/material/styles'; // Assuming Material-UI
import theme from './theme'; // Assuming your theme file
import './styles/globals.css'; // Assuming your global styles
import { SnackbarProvider } from 'notistack'; // Assuming notistack

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
); 