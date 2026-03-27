import { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, Paper, Grid, MenuItem, Avatar, Chip, Divider, Stack } from '@mui/material';
import { Quiz, Language, Translate, CheckCircleOutline, Save, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const CreateQuestion = () => {
    const navigate = useNavigate();
    const [state, setState] = useState({
        Question_EN: '', Option1_EN: '', Option2_EN: '', Option3_EN: '', Option4_EN: '',
        Question_HI: '', Option1_HI: '', Option2_HI: '', Option3_HI: '', Option4_HI: '',
        Question_GU: '', Option1_GU: '', Option2_GU: '', Option3_GU: '', Option4_GU: '',
        CorrectOption: 1
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: any) => {
        setState({ ...state, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminApi.createQuestion(state);
            setMessage({ type: 'success', text: 'Question added to the master repository.' });
            setState({
                Question_EN: '', Option1_EN: '', Option2_EN: '', Option3_EN: '', Option4_EN: '',
                Question_HI: '', Option1_HI: '', Option2_HI: '', Option3_HI: '', Option4_HI: '',
                Question_GU: '', Option1_GU: '', Option2_GU: '', Option3_GU: '', Option4_GU: '',
                CorrectOption: 1
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Database transaction failed' });
        } finally {
            setLoading(false);
        }
    };

    const LangSection = ({ langCode, label, color, icon }: { langCode: 'EN' | 'HI' | 'GU', label: string, color: string, icon: any }) => (
        <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: `${color}15`, color: color, mr: 2, width: 44, height: 44 }}>
                        {icon}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{label}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>{langCode} VERSION</Typography>
                    </Box>
                </Box>
                
                <Stack spacing={2.5}>
                    <TextField 
                        fullWidth required label="The Question Text" multiline rows={2}
                        name={`Question_${langCode}`} value={(state as any)[`Question_${langCode}`]} onChange={handleChange} 
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    <Divider sx={{ my: 1 }}><Chip label="Options" size="small" /></Divider>
                    {[1, 2, 3, 4].map(num => (
                        <TextField 
                            key={num} fullWidth required label={`Option ${num}`}
                            name={`Option${num}_${langCode}`} value={(state as any)[`Option${num}_${langCode}`]} onChange={handleChange} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                    ))}
                </Stack>
            </Paper>
        </Grid>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 12 }}>
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
                        <Translate sx={{ color: '#8B5CF6', mr: 1 }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Multi-Language Support</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>Question Engineering</Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {message.text && (
                    <Alert 
                        severity={message.type as 'error'|'success'} 
                        sx={{ mb: 4, borderRadius: 3, fontWeight: 700, border: '1px solid currentColor' }}
                        onClose={() => setMessage({ type: '', text: '' })}
                    >
                        {message.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                        <LangSection langCode="EN" label="English" color="#6366F1" icon={<Language />} />
                        <LangSection langCode="HI" label="Hindi (हिंदी)" color="#F59E0B" icon={<Translate />} />
                        <LangSection langCode="GU" label="Gujarati (ગુજરાતી)" color="#10B981" icon={<Quiz />} />
                    </Grid>

                    <Paper 
                        elevation={0} 
                        sx={{ 
                            mt: 5, p: 3, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            bgcolor: '#FFFFFF',
                            position: 'sticky',
                            bottom: 24,
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', mr: 2 }}>
                                <CheckCircleOutline />
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Validation Complete</Typography>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>Select the globally correct option ID</Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={3} alignItems="center">
                            <TextField
                                select label="Correct Key" name="CorrectOption"
                                value={state.CorrectOption} onChange={handleChange} 
                                sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            >
                                {[1, 2, 3, 4].map(opt => <MenuItem key={opt} value={opt}>Option {opt}</MenuItem>)}
                            </TextField>
                            <Button 
                                variant="contained" type="submit" size="large"
                                disabled={loading}
                                startIcon={<Save />}
                                sx={{ 
                                    px: 5, py: 1.8, borderRadius: 3, fontWeight: 800, 
                                    bgcolor: '#8B5CF6',
                                    '&:hover': { bgcolor: '#7C3AED' }
                                }}
                            >
                                {loading ? 'Commiting...' : 'Save Question'}
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

export default CreateQuestion;
