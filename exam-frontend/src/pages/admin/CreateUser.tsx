import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, List, ListItem, ListItemText, Paper, Grid, Avatar, Chip } from '@mui/material';
import { PersonAdd, Group, Badge } from '@mui/icons-material';
import { adminApi } from '../../api/endpoints';

const CreateUser = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await adminApi.getUsers();
            setUsers(res.data);
        } catch (err) { }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminApi.createUser({ name, username, password });
            setMessage({ type: 'success', text: 'User account provisioned successfully.' });
            setName(''); setUsername(''); setPassword('');
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Authorization error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 10 }}>
            {/* Page Header */}
            <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Group sx={{ color: '#6366F1', mr: 1 }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Administration</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>Candidate Management</Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                <Grid container spacing={5}>
                    {/* Form Section */}
                    <Grid item xs={12} lg={4}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', mr: 2 }}>
                                    <PersonAdd />
                                </Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Provision Account</Typography>
                            </Box>

                            {message.text && (
                                <Alert 
                                    severity={message.type as 'success'|'error'} 
                                    sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}
                                    onClose={() => setMessage({ type: '', text: '' })}
                                >
                                    {message.text}
                                </Alert>
                            )}
                            
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
                                <TextField 
                                    label="Full Name" required variant="outlined" fullWidth
                                    value={name} onChange={e => setName(e.target.value)} 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField 
                                    label="Access Username" required variant="outlined" fullWidth
                                    value={username} onChange={e => setUsername(e.target.value)} 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField 
                                    label="System Password" type="password" required variant="outlined" fullWidth
                                    value={password} onChange={e => setPassword(e.target.value)} 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <Button 
                                    variant="contained" 
                                    type="submit" 
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 2, py: 1.8, borderRadius: 3, fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                                >
                                    {loading ? 'Provisioning...' : 'Create Account'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* List Section */}
                    <Grid item xs={12} lg={8}>
                        <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Active Candidates</Typography>
                                <Chip label={`${users.length} Total Users`} size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
                            </Box>
                            <List sx={{ p: 0 }}>
                                {users.map((u, idx) => (
                                    <ListItem 
                                        key={idx} 
                                        divider={idx !== users.length - 1}
                                        sx={{ 
                                            px: 4, 
                                            py: 3, 
                                            transition: 'background 0.2s',
                                            '&:hover': { bgcolor: '#F8FAFC' }
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: '#F1F5F9', color: '#64748B', mr: 2.5, width: 44, height: 44 }}>
                                            <Badge sx={{ fontSize: 20 }} />
                                        </Avatar>
                                        <ListItemText 
                                            primary={u.name} 
                                            secondary={`System Username: ${u.username}`} 
                                            primaryTypographyProps={{ sx: { fontWeight: 800, color: '#0F172A' } }}
                                            secondaryTypographyProps={{ sx: { fontWeight: 600, color: '#64748B' } }}
                                        />
                                        <Chip label="User" size="small" sx={{ ml: 2, fontWeight: 700, borderRadius: 1.5, bgcolor: '#F1F5F9' }} />
                                    </ListItem>
                                ))}
                                {users.length === 0 && (
                                    <Box sx={{ p: 10, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No students provisioned in the system.</Typography>
                                    </Box>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default CreateUser;
