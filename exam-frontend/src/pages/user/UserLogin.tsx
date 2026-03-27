import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, TextField, Button, Typography, Box, Alert, Paper, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff, School } from '@mui/icons-material';
import { authApi } from '../../api/endpoints';
import { loginSuccess } from '../../store/authSlice';
import bgImage from '../../assets/login_bg.png';

const UserLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authApi.login({ username, password });
            dispatch(loginSuccess(res.data));
            if (res.data.role === 'Admin') {
                navigate('/admin');
            } else {
                navigate('/user');
            }
        } catch (err) {
            setError('Invalid credentials. Please check your username and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3)), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000
        }}>
            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper elevation={24} sx={{
                    p: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                }}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '16px',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        mb: 3,
                        boxShadow: '0 8px 16px rgba(109, 40, 217, 0.3)'
                    }}>
                        <School fontSize="large" />
                    </Box>

                    <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                        Portal Login
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', fontWeight: 500 }}>
                        Select your future by starting the test
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal" required fullWidth label={t('username')} autoFocus
                            value={username} onChange={e => setUsername(e.target.value)}
                            InputProps={{ sx: { bgcolor: '#fff' } }}
                        />
                        <TextField
                            margin="normal" required fullWidth label={t('password')} type={showPassword ? 'text' : 'password'}
                            value={password} onChange={e => setPassword(e.target.value)}
                            InputProps={{
                                sx: { bgcolor: '#fff' },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 5, mb: 3, py: 2, fontSize: '1.1rem' }}
                        >
                            {loading ? 'Processing...' : t('login')}
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                                Protected by CloudShield Authentication
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default UserLogin;
