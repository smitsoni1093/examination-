import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Avatar, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, IconButton, Tooltip, Alert, CircularProgress } from '@mui/material';
import { Assignment, Add, Timer, Quiz, ArrowBack, Settings, InfoOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const TestList = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTest, setNewTest] = useState({ name: '', duration: 30 });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getTests();
            if (Array.isArray(res.data)) {
                setTests(res.data);
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Synchronization with registry failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTest = async () => {
        try {
            await adminApi.createTest(newTest);
            setOpenDialog(false);
            setNewTest({ name: '', duration: 30 });
            setMessage({ type: 'success', text: 'New evaluation phase initialized.' });
            fetchTests();
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Initialization error encountered.' });
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', pb: 10 }}>
            {/* Premium Header */}
            <Box sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                py: 4, mb: 6, position: 'sticky', top: 0, zIndex: 1100
            }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                        <Box>
                            <Button 
                                startIcon={<ArrowBack />} 
                                onClick={() => navigate('/admin')}
                                sx={{ mb: 1.5, color: '#64748B', fontWeight: 700, '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
                            >
                                Dashboard
                            </Button>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', mr: 2, width: 32, height: 32 }}>
                                    <Assignment sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>
                                    Evaluation <Box component="span" sx={{ color: '#94A3B8' }}>Registry</Box>
                                </Typography>
                            </Box>
                        </Box>
                        <Button 
                            variant="contained" 
                            startIcon={<Add />}
                            onClick={() => setOpenDialog(true)}
                            sx={{ 
                                bgcolor: '#0F172A', fontWeight: 900, px: 4, py: 1.5, borderRadius: 3.5,
                                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
                                '&:hover': { bgcolor: '#1E293B', transform: 'translateY(-2px)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            Initialize Phase
                        </Button>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {message.text && (
                    <Alert 
                        severity={message.type as 'success'|'error'} 
                        sx={{ mb: 4, borderRadius: 4, fontWeight: 700, border: '1px solid currentColor', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    >
                        {message.text}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: '#EC4899' }} />
                    </Box>
                ) : (
                    <Grid container spacing={4}>
                        {tests.map((test) => (
                            <Grid item xs={12} md={6} lg={4} key={test.id}>
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: 4, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': { 
                                            transform: 'translateY(-8px)', 
                                            borderColor: '#EC4899', 
                                            boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.1)' 
                                        } 
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                        <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.08)', color: '#EC4899', borderRadius: 4, width: 52, height: 52 }}>
                                            <Quiz sx={{ fontSize: 28 }} />
                                        </Avatar>
                                        <Chip 
                                            label={`ID: #${test.id.toString().padStart(3, '0')}`} 
                                            variant="outlined" 
                                            sx={{ fontWeight: 900, fontSize: 10, color: '#94A3B8', borderColor: '#F1F5F9' }} 
                                        />
                                    </Box>
                                    
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, letterSpacing: -0.5 }}>
                                        {test.name}
                                    </Typography>
                                    
                                    <Stack direction="row" spacing={1.5} sx={{ mb: 4 }}>
                                        <Chip 
                                            icon={<Timer sx={{ fontSize: '1rem !important' }} />} 
                                            label={`${test.duration} MINS`} 
                                            sx={{ fontWeight: 800, bgcolor: '#F8FAFC', color: '#64748B', px: 1 }} 
                                        />
                                        <Chip 
                                            icon={<Settings sx={{ fontSize: '1rem !important' }} />} 
                                            label={`${test.questionCount || 0} ITEMS`} 
                                            sx={{ fontWeight: 800, bgcolor: 'rgba(236, 72, 153, 0.05)', color: '#EC4899', px: 1 }} 
                                        />
                                    </Stack>

                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        startIcon={<Settings />}
                                        onClick={() => navigate(`/admin/manage-questions/${test.id}`)}
                                        sx={{ 
                                            bgcolor: '#0F172A', fontWeight: 900, borderRadius: 3, py: 1.8,
                                            '&:hover': { bgcolor: '#EC4899', boxShadow: '0 15px 25px -5px rgba(236, 72, 153, 0.3)' },
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        Configure Evaluation
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && tests.length === 0 && (
                    <Box sx={{ p: 15, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 8, border: '2px dashed #E2E8F0' }}>
                        <Avatar sx={{ bgcolor: '#F8FAFC', color: '#E2E8F0', width: 100, height: 100, mx: 'auto', mb: 4 }}>
                            <Assignment sx={{ fontSize: 50 }} />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#ADB5BD' }}>No active evaluations found.</Typography>
                        <Button 
                            variant="text" 
                            startIcon={<Add />} 
                            onClick={() => setOpenDialog(true)}
                            sx={{ mt: 2, fontWeight: 900, color: '#EC4899' }}
                        >
                            Start First Phase
                        </Button>
                    </Box>
                )}
            </Container>

            {/* Premium Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                PaperProps={{ sx: { borderRadius: 8, p: 2, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.75rem', letterSpacing: -1, pt: 4, px: 4 }}>
                    New Phase <Box component="span" sx={{ color: '#EC4899' }}>Initialization</Box>
                </DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Stack spacing={4} sx={{ mt: 2 }}>
                        <TextField 
                            label="Assessment Title" fullWidth autoFocus
                            value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })}
                            placeholder="e.g. End of Semester Q1"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#F8FAFC', fontWeight: 700 } }}
                        />
                        <TextField 
                            label="Time Allocation (Minutes)" type="number" fullWidth
                            value={newTest.duration} onChange={e => setNewTest({ ...newTest, duration: Number(e.target.value) })}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Timer sx={{ color: '#ADB5BD' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#F8FAFC', fontWeight: 700 } }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4, justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 900, color: '#64748B' }}>Discard</Button>
                    <Button 
                        onClick={handleCreateTest} variant="contained" disabled={!newTest.name}
                        sx={{ 
                            bgcolor: '#EC4899', fontWeight: 900, px: 5, py: 1.5, borderRadius: 4,
                            boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.3)',
                            '&:hover': { bgcolor: '#DB2777' }
                        }}
                    >
                        Initialize
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TestList;
