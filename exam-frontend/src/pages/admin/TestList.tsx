import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Avatar, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Assignment, Add, Timer, Quiz, ArrowBack, Settings, InfoOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const TestList = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTest, setNewTest] = useState({ name: '', duration: 30 });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getTests();
            setTests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTest = async () => {
        try {
            await adminApi.createTest(newTest);
            setOpenDialog(false);
            setNewTest({ name: '', duration: 30 });
            fetchTests();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 10 }}>
            <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate('/admin')}
                        sx={{ mb: 2, color: '#64748B', fontWeight: 700 }}
                    >
                        Back to Dashboard
                    </Button>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Assignment sx={{ color: '#EC4899', mr: 1 }} />
                                <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Test Engineering</Typography>
                            </Box>
                            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>Evaluation Registry</Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            startIcon={<Add />}
                            onClick={() => setOpenDialog(true)}
                            sx={{ 
                                bgcolor: '#0F172A', fontWeight: 800, px: 3, py: 1.2, borderRadius: 3,
                                '&:hover': { bgcolor: '#1E293B' }
                            }}
                        >
                            Create New Test
                        </Button>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                <Grid container spacing={3}>
                    {tests.map((test) => (
                        <Grid item xs={12} md={6} lg={4} key={test.id}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', borderColor: '#EC4899', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', borderRadius: 3, width: 48, height: 48 }}>
                                        <Assignment />
                                    </Avatar>
                                    <Tooltip title="View Test Details">
                                        <IconButton size="small"><InfoOutlined /></IconButton>
                                    </Tooltip>
                                </Box>
                                
                                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>{test.name}</Typography>
                                
                                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                                    <Chip 
                                        icon={<Timer sx={{ fontSize: '1rem !important' }} />} 
                                        label={`${test.duration} min`} 
                                        size="small" 
                                        sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569' }} 
                                    />
                                    <Chip 
                                        icon={<Quiz sx={{ fontSize: '1rem !important' }} />} 
                                        label={`${test.questionCount} Questions`} 
                                        size="small" 
                                        sx={{ fontWeight: 700, bgcolor: '#F0F9FF', color: '#0369A1' }} 
                                    />
                                </Stack>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Button 
                                            fullWidth variant="contained" 
                                            startIcon={<Settings />}
                                            onClick={() => navigate(`/admin/manage-questions/${test.id}`)}
                                            sx={{ 
                                                bgcolor: '#EC4899', fontWeight: 800, borderRadius: 2.5, py: 1.2,
                                                '&:hover': { bgcolor: '#DB2777' }
                                            }}
                                        >
                                            Manage Questions
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    ))}
                    {!loading && tests.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ p: 10, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 6, border: '1px dashed #E2E8F0' }}>
                                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>No evaluations found. Create your first test to begin.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Container>

            {/* Create Test Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: 5, p: 2, width: '100%', maxWidth: 450 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem' }}>Construct New Evaluation</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField 
                            label="Evaluation Name" fullWidth autoFocus
                            value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })}
                            placeholder="e.g. Advanced Calculus Q1"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                        <TextField 
                            label="Duration (Minutes)" type="number" fullWidth
                            value={newTest.duration} onChange={e => setNewTest({ ...newTest, duration: Number(e.target.value) })}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Timer sx={{ color: '#94A3B8' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700, color: '#64748B' }}>Cancel</Button>
                    <Button 
                        onClick={handleCreateTest} variant="contained" disabled={!newTest.name}
                        sx={{ bgcolor: '#0F172A', fontWeight: 800, px: 4, borderRadius: 2.5, '&:hover': { bgcolor: '#1E293B' } }}
                    >
                        Initialize Test
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TestList;
