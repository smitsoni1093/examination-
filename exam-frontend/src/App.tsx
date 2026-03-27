import { Provider } from 'react-redux';
import { store } from './store/store';
import AppRouter from './router/AppRouter';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './i18n/i18n';
// Remove fontsource to avoid TS error
const theme = createTheme({
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.5px'
    }
  },
  palette: {
    primary: {
      main: '#6D28D9', // A modern violet
      contrastText: '#fff'
    },
    secondary: {
      main: '#10B981', // Emerald green
    },
    background: {
      default: '#F9FAFB'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          }
        }
      }
    }
  }
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
