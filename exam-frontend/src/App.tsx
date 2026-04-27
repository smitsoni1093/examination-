import { Provider } from 'react-redux';
import { store } from './store/store';
import AppRouter from './router/AppRouter';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import './i18n/i18n';

const ThemedApp = () => {
  const mode = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
          h5: {
            fontWeight: 600,
            letterSpacing: '-0.5px',
          },
        },
        palette: {
          mode,
          primary: {
            main: '#2563EB',
            contrastText: '#fff',
          },
          secondary: {
            main: '#10B981',
          },
          background: {
            default: mode === 'light' ? '#F8FAFC' : '#000000',
            paper: mode === 'light' ? '#FFFFFF' : '#000000',
          },
          text: {
            primary: mode === 'light' ? '#0F172A' : '#FFFFFF',
            secondary: mode === 'light' ? '#475569' : '#CBD5E1',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: mode === 'dark' ? '#000000' : '#F8FAFC',
                color: mode === 'dark' ? '#FFFFFF' : '#0F172A',
                transition: 'background-color 220ms ease, color 220ms ease',
              },
            },
          },
          MuiButtonBase: {
            styleOverrides: {
              root: {
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                fontWeight: 600,
                boxShadow: 'none',
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
              contained: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: '#FFFFFF',
                border: mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.35)' : undefined,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? '#111111' : undefined,
                },
              },
              outlined: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
                borderColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.45)' : undefined,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? '#111111' : undefined,
                },
              },
              text: {
                color: mode === 'dark' ? '#FFFFFF' : undefined,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : undefined,
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
                boxShadow:
                  mode === 'light'
                    ? '0 10px 40px rgba(0,0,0,0.04)'
                    : '0 10px 40px rgba(0, 0, 0, 0.8)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                  backgroundColor: mode === 'dark' ? '#000000' : undefined,
                  color: mode === 'dark' ? '#FFFFFF' : undefined,
                },
                '& .MuiInputLabel-root': {
                  color: mode === 'dark' ? '#CBD5E1' : undefined,
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              select: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
              icon: {
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
              notchedOutline: {
                borderColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.35)' : undefined,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
                border: mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.28)' : undefined,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#000000' : undefined,
                color: mode === 'dark' ? '#FFFFFF' : undefined,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
}

export default App;
