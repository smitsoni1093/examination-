import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Checkbox, List, ListItem, ListItemText, InputAdornment, TextField, Alert, Avatar, Chip, Stack, CircularProgress } from '@mui/material';
import { Assignment, Quiz, Search, DoneAll, ArrowBack, PlaylistAddCheck } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const ManageTestQuestions = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testName, setTestName] = useState('');

    useEffect(() => {
        if (testId) {
            initData();
        }
    }, [testId]);

    const initData = async () => {
        setLoading(true);
        try {
            // Fetch all questions
            const qRes = await adminApi.getQuestions();
            setQuestions(qRes.data);

            // Fetch assigned questions for this test
            const assignedRes = await adminApi.getTestQuestions(Number(testId));
            setSelectedQuestions(assignedRes.data);

            // Fetch tests to get the name (or just use the list if we had it)
            // For now, let's just find the name from the tests list
            const testsRes = await adminApi.getTests();
            const currentTest = testsRes.data.find((t: any) => t.id === Number(testId));
            if (currentTest) setTestName(currentTest.name);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id: number) => {
        const currentIndex = selectedQuestions.indexOf(id);
        const newSelected = [...selectedQuestions];
        if (currentIndex === -1) newSelected.push(id);
        else newSelected.splice(currentIndex, 1);
        setSelectedQuestions(newSelected);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminApi.assignQuestions({ testId: Number(testId), questionIds: selectedQuestions });
            setMessage({ type: 'success', text: 'Evaluation structure updated successfully.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            setMessage({ type: 'error', text: 'System synchronization failed.' });
        } finally {
            setSaving(false);
        }
    };

    const filteredQuestions = questions.filter(q => 
        q.question_EN.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.id.toString().includes(searchTerm)
    );

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress sx={{ color: '#EC4899' }} />
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 10 }}>
            <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate('/admin/tests')}
                        sx={{ mb: 2, color: '#64748B', fontWeight: 700 }}
                    >
                        Back to Registry
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PlaylistAddCheck sx={{ color: '#EC4899', mr: 1 }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Component Assignment</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>
                        Designing {testName || 'Evaluation'}
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {message.text && (
                    <Alert 
                        severity={message.type as 'success'|'error'} 
                        sx={{ mb: 4, borderRadius: 3, fontWeight: 700, border: '1px solid currentColor' }}
                    >
                        {message.text}
                    </Alert>
                )}

                <Grid container spacing={5}>
                    <Grid item xs={12} lg={4}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', position: 'sticky', top: 24 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', mr: 2 }}>
                                    <Assignment />
                                </Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Evaluation Status</Typography>
                            </Box>

                            <Stack spacing={3}>
                                <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: 4, border: '1px dashed #E2E8F0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 1 }}>SELECTION SUMMARY</Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Quiz sx={{ fontSize: 20, color: '#EC4899' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedQuestions.length} Questions Linked</Typography>
                                    </Stack>
                                </Box>

                                <Button 
                                    variant="contained" fullWidth size="large" 
                                    startIcon={<DoneAll />}
                                    disabled={saving}
                                    onClick={handleSave}
                                    sx={{ 
                                        py: 2, borderRadius: 3, fontWeight: 800, 
                                        bgcolor: '#0F172A',
                                        boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)',
                                        '&:hover': { bgcolor: '#1E293B' }
                                    }}
                                >
                                    {saving ? 'Syncing...' : 'Save Configuration'}
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={8}>
                        <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #E2E8F0', overflow: 'hidden', bgcolor: '#FFFFFF' }}>
                            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Question Bank</Typography>
                                <TextField 
                                    size="small" placeholder="Search questions..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ bgcolor: '#F8FAFC', borderRadius: 2, width: { xs: '100%', sm: 300 }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                />
                            </Box>

                            <List sx={{ p: 0, maxHeight: 700, overflow: 'auto' }}>
                                {filteredQuestions.map((q) => (
                                    <ListItem 
                                        key={q.id} 
                                        divider
                                        onClick={() => handleToggle(q.id)}
                                        sx={{ 
                                            px: 4, py: 3, cursor: 'pointer',
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
                                            secondary={`ID: Q-${q.id.toString().padStart(4, '0')}`} 
                                            primaryTypographyProps={{ sx: { fontWeight: 700, color: '#0F172A', mb: 0.5 } }}
                                            secondaryTypographyProps={{ sx: { fontWeight: 600, color: '#94A3B8' } }}
                                        />
                                        <Chip label="MCQ" size="small" variant="outlined" sx={{ fontWeight: 700, color: '#64748B' }} />
                                    </ListItem>
                                ))}
                                {filteredQuestions.length === 0 && (
                                    <Box sx={{ p: 10, textAlign: 'center' }}>
                                        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>No repository items match your search.</Typography>
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

export default ManageTestQuestions;
