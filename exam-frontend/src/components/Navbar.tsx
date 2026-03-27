import { AppBar, Toolbar, Typography, Button, Select, MenuItem, Box, Avatar, IconButton, Container } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logout, Language } from '@mui/icons-material';
import { logout } from '../store/authSlice';
import type { RootState } from '../store/store';

const Navbar = () => {
  const { token, role, name } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
    navigate(role === 'Admin' ? '/admin/login' : '/login');
  };

  const currentLang = i18n.language || 'en';

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      background: 'rgba(255, 255, 255, 0.6)', 
      backdropFilter: 'saturate(180%) blur(20px)', 
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      color: '#0F172A',
      zIndex: 1201,
      minHeight: { xs: '64px', md: '72px' },
      display: 'flex',
      justifyContent: 'center'
    }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4, lg: 6 } }}>
          <Toolbar disableGutters sx={{ minHeight: 'inherit' }}>
            {/* Logo Section */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1, 
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.8 }
              }} 
              onClick={() => navigate(role === 'Admin' ? '/admin' : '/user')}
            >
              <Box sx={{ 
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                width: 38,
                height: 38,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
              }}>
                <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>E</Typography>
              </Box>
              <Typography variant="h5" component="div" sx={{ 
                fontWeight: 900, 
                letterSpacing: '-1.5px', 
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                display: 'flex',
                alignItems: 'center'
              }}>
                Exam<Box component="span" sx={{ color: '#4F46E5', ml: 0.5 }}>Platform</Box>
              </Typography>
            </Box>

            {/* Actions Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
                {/* Language Picker */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  bgcolor: 'rgba(241, 245, 249, 0.8)', 
                  borderRadius: '12px', 
                  px: 1.5,
                  border: '1px solid #E2E8F0'
                }}>
                    <Language sx={{ fontSize: 18, mr: 0.5, color: '#64748B' }} />
                    <Select
                        value={currentLang}
                        onChange={(e) => i18n.changeLanguage(e.target.value as string)}
                        size="small"
                        sx={{ 
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#1E293B'
                        }}
                    >
                        <MenuItem value="en">EN</MenuItem>
                        <MenuItem value="hi">HI</MenuItem>
                        <MenuItem value="gu">GU</MenuItem>
                    </Select>
                </Box>

                {token ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                    {/* User Profile Pill */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      p: 0.5, 
                      pr: 2, 
                      bgcolor: '#FFFFFF', 
                      borderRadius: '50px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(79, 70, 229, 0.1)', 
                          color: '#4F46E5',
                          width: 34, 
                          height: 34,
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          border: '1px solid rgba(79, 70, 229, 0.1)'
                        }}>
                          {name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" display="block" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{name}</Typography>
                            <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>{role}</Typography>
                        </Box>
                    </Box>

                    <Button 
                        variant="contained" 
                        size="medium" 
                        color="error" 
                        onClick={handleLogout}
                        startIcon={<Logout sx={{ fontSize: '1.1rem !important' }} />}
                        sx={{ 
                          borderRadius: '12px', 
                          fontWeight: 700, 
                          px: 2,
                          boxShadow: 'none',
                          display: { xs: 'none', md: 'flex' },
                          '&:hover': { boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }
                        }}
                    >
                        {t('logout')}
                    </Button>
                    <IconButton 
                      onClick={handleLogout} 
                      color="error" 
                      sx={{ display: { xs: 'flex', md: 'none' }, bgcolor: 'rgba(239, 68, 68, 0.05)' }}
                    >
                      <Logout />
                    </IconButton>
                </Box>
                ) : (
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/login')}
                      sx={{ borderRadius: '12px', fontWeight: 700, px: 3 }}
                    >
                      Login
                    </Button>
                )}
            </Box>
          </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
