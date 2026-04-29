import { AppBar, Toolbar, Typography, Button, Select, MenuItem, Box, Avatar, IconButton, Container, Stack, Switch, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logout, Language, KeyboardArrowDown, VerifiedUser, LightMode, DarkMode } from '@mui/icons-material';
import { logout } from '../store/authSlice';
import { setThemeMode } from '../store/themeSlice';
import type { RootState } from '../store/store';

const Navbar = () => {
  const { token, role, name } = useSelector((state: RootState) => state.auth);
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const hideLanguagePicker =
    location.pathname === '/login' ||
    location.pathname.startsWith('/user/test/');

  const homeByRole = (r: string | null) => {
    if (r === 'SuperAdmin') return '/superadmin';
    if (r === 'Admin') return '/admin';
    return '/user';
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate(role === 'Admin' || role === 'SuperAdmin' ? '/admin/login' : '/login');
  };

  const openLogoutConfirm = () => {
    setLogoutConfirmOpen(true);
  };

  const closeLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    handleLogout();
  };

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    // Optionally save to backend
    try {
      // await api.patch('/api/user/preferences', { preferredLanguage: lang });
    } catch (error) {
      console.log('Language saved locally');
    }
  };

  const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const languageLabels: Record<string, string> = {
    en: t('common.english'),
    hi: t('common.hindi'),
    gu: t('common.gujarati'),
  };

  const onLanguageSelect = (event: SelectChangeEvent<string>) => {
    handleLanguageChange(event.target.value);
  };

  const onThemeToggle = (_event: unknown, checked: boolean) => {
    dispatch(setThemeMode(checked ? 'dark' : 'light'));
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background:
          themeMode === 'dark'
            ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.92) 0%, rgba(10, 10, 10, 0.92) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 250, 252, 0.88) 100%)',
        backdropFilter: 'saturate(180%) blur(18px)',
        borderBottom: `1px solid ${themeMode === 'dark' ? alpha('#E2E8F0', 0.12) : alpha('#334155', 0.12)}`,
        color: themeMode === 'dark' ? '#F8FAFC' : '#0F172A',
        zIndex: 1201,
        minHeight: { xs: '64px', md: '72px' },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2, md: 4, lg: 6 } }}>
          <Toolbar disableGutters sx={{ minHeight: 'inherit', gap: { xs: 0.8, sm: 1.2, md: 1 } }}>
            {/* Logo Section */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1, 
                cursor: 'pointer',
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' }
              }} 
              onClick={() => navigate(homeByRole(role))}
            >
              <Box sx={{ 
                background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
                width: { xs: 32, sm: 36, md: 40 },
                height: { xs: 32, sm: 36, md: 40 },
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: { xs: 1, sm: 1.5 },
                boxShadow: '0 8px 16px rgba(2, 132, 199, 0.28)'
              }}>
                <Typography sx={{ color: 'white', fontWeight: 900, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>E</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  component="div"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.3rem' },
                    display: 'flex',
                    alignItems: 'center',
                    color: themeMode === 'dark' ? '#F8FAFC' : '#0F172A',
                    lineHeight: 1.1,
                  }}
                >
                  Exam<Box component="span" sx={{ color: '#2563EB', ml: 0.5 }}>Platform</Box>
                </Typography>
                <Typography sx={{ fontSize: { xs: '0.55rem', md: '0.66rem' }, color: themeMode === 'dark' ? '#94A3B8' : '#64748B', letterSpacing: 0.65, textTransform: 'uppercase', display: { xs: 'none', md: 'block' } }}>
                  Secure Assessment Suite
                </Typography>
              </Box>
            </Box>

            {/* Actions Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 1.2, md: 3 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: themeMode === 'dark' ? '#000000' : '#FFFFFF',
                    borderRadius: '14px',
                    px: { xs: 0.5, sm: 0.7, md: 1 },
                    py: 0.5,
                    border: `1px solid ${themeMode === 'dark' ? alpha('#E2E8F0', 0.18) : alpha('#1E293B', 0.16)}`,
                    boxShadow: themeMode === 'dark' ? '0 8px 18px rgba(0, 0, 0, 0.6)' : '0 8px 18px rgba(15, 23, 42, 0.08)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha('#0EA5E9', 0.45),
                      boxShadow: '0 10px 22px rgba(2, 132, 199, 0.16)',
                    },
                  }}
                >
                  <LightMode sx={{ fontSize: { xs: 14, sm: 16 }, color: themeMode === 'dark' ? '#64748B' : '#F59E0B' }} />
                  <Switch
                    checked={themeMode === 'dark'}
                    onChange={onThemeToggle}
                    size="small"
                    sx={{
                      mx: { xs: 0.1, sm: 0.2 },
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#38BDF8' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0EA5E9' },
                      '& .MuiSwitch-track': {
                        bgcolor: themeMode === 'dark' ? '#334155' : '#CBD5E1',
                        opacity: 1,
                      },
                    }}
                  />
                  <DarkMode sx={{ fontSize: { xs: 14, sm: 16 }, color: themeMode === 'dark' ? '#F8FAFC' : '#64748B' }} />
                </Box>

                {!hideLanguagePicker && (
                  <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: themeMode === 'dark' ? '#000000' : '#FFFFFF', 
                  borderRadius: '14px', 
                  px: { xs: 0.6, sm: 1, md: 1.5 },
                  border: `1px solid ${themeMode === 'dark' ? alpha('#E2E8F0', 0.18) : alpha('#1E293B', 0.16)}`,
                  boxShadow: themeMode === 'dark' ? '0 8px 18px rgba(0, 0, 0, 0.6)' : '0 8px 18px rgba(15, 23, 42, 0.08)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: alpha('#0EA5E9', 0.45),
                    boxShadow: '0 10px 22px rgba(2, 132, 199, 0.16)'
                  }
                  }}>
                    <Language sx={{ fontSize: { xs: 15, sm: 17 }, mr: { xs: 0.3, sm: 0.5 }, color: themeMode === 'dark' ? '#93C5FD' : '#0369A1', display: { xs: 'none', sm: 'block' } }} />
                    <Select
                      value={currentLang}
                      onChange={onLanguageSelect}
                      size="small"
                      IconComponent={KeyboardArrowDown}
                      displayEmpty
                      renderValue={(value) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.8 } }}>
                          <Box
                            component="span"
                            sx={{
                              display: { xs: 'none', sm: 'inline-flex' },
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 24,
                              height: 18,
                              borderRadius: '999px',
                              fontSize: '0.55rem',
                              fontWeight: 900,
                              letterSpacing: 0.4,
                              color: '#0C4A6E',
                              bgcolor: alpha('#0EA5E9', 0.14),
                              border: `1px solid ${alpha('#0284C7', 0.2)}`
                            }}
                          >
                            {String(value).toUpperCase()}
                          </Box>
                          <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.78rem', md: '0.84rem' }, fontWeight: 800, color: themeMode === 'dark' ? '#E2E8F0' : '#0F172A', whiteSpace: 'nowrap' }}>
                            {languageLabels[value] || languageLabels.en}
                          </Typography>
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            mt: 0.8,
                            borderRadius: '14px',
                            bgcolor: themeMode === 'dark' ? '#000000' : '#FFFFFF',
                            border: `1px solid ${themeMode === 'dark' ? alpha('#E2E8F0', 0.18) : alpha('#1E293B', 0.1)}`,
                            boxShadow: themeMode === 'dark' ? '0 18px 32px rgba(0, 0, 0, 0.72)' : '0 18px 32px rgba(15, 23, 42, 0.18)',
                            '& .MuiMenuItem-root': {
                              borderRadius: '10px',
                              mx: 0.7,
                              my: 0.35,
                              fontSize: '0.86rem',
                              fontWeight: 700,
                              color: themeMode === 'dark' ? '#E2E8F0' : '#1E293B',
                              '&.Mui-selected': {
                                bgcolor: alpha('#0EA5E9', 0.14),
                                color: themeMode === 'dark' ? '#BAE6FD' : '#0C4A6E',
                              },
                              '&.Mui-selected:hover': {
                                bgcolor: alpha('#0EA5E9', 0.22),
                              },
                            },
                          },
                        },
                      }}
                      sx={{ 
                        minWidth: { xs: 80, sm: 120, md: 154 },
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiSelect-icon': { color: themeMode === 'dark' ? '#93C5FD' : '#0369A1', right: { xs: 4, sm: 6 } },
                        '& .MuiSelect-select': { py: { xs: 0.7, sm: 0.95 }, pr: { xs: 3, sm: 4 }, pl: { xs: 0.15, sm: 0.2 } },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        fontSize: { xs: '0.7rem', sm: '0.78rem', md: '0.84rem' },
                        fontWeight: 700,
                        color: themeMode === 'dark' ? '#E2E8F0' : '#1E293B'
                      }}
                    >
                      <MenuItem value="en">{languageLabels.en}</MenuItem>
                      <MenuItem value="hi">{languageLabels.hi}</MenuItem>
                      <MenuItem value="gu">{languageLabels.gu}</MenuItem>
                    </Select>
                  </Box>
                )}

                {token ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 1.2, md: 2 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 0.7, sm: 1.1 },
                        px: { xs: 0.5, sm: 0.6, md: 0.6 },
                        py: { xs: 0.4, sm: 0.45 },
                        pr: { xs: 0.5, sm: 0.8, md: 1.4 },
                        bgcolor: themeMode === 'dark' ? '#000000' : '#FFFFFF',
                        borderRadius: '999px',
                        border: `1px solid ${themeMode === 'dark' ? alpha('#E2E8F0', 0.2) : alpha('#1E293B', 0.12)}`,
                        boxShadow: themeMode === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.6)' : '0 4px 14px rgba(15, 23, 42, 0.06)',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: alpha('#0EA5E9', 0.16),
                          color: '#0369A1',
                          width: { xs: 30, sm: 34 },
                          height: { xs: 30, sm: 34 },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          fontWeight: 800,
                          border: `1px solid ${alpha('#0EA5E9', 0.22)}`,
                        }}
                      >
                        {name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box sx={{ display: { xs: 'none', sm: 'block' }, pr: 0.2 }}>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 800, color: themeMode === 'dark' ? '#F8FAFC' : '#1E293B', lineHeight: 1.1 }}>
                          {name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.1 }}>
                          <VerifiedUser sx={{ fontSize: 12, color: '#0284C7' }} />
                          <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 700, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                            {role}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      size="medium"
                      color="error"
                      onClick={openLogoutConfirm}
                      startIcon={<Logout sx={{ fontSize: { xs: '0.95rem !important', sm: '1.1rem !important' } }} />}
                      sx={{
                        borderRadius: '12px',
                        fontWeight: 700,
                        px: { xs: 1.4, sm: 2.1 },
                        py: { xs: 0.6, sm: 0.8 },
                        fontSize: { xs: '0.75rem', sm: '0.9rem' },
                        textTransform: 'none',
                        boxShadow: '0 8px 16px rgba(239, 68, 68, 0.18)',
                        display: { xs: 'none', md: 'flex' },
                        '&:hover': { boxShadow: '0 10px 20px rgba(239, 68, 68, 0.28)' },
                      }}
                    >
                      {t('navbar.logout')}
                    </Button>

                    <IconButton
                      onClick={openLogoutConfirm}
                      color="error"
                      size="small"
                      sx={{
                        display: { xs: 'flex', md: 'none' },
                        bgcolor: alpha('#EF4444', 0.1),
                        border: `1px solid ${alpha('#EF4444', 0.22)}`,
                      }}
                    >
                      <Logout sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    size="small"
                    sx={{
                      borderRadius: '12px',
                      fontWeight: 700,
                      px: { xs: 1.8, sm: 2.6 },
                      py: { xs: 0.6, sm: 0.8 },
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #0284C7, #2563EB)',
                      boxShadow: '0 10px 20px rgba(37, 99, 235, 0.26)',
                    }}
                  >
                    {t('auth.login')}
                  </Button>
                )}
            </Box>
          </Toolbar>
      </Container>
      <Dialog open={logoutConfirmOpen} onClose={closeLogoutConfirm} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Confirm logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontWeight: 600 }}>
            Are you sure you want to logout? You will need to sign in again to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeLogoutConfirm} variant="outlined">
            Cancel
          </Button>
          <Button onClick={confirmLogout} variant="contained" color="error">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;
