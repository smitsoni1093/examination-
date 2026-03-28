import { useState } from 'react';
import { Container, Typography, Box, Paper, Button, Stack, Alert, Avatar, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Divider, Grid } from '@mui/material';
import { CloudUpload, TableChart, CheckCircle, ErrorOutline, FileDownload, ArrowBack, Storage } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

const ImportQuestions = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await adminApi.importQuestions(formData);
            setResult(res.data);
            setFile(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Upload failed. Please check the file format.');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        // Simple CSV-based template for easiest implementation without extra library on frontend
        const headers = "Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer\n";
        const example = "What is the capital of France?,Paris,London,Berlin,Madrid,A";
        const blob = new Blob([headers + example], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Button 
                                startIcon={<ArrowBack />} 
                                onClick={() => navigate('/admin')}
                                sx={{ mb: 1, color: '#64748B', fontWeight: 700 }}
                            >
                                Dashboard
                            </Button>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', mr: 2, width: 32, height: 32 }}>
                                    <TableChart sx={{ fontSize: 20 }} />
                                </Avatar>
                                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>
                                    Bulk <Box component="span" sx={{ color: '#94A3B8' }}>Import</Box>
                                </Typography>
                            </Box>
                        </Box>
                        <Button 
                            variant="outlined" 
                            startIcon={<FileDownload />}
                            onClick={downloadTemplate}
                            sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
                        >
                            Download Template
                        </Button>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="md">
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 6, borderRadius: 8, border: '2px dashed #E2E8F0', bgcolor: '#FFFFFF',
                                textAlign: 'center', transition: 'all 0.3s',
                                '&:hover': { borderColor: '#6366F1', bgcolor: '#F8FAFC' }
                            }}
                        >
                            <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.05)', color: '#6366F1', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                                <CloudUpload sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Select Question Manifest</Typography>
                            <Typography variant="body1" sx={{ color: '#64748B', mb: 4 }}>Upload your .xlsx or .csv file containing multiple choice questions.</Typography>
                            
                            <input
                                type="file"
                                accept=".xlsx,.csv"
                                id="excel-upload"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            
                            <label htmlFor="excel-upload">
                                <Button 
                                    variant="contained" 
                                    component="span"
                                    sx={{ 
                                        bgcolor: '#0F172A', fontWeight: 900, px: 6, py: 1.5, borderRadius: 4,
                                        '&:hover': { bgcolor: '#1E293B' }
                                    }}
                                >
                                    Browse Files
                                </Button>
                            </label>

                            {file && (
                                <Box sx={{ mt: 4, p: 2, bgcolor: '#F1F5F9', borderRadius: 3, display: 'inline-flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mr: 2 }}>{file.name}</Typography>
                                    <Button 
                                        variant="contained" 
                                        disabled={loading}
                                        onClick={handleUpload}
                                        sx={{ bgcolor: '#6366F1', fontWeight: 900, borderRadius: 2 }}
                                    >
                                        {loading ? 'Processing...' : 'Upload & Sync'}
                                    </Button>
                                </Box>
                            )}

                            {loading && (
                                <Box sx={{ mt: 4, width: '100%' }}>
                                    <LinearProgress sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#6366F1' } }} />
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: '#64748B' }}>Parsing data engine... please wait.</Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {error && (
                        <Grid item xs={12}>
                            <Alert severity="error" sx={{ borderRadius: 4, fontWeight: 700 }}>{error}</Alert>
                        </Grid>
                    )}

                    {result && (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                                <Stack direction="row" spacing={4} sx={{ mb: 6 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8' }}>PROCESSED</Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A' }}>{result.totalRows}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#10B981' }}>SUCCESSFUL</Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981' }}>{result.successCount}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#EF4444' }}>FAILED</Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#EF4444' }}>{result.failedCount}</Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ mb: 4 }} />

                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Import Details</Typography>
                                {result.errors.length > 0 ? (
                                    <List sx={{ bgcolor: 'rgba(239, 68, 68, 0.02)', borderRadius: 4, p: 2 }}>
                                        {result.errors.slice(0, 10).map((err: string, idx: number) => (
                                            <ListItem key={idx}>
                                                <ListItemIcon><ErrorOutline sx={{ color: '#EF4444' }} /></ListItemIcon>
                                                <ListItemText primary={err} primaryTypographyProps={{ fontWeight: 600, color: '#64748B' }} />
                                            </ListItem>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <Typography variant="caption" sx={{ p: 2, display: 'block', color: '#94A3B8' }}>
                                                Check source file for {result.errors.length - 10} additional errors.
                                            </Typography>
                                        )}
                                    </List>
                                ) : (
                                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: 4 }}>
                                        <CheckCircle sx={{ color: '#10B981', fontSize: 40, mb: 1 }} />
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#047857' }}>All items imported successfully.</Typography>
                                    </Box>
                                )}
                                
                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    startIcon={<Storage />} 
                                    onClick={() => navigate('/admin/create-question')}
                                    sx={{ mt: 4, py: 1.5, borderRadius: 3, fontWeight: 800 }}
                                >
                                    Review Question Registry
                                </Button>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Container>
        </Box>
    );
};

export default ImportQuestions;
