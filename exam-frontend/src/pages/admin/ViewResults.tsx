import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Avatar, Chip, LinearProgress, Button } from '@mui/material';
import { Assessment, CalendarToday, Percent, ArrowBack, Download, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';
import dayjs from 'dayjs';

const ViewResults = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await adminApi.getResults();
                setResults(res.data);
            } catch (err) {} finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const stats = {
        total: results.length,
        avg: results.length > 0 
            ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions * 100), 0) / results.length) 
            : 0
    };

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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assessment sx={{ color: '#10B981', mr: 1 }} />
                            <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Analytics</Typography>
                        </Box>
                        <Button 
                            variant="outlined" startIcon={<Download />} 
                            sx={{ borderRadius: 2, fontWeight: 700, borderColor: '#E2E8F0', color: '#64748B' }}
                        >
                            Export CSV
                        </Button>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0F172A' }}>Performance Analytics</Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {/* Insights Bar */}
                <Box sx={{ display: 'flex', gap: 3, mb: 5, flexWrap: 'wrap' }}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 3, flex: 1, minWidth: 250, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#FFFFFF' 
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: 48, height: 48 }}>
                            <TrendingUp />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>{stats.total}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Submissions Completed</Typography>
                        </Box>
                    </Paper>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 3, flex: 1, minWidth: 250, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#FFFFFF' 
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', width: 48, height: 48 }}>
                            <Percent />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>{stats.avg}%</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Average Accuracy Rate</Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Table Container */}
                <TableContainer 
                    component={Paper} 
                    elevation={0} 
                    sx={{ 
                        borderRadius: 5, border: '1px solid #E2E8F0', 
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                        overflow: 'hidden'
                    }}
                >
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#475569', py: 2.5 }}>CANDIDATE</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>ASSESSMENT MODULE</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>SCORE RAW</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>ACCURACY %</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>SUBMITTED ON</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.map((row) => {
                                const percentage = row.totalQuestions > 0 
                                    ? Math.round((row.score / row.totalQuestions) * 100) 
                                    : 0;
                                
                                return (
                                    <TableRow 
                                        key={`${row.userId}-${row.testId}`}
                                        sx={{ '&:hover': { bgcolor: '#F1F5F9' }, transition: 'background 0.2s' }}
                                    >
                                        <TableCell sx={{ py: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366F1', fontSize: '0.9rem', fontWeight: 800 }}>{row.userName.charAt(0)}</Avatar>
                                                <Typography sx={{ fontWeight: 700, color: '#1E293B' }}>{row.userName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600, color: '#475569' }}>{row.testName}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={`${row.score} / ${row.totalQuestions}`} 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ fontWeight: 800, borderRadius: 1.5, borderColor: '#E2E8F0', color: '#1E293B' }} 
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ width: '100%', minWidth: 100 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.5, color: percentage >= 50 ? '#10B981' : '#EF4444' }}>
                                                    {percentage}%
                                                </Typography>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={percentage} 
                                                    sx={{ 
                                                        height: 6, borderRadius: 3, bgcolor: '#F1F5F9',
                                                        '& .MuiLinearProgress-bar': { bgcolor: percentage >= 50 ? '#10B981' : '#EF4444', borderRadius: 3 }
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                <CalendarToday sx={{ fontSize: 16, color: '#94A3B8' }} />
                                                <Typography sx={{ fontWeight: 600, color: '#64748B' }}>
                                                    {dayjs(row.submittedAt).format('MMM DD, YYYY [at] HH:mm')}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {results.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" sx={{ fontWeight: 600 }}>No assessment records found in the database.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <LinearProgress sx={{ width: '50%', mx: 'auto', borderRadius: 3 }} />
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: '#64748B' }}>RETRIEVING ENCRYPTED RECORDS...</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    );
};

export default ViewResults;
