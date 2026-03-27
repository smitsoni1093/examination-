import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Grid, Card, CardContent, Avatar, Stack, Chip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Assignment, 
  Timer, 
  Timeline
} from '@mui/icons-material';
import { userApi } from '../../api/endpoints';

const UserDashboard = () => {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { name } = useSelector((state: any) => state.auth);

    useEffect(() => {
        const fetchTests = async () => {
            setError(null);
            try {
                const res = await userApi.getAvailableTests();
                setTests(res.data);
            } catch (err: any) {
                console.error("Failed to fetch available tests.", err);
                const msg = err.response?.data?.message || err.message || "Failed to establish secure connection.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    const completedCount = tests.filter(t => t.isCompleted).length;
    const pendingCount = tests.length - completedCount;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Direct Header - Integrated Fluid Design */}
            <Box sx={{ 
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', 
                pt: { xs: 4, md: 6 }, 
                pb: { xs: 10, md: 14 }, 
                color: 'white',
                position: 'relative',
                width: '100%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.2) 0%, transparent 70%)' }} />

                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Grid container alignItems="center" spacing={3}>
                        <Grid item xs={12} md={7}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.1)', 
                                    width: { xs: 50, md: 70 }, 
                                    height: { xs: 50, md: 70 }, 
                                    mr: 3, 
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    fontWeight: 800
                                }}>
                                    {name?.charAt(0) || 'U'}
                                </Avatar>
                                <Box>
                                    <Typography variant="h3" sx={{ 
                                        fontWeight: 900, 
                                        letterSpacing: '-1px', 
                                        fontSize: { xs: '2rem', md: '3rem' }
                                    }}>
                                        Welcome back, {name.split(' ')[0]}
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ opacity: 0.6 }}>
                                        Registered Student Account • Session 2026-A
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={5}>
                            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                <Box sx={{ px: 3, py: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', minWidth: 120 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{completedCount}</Typography>
                                    <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.5 }}>Finished</Typography>
                                </Box>
                                <Box sx={{ px: 3, py: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', minWidth: 120 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900 }}>{pendingCount}</Typography>
                                    <Typography variant="caption" sx={{ textTransform: 'uppercase', opacity: 0.5 }}>Pending</Typography>
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Expansive Grid Section */}
            <Container maxWidth={false} sx={{ mt: -6, px: { xs: 3, md: 6, lg: 10 }, pb: 8, flexGrow: 1, width: '100%', position: 'relative', zIndex: 10 }}>
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, border: '1px solid #E2E8F0', minHeight: '600px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>Assigned Evaluations</Typography>
                            <Typography variant="body2" sx={{ color: '#64748B' }}>Authorized secure examination portal.</Typography>
                        </Box>
                        <Chip label="System Status: Verified" color="success" size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
                    </Box>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 4, borderRadius: 3, fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                            System Connectivity Warning: {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ py: 15, textAlign: 'center' }}>
                            <Typography color="text.secondary">Loading secure sessions...</Typography>
                        </Box>
                    ) : (
                        <>
                            {tests.length === 0 ? (
                                <Box sx={{ 
                                    py: 12, 
                                    textAlign: 'center', 
                                    bgcolor: '#F8FAFC', 
                                    borderRadius: 5, 
                                    border: '2px dashed #E2E8F0' 
                                }}>
                                    <Avatar sx={{ bgcolor: '#F1F5F9', color: '#94A3B8', width: 80, height: 80, mx: 'auto', mb: 3 }}>
                                        <Assignment sx={{ fontSize: 40 }} />
                                    </Avatar>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#475569', mb: 1 }}>
                                        No Assessments Assigned
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 450, mx: 'auto' }}>
                                        You currently have no active examinations. Please Wait for the administrator to assign tests to your profile.
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        sx={{ mt: 4, borderRadius: 3, fontWeight: 700 }}
                                        onClick={() => window.location.reload()}
                                    >
                                        Check for Updates
                                    </Button>
                                </Box>
                            ) : (
                                <Grid container spacing={3}>
                                    {tests.map(test => (
                                        <Grid item xs={12} sm={6} lg={4} xl={3} key={test.id} sx={{ display: 'flex' }}>
                                            <Card elevation={0} sx={{ 
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: 5,
                                                transition: 'all 0.2s ease-in-out',
                                                bgcolor: test.isCompleted ? '#F8FAFC' : '#FFFFFF',
                                                '&:hover': { 
                                                    transform: 'scale(1.02)', 
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    borderColor: 'primary.main'
                                                } 
                                            }}>
                                                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                                        <Box sx={{ 
                                                            width: 48, height: 48, borderRadius: 3, 
                                                            bgcolor: test.isCompleted ? '#F1F5F9' : '#EDE9FE', 
                                                            color: test.isCompleted ? '#94A3B8' : 'primary.main',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <Assignment />
                                                        </Box>
                                                        <Chip 
                                                            label={test.isCompleted ? "DONE" : "TAKE TEST"} 
                                                            size="small" 
                                                            color={test.isCompleted ? "default" : "primary"}
                                                            sx={{ fontWeight: 800, fontSize: '0.7rem', borderRadius: 1.5 }} 
                                                        />
                                                    </Box>

                                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, minHeight: '3.5rem', lineHeight: 1.2 }}>
                                                        {test.name}
                                                    </Typography>

                                                    <Stack spacing={1} sx={{ mb: 4 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748B' }}>
                                                            <Timer sx={{ fontSize: 16, mr: 1 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{test.duration} Minutes Duration</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748B' }}>
                                                            <Timeline sx={{ fontSize: 16, mr: 1 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{test.questionCount} Questions Assigned</Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #F1F5F9' }}>
                                                        {test.isCompleted ? (
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Box>
                                                                    <Typography variant="caption" display="block" sx={{ color: '#94A3B8', fontWeight: 700 }}>YOUR SCORE</Typography>
                                                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'success.main' }}>{test.score}/{test.questionCount}</Typography>
                                                                </Box>
                                                                <Button variant="outlined" size="small" onClick={() => navigate(`/user/result/${test.id}`)} sx={{ borderRadius: 2 }}>Details</Button>
                                                            </Box>
                                                        ) : (
                                                            <Button 
                                                                variant="contained" 
                                                                fullWidth 
                                                                onClick={() => navigate(`/user/instructions/${test.id}`)}
                                                                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, boxShadow: 'none' }}
                                                            >
                                                                Enroll Now
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default UserDashboard;
