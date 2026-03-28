import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Checkbox, InputAdornment, TextField, Alert, Avatar, Chip, Stack, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Tabs, Tab, Divider } from '@mui/material';
import { Quiz, Search, DoneAll, ArrowBack, PlaylistAddCheck, Add, Language, Translate, CheckCircleOutline, Save, EditNote } from '@mui/icons-material';
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

    // Question Creation Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [newQuestion, setNewQuestion] = useState({
        Question_EN: '', Option1_EN: '', Option2_EN: '', Option3_EN: '', Option4_EN: '',
        Question_HI: '', Option1_HI: '', Option2_HI: '', Option3_HI: '', Option4_HI: '',
        Question_GU: '', Option1_GU: '', Option2_GU: '', Option3_GU: '', Option4_GU: '',
        CorrectOption: 1
    });

    useEffect(() => {
        if (testId) {
            initData();
        }
    }, [testId]);

    const initData = async () => {
        setLoading(true);
        try {
            const qRes = await adminApi.getQuestions();
            setQuestions(qRes.data);

            const assignedRes = await adminApi.getTestQuestions(Number(testId));
            setSelectedQuestions(assignedRes.data);

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

    const handleCreateQuestion = async (autoClose = true) => {
        try {
            const res = await adminApi.createQuestion(newQuestion);
            const createdId = res.data.id;
            
            // Add to selection
            setSelectedQuestions(prev => [...prev, createdId]);
            
            // Reset form
            setNewQuestion({
                Question_EN: '', Option1_EN: '', Option2_EN: '', Option3_EN: '', Option4_EN: '',
                Question_HI: '', Option1_HI: '', Option2_HI: '', Option3_HI: '', Option4_HI: '',
                Question_GU: '', Option1_GU: '', Option2_GU: '', Option3_GU: '', Option4_GU: '',
                CorrectOption: 1
            });
            
            if (autoClose) setOpenDialog(false);
            setMessage({ type: 'success', text: `New question ${autoClose ? 'created and linked.' : 'added successfully. Keep going!'}` });
            
            // Refresh question bank
            const qRes = await adminApi.getQuestions();
            setQuestions(qRes.data);
            if (!autoClose) setTabValue(0); 

        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to create question.' });
        }
    };

    const filteredQuestions = questions.filter(q => 
        q.question_EN.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.id.toString().includes(searchTerm)
    );

    const LangSection = ({ langCode, label, color, icon }: { langCode: 'EN' | 'HI' | 'GU', label: string, color: string, icon: any }) => (
        <Box sx={{ p: 4, bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: `${color}15`, color: color, mr: 2.5, width: 48, height: 48, borderRadius: 3 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{label} Configuration</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{langCode} VERSION</Typography>
                </Box>
            </Box>
            
            <Stack spacing={4}>
                <TextField 
                    fullWidth required label="The Assessment Question" multiline rows={3}
                    placeholder={`Enter the question in ${label}...`}
                    value={(newQuestion as any)[`Question_${langCode}`]} 
                    onChange={e => setNewQuestion({...newQuestion, [`Question_${langCode}`]: e.target.value})} 
                    sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#F8FAFC' },
                        '& .MuiInputLabel-root': { fontWeight: 700 }
                    }}
                />
                
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', mb: 2, display: 'block' }}>MCQ RESPONSE OPTIONS</Typography>
                    <Grid container spacing={3}>
                        {[1, 2, 3, 4].map(num => (
                            <Grid item xs={12} sm={6} key={num}>
                                <TextField 
                                    fullWidth required label={`Option ${num}`}
                                    placeholder={`Enter choice ${num}...`}
                                    value={(newQuestion as any)[`Option${num}_${langCode}`]} 
                                    onChange={e => setNewQuestion({...newQuestion, [`Option${num}_${langCode}`]: e.target.value})} 
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { borderRadius: 3, transition: 'all 0.2s', '&:hover': { bgcolor: '#F1F5F9' } },
                                        '& .MuiInputLabel-root': { fontWeight: 600 }
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Stack>
        </Box>
    );

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress sx={{ color: '#EC4899' }} />
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', pb: 10 }}>
            <Box sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                py: 4, mb: 6, position: 'sticky', top: 0, zIndex: 1100
            }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Button 
                                startIcon={<ArrowBack />} 
                                onClick={() => navigate('/admin/tests')}
                                sx={{ mb: 1.5, color: '#64748B', fontWeight: 700, '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.05)' } }}
                            >
                                Back to Registry
                            </Button>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', mr: 2, width: 32, height: 32 }}>
                                    <PlaylistAddCheck sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', color: '#0F172A' }}>
                                    {testName || 'Evaluation'} <Box component="span" sx={{ color: '#94A3B8', fontWeight: 500 }}>Configurator</Box>
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Stack direction="row" spacing={2}>
                            <Button 
                                variant="outlined" 
                                startIcon={<Add />}
                                onClick={() => setOpenDialog(true)}
                                sx={{ 
                                    borderRadius: 3, fontWeight: 800, color: '#EC4899', borderColor: 'rgba(236, 72, 153, 0.3)',
                                    px: 3, py: 1.2,
                                    '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.05)', borderColor: '#EC4899' }
                                }}
                            >
                                New Question
                            </Button>
                            <Button 
                                variant="contained" 
                                startIcon={<DoneAll />}
                                disabled={saving}
                                onClick={handleSave}
                                sx={{ 
                                    borderRadius: 3, fontWeight: 800, bgcolor: '#0F172A',
                                    px: 4, py: 1.2,
                                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
                                    '&:hover': { bgcolor: '#1E293B' }
                                }}
                            >
                                {saving ? 'Syncing...' : 'Sync Data'}
                            </Button>
                        </Stack>
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

                <Grid container spacing={5}>
                    <Grid item xs={12} lg={3}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', position: 'sticky', top: 180 }}>
                            <Typography variant="overline" sx={{ fontWeight: 900, color: '#94A3B8', mb: 3, display: 'block', letterSpacing: 2 }}>LIVE METRICS</Typography>
                            
                            <Stack spacing={3}>
                                <Box sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: 5, border: '1px solid #F1F5F9' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5 }}>LINKED ITEMS</Typography>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: '#0F172A' }}>{selectedQuestions.length}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Quiz sx={{ fontSize: 16, color: '#EC4899', mr: 0.5 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#EC4899' }}>Question items</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 3, bgcolor: '#0F172A', borderRadius: 5, color: 'white' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1 }}>COMPLETION TAG</Typography>
                                    <Chip 
                                        label={selectedQuestions.length > 0 ? "STRUCTURE READY" : "EMPTY EVALUATION"} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: selectedQuestions.length > 0 ? '#10B981' : '#F59E0B', 
                                            color: 'white', fontWeight: 900, fontSize: 10
                                        }} 
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={9}>
                        <Paper elevation={0} sx={{ borderRadius: 6, border: '1px solid #E2E8F0', overflow: 'hidden', bgcolor: '#FFFFFF' }}>
                            <Box sx={{ px: 5, py: 4, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0F172A' }}>Question Repository</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>Select items to include in this evaluation phase</Typography>
                                </Box>
                                <TextField 
                                    size="small" placeholder="Fast search..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: '#ADB5BD', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ 
                                        bgcolor: '#F8FAFC', borderRadius: 3, width: 320, 
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                        '& .MuiOutlinedInput-root': { px: 2, fontWeight: 600 }
                                    }}
                                />
                            </Box>

                            <Box sx={{ maxHeight: 800, overflow: 'auto' }}>
                                {filteredQuestions.map((q) => {
                                    const isSelected = selectedQuestions.indexOf(q.id) !== -1;
                                    return (
                                        <Box 
                                            key={q.id} 
                                            onClick={() => handleToggle(q.id)}
                                            sx={{ 
                                                px: 5, py: 3.5, borderBottom: '1px solid #F1F5F9',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s',
                                                bgcolor: isSelected ? 'rgba(236, 72, 153, 0.02)' : 'transparent',
                                                '&:hover': { bgcolor: '#F8FAFC' }
                                            }}
                                        >
                                            <Checkbox 
                                                checked={isSelected} 
                                                sx={{ 
                                                    color: '#E2E8F0', 
                                                    '&.Mui-checked': { color: '#EC4899' },
                                                    mr: 3
                                                }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 700, color: isSelected ? '#0F172A' : '#475569', fontSize: '1.05rem', mb: 0.5 }}>
                                                    {q.question_EN}
                                                </Typography>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Typography sx={{ color: '#ADB5BD', fontWeight: 800, fontSize: 11, letterSpacing: 0.5 }}>#Q-{q.id.toString().padStart(4, '0')}</Typography>
                                                    <Divider orientation="vertical" flexItem sx={{ height: 10, alignSelf: 'center', bgcolor: '#E2E8F0' }} />
                                                    <Typography sx={{ color: '#94A3B8', fontWeight: 700, fontSize: 11 }}>COMPLEXITY: SCALE 1</Typography>
                                                </Stack>
                                            </Box>
                                            <Chip 
                                                label={isSelected ? "SELECTED" : "AVAILABLE"} 
                                                size="small" 
                                                variant={isSelected ? "filled" : "outlined"}
                                                sx={{ 
                                                    fontWeight: 900, fontSize: 9, 
                                                    bgcolor: isSelected ? '#EC4899' : 'transparent',
                                                    color: isSelected ? 'white' : '#ADB5BD',
                                                    borderColor: isSelected ? '#EC4899' : '#E2E8F0'
                                                }} 
                                            />
                                        </Box>
                                    );
                                })}
                                {filteredQuestions.length === 0 && (
                                    <Box sx={{ p: 15, textAlign: 'center' }}>
                                        <Avatar sx={{ bgcolor: '#F8FAFC', color: '#E2E8F0', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                                            <Search sx={{ fontSize: 40 }} />
                                        </Avatar>
                                        <Typography sx={{ fontWeight: 800, color: '#ADB5BD' }}>No repository items match your search.</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Question Creation Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                maxWidth="md" 
                fullWidth
                PaperProps={{ 
                    sx: { 
                        borderRadius: 8, 
                        overflow: 'hidden', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                        maxWidth: '900px !important' 
                    } 
                }}
            >
                <DialogTitle sx={{ bgcolor: '#0F172A', color: 'white', py: 4, px: 5 }}>
                    <Stack direction="row" alignItems="center" spacing={3}>
                        <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.2)', color: '#EC4899', width: 56, height: 56, borderRadius: 4 }}>
                            <EditNote sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>Item Configurator</Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, letterSpacing: 1 }}>NEW MULTI-LANGUAGE ASSESSMENT</Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                
                <Box sx={{ borderBottom: 1, borderColor: 'rgba(0,0,0,0.05)', bgcolor: '#F8FAFC', px: 3 }}>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ '& .MuiTab-root': { fontWeight: 900, py: 3, fontSize: 13, textTransform: 'none', letterSpacing: 0.5 }, '& .Mui-selected': { color: '#EC4899 !important' }, '& .MuiTabs-indicator': { bgcolor: '#EC4899', height: 4, borderRadius: 4 } }}>
                        <Tab icon={<Language sx={{ fontSize: 20 }} />} iconPosition="start" label="English Phase" />
                        <Tab icon={<Translate sx={{ fontSize: 20 }} />} iconPosition="start" label="Hindi Phase" />
                        <Tab icon={<Quiz sx={{ fontSize: 20 }} />} iconPosition="start" label="Gujarati Phase" />
                    </Tabs>
                </Box>

                <DialogContent sx={{ p: 0, bgcolor: '#FFFFFF' }}>
                    {tabValue === 0 && <LangSection langCode="EN" label="English" color="#6366F1" icon={<Language />} />}
                    {tabValue === 1 && <LangSection langCode="HI" label="Hindi" color="#F59E0B" icon={<Translate />} />}
                    {tabValue === 2 && <LangSection langCode="GU" label="Gujarati" color="#10B981" icon={<Quiz />} />}
                    
                    <Box sx={{ px: 5, pb: 5 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '2px solid #F1F5F9', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', mr: 2.5, width: 48, height: 48, borderRadius: 3 }}>
                                    <CheckCircleOutline sx={{ fontSize: 28 }} />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0F172A' }}>Validation Key</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>DEFINING THE CORRECT MCQ DATA POINT</Typography>
                                </Box>
                            </Box>
                            <TextField
                                select label="Correct Key" size="small"
                                value={newQuestion.CorrectOption} 
                                onChange={e => setNewQuestion({...newQuestion, CorrectOption: Number(e.target.value)})} 
                                sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: 'white', fontWeight: 900 } }}
                            >
                                {[1, 2, 3, 4].map(opt => <MenuItem key={opt} value={opt} sx={{ fontWeight: 800 }}>Option {opt}</MenuItem>)}
                            </TextField>
                        </Paper>
                    </Box>
                </DialogContent>
                
                <DialogActions sx={{ p: 4, bgcolor: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.05)', justifyContent: 'space-between' }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 900, color: '#64748B', px: 3, py: 1.5, borderRadius: 4 }}>Discard Draft</Button>
                    <Stack direction="row" spacing={3}>
                        <Button 
                            variant="outlined" 
                            onClick={() => handleCreateQuestion(false)}
                            sx={{ 
                                fontWeight: 900, px: 4, py: 1.8, borderRadius: 4,
                                color: '#EC4899', borderColor: 'rgba(236, 72, 153, 0.2)', borderWidth: 2,
                                '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.05)', borderColor: '#EC4899', borderWidth: 2 }
                            }}
                        >
                            Save & Next
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={() => handleCreateQuestion(true)}
                            startIcon={<Save />}
                            sx={{ 
                                bgcolor: '#EC4899', fontWeight: 900, px: 6, py: 1.8, borderRadius: 4,
                                boxShadow: '0 20px 25px -5px rgba(236, 72, 153, 0.4)',
                                '&:hover': { bgcolor: '#DB2777', transform: 'translateY(-3px)' },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            Finalize & Assign
                        </Button>
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageTestQuestions;
