import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Avatar, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress, Switch, FormControlLabel, MenuItem, List, ListItem, ListItemText, Checkbox } from '@mui/material';
import { Assignment, Add, ArrowBack, Settings, InfoOutlined, Visibility, VisibilityOff, DeleteOutline, EditOutlined, PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const toLocalDateInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};

const toIsoEndOfDay = (dateOnly: string) => {
    const date = new Date(`${dateOnly}T23:59:59`);
    return date.toISOString();
};

const TestList = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTest, setNewTest] = useState({ name: '' });
    const [classes, setClasses] = useState<any[]>([]);
    const [instructionBank, setInstructionBank] = useState<any[]>([]);
    const [editOpen, setEditOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        id: 0,
        name: '',
        description: '',
        totalMarks: 100,
        isGlobal: false,
        classId: '' as number | '',
        closingAt: '',
        testImageUrl: '' as string | null,
        selectedInstructionIds: [] as number[],
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please upload a valid image file.' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size should be up to 2MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setEditForm(prev => ({ ...prev, testImageUrl: reader.result as string }));
            setMessage({ type: '', text: '' });
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        fetchTests();
    }, []);

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const [classRes, instructionRes] = await Promise.all([
                    adminApi.getClasses(),
                    adminApi.getInstructions(),
                ]);
                setClasses(classRes.data || []);
                setInstructionBank(Array.isArray(instructionRes.data) ? instructionRes.data : []);
            } catch (err) {}
        };
        loadClasses();
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

    const handleCreateTest = () => {
        navigate('/admin/test-builder');
    };

    const handleToggleStatus = async (testId: number, currentStatus: boolean) => {
        try {
            await adminApi.updateTestStatus(testId, !currentStatus);
            setTests(prev => prev.map(t => t.id === testId ? { ...t, isActive: !currentStatus } : t));
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update activation status.' });
        }
    };

    const handleDeleteTest = async (testId: number) => {
        try {
            await adminApi.deleteTest(testId);
            setTests(prev => prev.filter(t => t.id !== testId));
            setMessage({ type: 'success', text: 'Test deleted successfully.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete test.' });
        }
    };

    const handleOpenEdit = (test: any) => {
        setEditForm({
            id: test.id,
            name: test.name || '',
            description: test.description || '',
            totalMarks: test.totalMarks || 100,
            isGlobal: !!test.isGlobal,
            classId: test.classId ?? '',
            closingAt: toLocalDateInput(test.closingAt),
            testImageUrl: test.testImageUrl ?? null,
            selectedInstructionIds: (test.instructions || []).map((i: any) => i.id),
        });
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editForm.name.trim()) {
            setMessage({ type: 'error', text: 'Test name is required.' });
            return;
        }

        if (editForm.totalMarks <= 0) {
            setMessage({ type: 'error', text: 'Total marks must be greater than zero.' });
            return;
        }

        if (!editForm.closingAt) {
            setMessage({ type: 'error', text: 'Last date of submission is required.' });
            return;
        }

        const closingAtDate = new Date(`${editForm.closingAt}T23:59:59`);
        if (Number.isNaN(closingAtDate.getTime()) || closingAtDate <= new Date()) {
            setMessage({ type: 'error', text: 'Last date of submission must be in the future.' });
            return;
        }

        setEditSaving(true);
        try {
            const payload: any = {
                name: editForm.name.trim(),
                description: editForm.description.trim(),
                duration: 0,
                totalMarks: Number(editForm.totalMarks),
                isGlobal: editForm.isGlobal,
                classId: editForm.isGlobal ? null : (editForm.classId === '' ? null : Number(editForm.classId)),
                testImageUrl: editForm.testImageUrl,
                closingAt: toIsoEndOfDay(editForm.closingAt),
                instructionIds: editForm.selectedInstructionIds,
            };

            await adminApi.updateTest(editForm.id, payload);
            setEditOpen(false);
            setMessage({ type: 'success', text: 'Test details updated successfully.' });
            await fetchTests();
        } catch (err: any) {
            const serverMessage = err?.response?.data?.message;
            setMessage({ type: 'error', text: serverMessage || 'Failed to update test details.' });
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', pb: 10 }}>
            {/* Premium Header */}
            <Box sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                py: { xs: 2.5, md: 4 }, mb: { xs: 4, md: 6 }, position: 'sticky', top: 0, zIndex: 1100
            }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-end' }} spacing={{ xs: 2, md: 0 }}>
                        <Box sx={{ width: '100%' }}>
                            <Button 
                                startIcon={<ArrowBack />} 
                                onClick={() => navigate('/admin')}
                                sx={{ mb: 1.5, color: '#64748B', fontWeight: 700, alignSelf: 'flex-start', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}
                            >
                                Dashboard
                            </Button>
                            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 }, width: '100%' }}>
                                <Avatar sx={{ bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', mr: { xs: 0, sm: 2 }, width: 32, height: 32 }}>
                                    <Assignment sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A', fontSize: { xs: '1.6rem', sm: '2.5rem', md: '3rem' }, lineHeight: 1.05 }}>
                                    Evaluation <Box component="span" sx={{ color: '#94A3B8' }}>Registry</Box>
                                </Typography>
                            </Box>
                        </Box>
                        <Button 
                            variant="contained" 
                            startIcon={<Add />}
                            onClick={handleCreateTest}
                            sx={{ 
                                bgcolor: '#0F172A', fontWeight: 900, px: 4, py: 1.5, borderRadius: 3.5,
                                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
                                '&:hover': { bgcolor: '#1E293B', transform: 'translateY(-2px)' },
                                transition: 'all 0.2s',
                                width: { xs: '100%', md: 'auto' }
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
                    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                        {tests.map((test) => (
                            <Grid item xs={12} md={6} lg={4} key={test.id}>
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: { xs: 2.25, sm: 3, md: 4 }, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        opacity: test.isActive ? 1 : 0.7,
                                        '&:hover': { 
                                            transform: 'translateY(-8px)', 
                                            borderColor: test.isActive ? '#EC4899' : '#94A3B8', 
                                            boxShadow: test.isActive ? '0 25px 50px -12px rgba(236, 72, 153, 0.1)' : '0 10px 15px -3px rgba(0,0,0,0.05)'
                                        } 
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                                            <Avatar sx={{ bgcolor: test.isActive ? 'rgba(236, 72, 153, 0.08)' : '#F1F5F9', color: test.isActive ? '#EC4899' : '#94A3B8', borderRadius: 4, width: 52, height: 52, flexShrink: 0 }}>
                                                {test.isActive ? <Visibility sx={{ fontSize: 28 }} /> : <VisibilityOff sx={{ fontSize: 28 }} />}
                                            </Avatar>
                                            <Box>
                                                <Chip 
                                                    label={test.isActive ? "LIVE" : "DRAFT"} 
                                                    size="small"
                                                    sx={{ 
                                                        fontWeight: 900, 
                                                        fontSize: 10, 
                                                        bgcolor: test.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                                                        color: test.isActive ? '#10B981' : '#64748B',
                                                        mb: 0.5
                                                    }} 
                                                />
                                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#94A3B8' }}>MODE</Typography>
                                            </Box>
                                        </Stack>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                    checked={test.isActive} 
                                                    onChange={() => handleToggleStatus(test.id, test.isActive)}
                                                    color="secondary"
                                                />
                                            }
                                            label=""
                                            sx={{ m: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
                                        />
                                    </Box>
                                    
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, letterSpacing: -0.5 }}>
                                        {test.name}
                                    </Typography>

                                    <Chip
                                        size="small"
                                        label={test.isGlobal ? 'Class: All Classes' : `Class: ${test.className || 'Unassigned'}`}
                                        sx={{
                                            mb: 2,
                                            fontWeight: 800,
                                            bgcolor: 'rgba(15, 23, 42, 0.06)',
                                            color: '#0F172A'
                                        }}
                                    />

                                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mb: 3, minHeight: 40, lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {test.description || 'No detailed strategy provided for this evaluation.'}
                                    </Typography>
                                    
                                    <Stack direction="row" spacing={1.5} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                                        {test.closingAt && (
                                            <Chip
                                                label={`LAST DATE OF SUBMISSION ${new Date(test.closingAt).toLocaleDateString()}`}
                                                sx={{ fontWeight: 800, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#92400E', px: 1 }}
                                            />
                                        )}
                                        <Chip 
                                            icon={<Settings sx={{ fontSize: '1rem !important' }} />} 
                                            label={`${test.questionCount || 0} ITEMS`} 
                                            sx={{ fontWeight: 800, bgcolor: 'rgba(236, 72, 153, 0.05)', color: '#EC4899', px: 1 }} 
                                        />
                                        <Chip 
                                            icon={<InfoOutlined sx={{ fontSize: '1rem !important' }} />} 
                                            label={`${test.totalMarks} MARKS`} 
                                            sx={{ fontWeight: 800, bgcolor: '#F1F5F9', color: '#0F172A', px: 1 }} 
                                        />
                                    </Stack>

                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        startIcon={<Settings />}
                                        onClick={() => navigate(`/admin/test-builder/${test.id}`)}
                                        sx={{ 
                                            bgcolor: '#0F172A', fontWeight: 900, borderRadius: 3, py: 1.8,
                                            '&:hover': { bgcolor: '#EC4899', boxShadow: '0 15px 25px -5px rgba(236, 72, 153, 0.3)' },
                                            transition: 'all 0.3s',
                                            fontSize: { xs: '0.85rem', sm: '0.95rem' }
                                        }}
                                    >
                                        Configure Evaluation
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<EditOutlined />}
                                        onClick={() => handleOpenEdit(test)}
                                        sx={{
                                            mt: 1.5,
                                            borderRadius: 3,
                                            py: 1.6,
                                            fontWeight: 900,
                                            borderColor: 'rgba(37, 99, 235, 0.35)',
                                            color: '#2563EB',
                                            '&:hover': { borderColor: '#2563EB', bgcolor: 'rgba(37, 99, 235, 0.06)' },
                                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                        }}
                                    >
                                        Edit Test Details
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<DeleteOutline />}
                                        onClick={() => handleDeleteTest(test.id)}
                                        sx={{
                                            mt: 1.5,
                                            borderRadius: 3,
                                            py: 1.6,
                                            fontWeight: 900,
                                            borderColor: 'rgba(239, 68, 68, 0.35)',
                                            color: '#EF4444',
                                            '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.06)' },
                                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                        }}
                                    >
                                        Delete Test
                                    </Button>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && tests.length === 0 && (
                    <Box sx={{ p: { xs: 4, sm: 8, md: 15 }, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: 8, border: '2px dashed #E2E8F0' }}>
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
                fullScreen={false}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: { xs: 0, sm: 8 }, p: { xs: 1.5, sm: 2 }, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', m: { xs: 0, sm: 2 } } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', sm: '1.75rem' }, letterSpacing: -1, pt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 4 } }}>
                    New Phase <Box component="span" sx={{ color: '#EC4899' }}>Initialization</Box>
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 4 } }}>
                    <Stack spacing={4} sx={{ mt: 2 }}>
                        <TextField 
                            label="Assessment Title" fullWidth autoFocus
                            value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })}
                            placeholder="e.g. End of Semester Q1"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#F8FAFC', fontWeight: 700 } }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 4 }, justifyContent: 'space-between', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}>
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

            <Dialog
                open={editOpen}
                onClose={() => !editSaving && setEditOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: { xs: 0, sm: 6 }, width: '100%', maxWidth: 560, m: { xs: 0, sm: 2 } } }}
            >
                <DialogTitle sx={{ fontWeight: 900, px: { xs: 2, sm: 3 } }}>Edit Test Details</DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Test Name"
                            fullWidth
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={3}
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<PhotoCamera />}
                                sx={{ borderRadius: 2.5, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
                            >
                                Upload Test Image
                                <input type="file" accept="image/*" hidden onChange={handleEditImageUpload} />
                            </Button>
                            {editForm.testImageUrl && (
                                <Button
                                    color="error"
                                    onClick={() => setEditForm(prev => ({ ...prev, testImageUrl: null }))}
                                    sx={{ fontWeight: 700 }}
                                >
                                    Remove Image
                                </Button>
                            )}
                        </Stack>
                        {editForm.testImageUrl && (
                            <Box
                                component="img"
                                src={editForm.testImageUrl}
                                alt="Test preview"
                                sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2, border: '1px solid #E2E8F0' }}
                            />
                        )}
                        <TextField
                            type="date"
                            label="Last Date of Submission"
                            fullWidth
                            value={editForm.closingAt}
                            onChange={(e) => setEditForm(prev => ({ ...prev, closingAt: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            helperText="Users cannot start or continue this test after this date."
                        />
                        <TextField
                            type="number"
                            label="Total Marks"
                            fullWidth
                            value={editForm.totalMarks}
                            onChange={(e) => setEditForm(prev => ({ ...prev, totalMarks: Number(e.target.value) }))}
                        />
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Test Instructions</Typography>
                            <Paper variant="outlined" sx={{ borderColor: '#E2E8F0', borderRadius: 2, maxHeight: 190, overflow: 'auto' }}>
                                <List sx={{ py: 0 }}>
                                    {instructionBank.filter((item: any) => item.isActive).map((item: any) => {
                                        const checked = editForm.selectedInstructionIds.includes(item.id);
                                        return (
                                            <ListItem
                                                key={item.id}
                                                divider
                                                onClick={() => setEditForm(prev => ({
                                                    ...prev,
                                                    selectedInstructionIds: checked
                                                        ? prev.selectedInstructionIds.filter((id) => id !== item.id)
                                                        : [...prev.selectedInstructionIds, item.id],
                                                }))}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <Checkbox checked={checked} />
                                                <ListItemText primary={item.text} />
                                            </ListItem>
                                        );
                                    })}
                                    {instructionBank.filter((item: any) => item.isActive).length === 0 && (
                                        <ListItem>
                                            <ListItemText primary="No active instructions found. Create them in Instruction Bank." />
                                        </ListItem>
                                    )}
                                </List>
                            </Paper>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editForm.isGlobal}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, isGlobal: e.target.checked }))}
                                />
                            }
                            label="All Classes"
                            sx={{ alignSelf: 'flex-start' }}
                        />
                        {!editForm.isGlobal && (
                            <TextField
                                select
                                fullWidth
                                label="Class"
                                value={editForm.classId}
                                onChange={(e) => setEditForm(prev => ({ ...prev, classId: e.target.value === '' ? '' : Number(e.target.value) }))}
                            >
                                <MenuItem value="">Default Class</MenuItem>
                                {classes.map((c: any) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                    <Button onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveEdit} disabled={editSaving}>
                        {editSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TestList;
