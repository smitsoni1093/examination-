import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, Paper, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { authApi } from '../../api/endpoints';
import { loginSuccess } from '../../store/authSlice';
import bgImage from '../../assets/login_bg.png';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authApi.login({ username, password });
            if (res.data.role === 'Admin') {
                dispatch(loginSuccess(res.data));
                navigate('/admin');
            } else {
                setError('Access denied. Admin credentials required.');
            }
        } catch (err) {
            setError('Authentication failed. Please verify admin credentials.');
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
            backgroundImage: `linear-gradient(rgba(109, 40, 217, 0.4), rgba(15, 23, 42, 0.8)), url(${bgImage})`,
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
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white'
                }}>
                    <Box sx={{
                        p: 2,
                        borderRadius: '20px',
                        backgroundColor: 'primary.main',
                        color: 'white',
                        mb: 3,
                        boxShadow: '0 8px 24px rgba(109, 40, 217, 0.4)'
                    }}>
                        <AdminPanelSettings sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-1px' }}>
                        Admin Console
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                        Restricted Access • Management Portal
                    </Typography>

                    {error && <Alert severity="error" variant="filled" sx={{ width: '100%', mb: 3, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.8)' }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal" required fullWidth label="Admin ID" autoFocus
                            value={username} onChange={e => setUsername(e.target.value)}
                            InputProps={{
                                sx: { 
                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                                }
                            }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
                        />
                        <TextField
                            margin="normal" required fullWidth label="Secure Password" type={showPassword ? 'text' : 'password'}
                            value={password} onChange={e => setPassword(e.target.value)}
                            InputProps={{
                                sx: { 
                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                                },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 5, mb: 3, py: 2, fontSize: '1.1rem', background: 'linear-gradient(45deg, #6D28D9, #8B5CF6)' }}
                        >
                            {loading ? 'Authenticating...' : 'Enter Console'}
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                System v4.2 • Secured Encryption
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLogin;
