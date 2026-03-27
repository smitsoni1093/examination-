import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, Paper, List, ListItem, ListItemText, Checkbox, Grid, Avatar, Chip, Stack, InputAdornment } from '@mui/material';
import { Assignment, Timer, Quiz, DoneAll, Search, PlaylistAddCheck, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const CreateTest = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [duration, setDuration] = useState<number | ''>('');
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await adminApi.getQuestions();
            setQuestions(res.data);
        } catch (err) {}
    };

    const handleToggle = (id: number) => {
        const currentIndex = selectedQuestions.indexOf(id);
        const newSelected = [...selectedQuestions];
        if (currentIndex === -1) newSelected.push(id);
        else newSelected.splice(currentIndex, 1);
        setSelectedQuestions(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedQuestions.length === 0) {
            setMessage({ type: 'error', text: 'Evaluation requires at least one assessment question.' });
            return;
        }

        setLoading(true);
        try {
            const testRes = await adminApi.createTest({ name, duration: Number(duration) });
            const testId = testRes.data.id;
            await adminApi.assignQuestions({ testId, questionIds: selectedQuestions });
            
            setMessage({ type: 'success', text: `Test '${name}' successfully deployed with ${selectedQuestions.length} questions.` });
            setName(''); setDuration(''); setSelectedQuestions([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Deployment terminal error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredQuestions = questions.filter(q => 
        q.question_EN.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.id.toString().includes(searchTerm)
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 10 }}>
            {/* Page Header */}
            <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate('/admin')}
                        sx={{ mb: 2, color: '#64748B', fontWeight: 700 }}
                    >
                        Back to Dashboard
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Assignment sx={{ color: '#EC4899', mr: 1 }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Test Engineering</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>Build New Evaluation</Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {message.text && (
                    <Alert 
                        severity={message.type as 'success'|'error'} 
                        sx={{ mb: 4, borderRadius: 3, fontWeight: 700, border: '1px solid currentColor' }}
                        onClose={() => setMessage({ type: '', text: '' })}
                    >
                        {message.text}
                    </Alert>
                )}

                <Grid container spacing={5}>
                    {/* Configuration Section */}
                    <Grid item xs={12} lg={4}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', mr: 2 }}>
                                    <PlaylistAddCheck />
                                </Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Basic Configuration</Typography>
                            </Box>

                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
                                <TextField 
                                    label="Test Name" required fullWidth value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    placeholder="e.g. Midterm Physics 2024"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField 
                                    label="Duration (minutes)" type="number" required fullWidth 
                                    value={duration} onChange={e => setDuration(Number(e.target.value))} 
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Timer sx={{ color: '#64748B', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />

                                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px dashed #E2E8F0', mt: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 1 }}>SELECTION SUMMARY</Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Quiz sx={{ fontSize: 18, color: '#EC4899' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedQuestions.length} Questions Selected</Typography>
                                    </Stack>
                                </Box>

                                <Button 
                                    variant="contained" type="submit" fullWidth size="large" 
                                    disabled={loading}
                                    startIcon={<DoneAll />}
                                    sx={{ 
                                        mt: 2, py: 1.8, borderRadius: 3, fontWeight: 800, 
                                        bgcolor: '#EC4899',
                                        boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.3)',
                                        '&:hover': { bgcolor: '#DB2777' }
                                    }}
                                >
                                    {loading ? 'Deploying...' : 'Deploy Evaluation'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Question Repository Section */}
                    <Grid item xs={12} lg={8}>
                        <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #E2E8F0', overflow: 'hidden', bgcolor: '#FFFFFF' }}>
                            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Assessment Repository</Typography>
                                <TextField 
                                    size="small" placeholder="Filter questions..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ bgcolor: '#F8FAFC', borderRadius: 2, width: { xs: '100%', sm: 250 }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                />
                            </Box>

                            <List sx={{ p: 0, maxHeight: 600, overflow: 'auto' }}>
                                {filteredQuestions.map((q) => (
                                    <ListItem 
                                        key={q.id} 
                                        divider
                                        onClick={() => handleToggle(q.id)}
                                        sx={{ 
                                            px: 4, py: 2.5, cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            '&:hover': { bgcolor: '#F8FAFC' }
                                        }}
                                    >
                                        <Checkbox 
                                            edge="start" 
                                            checked={selectedQuestions.indexOf(q.id) !== -1} 
                                            tabIndex={-1} 
                                            disableRipple 
                                            sx={{ color: '#EC4899', '&.Mui-checked': { color: '#EC4899' } }}
                                        />
                                        <ListItemText 
                                            primary={q.question_EN} 
                                            secondary={`Assessment ID: Q-${q.id.toString().padStart(4, '0')}`} 
                                            primaryTypographyProps={{ sx: { fontWeight: 700, color: '#0F172A' } }}
                                            secondaryTypographyProps={{ sx: { fontWeight: 600, color: '#94A3B8' } }}
                                        />
                                        <Chip label="MCQ" size="small" variant="outlined" sx={{ fontWeight: 700, color: '#64748B' }} />
                                    </ListItem>
                                ))}
                                {filteredQuestions.length === 0 && (
                                    <Box sx={{ p: 10, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No matching assessment items found.</Typography>
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

export default CreateTest;
