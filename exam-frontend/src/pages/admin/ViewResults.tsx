import { useState, useEffect, useMemo } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Avatar, Chip, LinearProgress, Button, Pagination } from '@mui/material';
import { Assessment, CalendarToday, Percent, ArrowBack, Download, TrendingUp, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';
import { TextField, InputAdornment } from '@mui/material';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

const ViewResults = () => {
    const navigate = useNavigate();
    const themeMode = useSelector((state: any) => state.theme?.mode || 'light');
    const isDark = themeMode === 'dark';
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setError(null);
                const res = await adminApi.getResults();
                setResults(res.data);
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to load results.';
                setError(message);
                setResults([]);
            } finally {
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

    const filteredResults = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return results;

        return results.filter((row) => {
            const userName = String(row.userName ?? '').toLowerCase();
            const testName = String(row.testName ?? '').toLowerCase();
            const userId = String(row.userId ?? '').toLowerCase();
            const testId = String(row.testId ?? '').toLowerCase();
            const score = String(row.score ?? '').toLowerCase();

            return (
                userName.includes(term) ||
                testName.includes(term) ||
                userId.includes(term) ||
                testId.includes(term) ||
                score.includes(term)
            );
        });
    }, [results, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));

    const pagedResults = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredResults.slice(start, start + pageSize);
    }, [filteredResults, page]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const handleReleaseResult = async (userId: number, testId: number) => {
        try {
            await adminApi.releaseResult(userId, testId);
            setResults((prev) => prev.map((item) => {
                if (item.userId === userId && item.testId === testId) {
                    return {
                        ...item,
                        isPublished: true,
                        publishedAt: new Date().toISOString(),
                    };
                }
                return item;
            }));
        } catch (err) {
            console.error('Failed to release result', err);
            setError('Failed to release result. Please try again.');
        }
    };

    const csvEscape = (value: unknown) => {
        const str = value == null ? '' : String(value);
        return `"${str.replace(/"/g, '""')}"`;
    };

    const handleExportCsv = () => {
        if (!results.length) return;

        const headers = [
            'Candidate Name',
            'Candidate User ID',
            'Assessment Module',
            'Score',
            'Total Questions',
            'Accuracy Percentage',
            'Submitted On',
        ];

        const rows = results.map((row) => {
            const percentage = row.totalQuestions > 0
                ? Math.round((row.score / row.totalQuestions) * 100)
                : 0;

            return [
                row.userName,
                row.userId,
                row.testName,
                row.score,
                row.totalQuestions,
                percentage,
                dayjs(row.submittedAt).format('YYYY-MM-DD HH:mm:ss'),
            ];
        });

        const csvContent = [headers, ...rows]
            .map((line) => line.map((cell) => csvEscape(cell)).join(','))
            .join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const fileName = `admin-results-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: isDark ? '#000000' : '#F8FAFC',
                color: isDark ? '#FFFFFF' : 'inherit',
                pb: 10,
                '& .MuiPaper-root': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.28) !important' : undefined,
                },
                '& .MuiTypography-root, & .MuiButton-root, & .MuiIconButton-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiOutlinedInput-root, & .MuiInputBase-root, & .MuiSelect-select': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                },
                '& .MuiOutlinedInput-notchedOutline, & .MuiDivider-root, & .MuiTableCell-root': {
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.32) !important' : undefined,
                },
                '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableCell-root': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                },
                '& .MuiTableRow-root:hover': {
                    backgroundColor: isDark ? '#111111 !important' : undefined,
                },
                '& .MuiChip-root, & .MuiAvatar-root, & .MuiLinearProgress-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
            }}
        >
            {/* Page Header */}
            <Box sx={{ bgcolor: isDark ? '#000000' : '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate('/admin')}
                        sx={{ mb: 2, color: isDark ? '#E2E8F0' : '#64748B', fontWeight: 700 }}
                    >
                        Back to Dashboard
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assessment sx={{ color: '#10B981', mr: 1 }} />
                            <Typography variant="overline" sx={{ fontWeight: 800, color: isDark ? '#CBD5E1' : '#94A3B8', letterSpacing: 1.5 }}>Analytics</Typography>
                        </Box>
                        <Button 
                            variant="outlined" startIcon={<Download />} 
                            onClick={handleExportCsv}
                            disabled={loading || results.length === 0}
                            sx={{ borderRadius: 2, fontWeight: 700, borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : '#E2E8F0', color: isDark ? '#FFFFFF' : '#64748B' }}
                        >
                            Export CSV
                        </Button>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: isDark ? '#FFFFFF' : '#0F172A' }}>Performance Analytics</Typography>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by user, test, id, or score"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: '#94A3B8' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                maxWidth: 480,
                                '& .MuiOutlinedInput-root': { borderRadius: 3 },
                            }}
                        />
                    </Box>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {/* Insights Bar */}
                <Box sx={{ display: 'flex', gap: 3, mb: 5, flexWrap: 'wrap' }}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 3, flex: 1, minWidth: 250, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', gap: 2, bgcolor: isDark ? '#000000' : '#FFFFFF' 
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: 48, height: 48 }}>
                            <TrendingUp />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>{stats.total}</Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Submissions Completed</Typography>
                        </Box>
                    </Paper>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 3, flex: 1, minWidth: 250, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', gap: 2, bgcolor: isDark ? '#000000' : '#FFFFFF' 
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', width: 48, height: 48 }}>
                            <Percent />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>{stats.avg}%</Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Average Accuracy Rate</Typography>
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
                        <TableHead sx={{ bgcolor: isDark ? '#000000' : '#F8FAFC' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: 2.5 }}>CANDIDATE</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>ASSESSMENT MODULE</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>SCORE RAW</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>ACCURACY %</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>SUBMITTED ON</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>RESULT STATUS</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pagedResults.map((row) => {
                                const percentage = row.totalQuestions > 0 
                                    ? Math.round((row.score / row.totalQuestions) * 100) 
                                    : 0;
                                
                                return (
                                    <TableRow 
                                        key={`${row.userId}-${row.testId}`}
                                        sx={{ '&:hover': { bgcolor: isDark ? '#111111' : '#F1F5F9' }, transition: 'background 0.2s' }}
                                    >
                                        <TableCell sx={{ py: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: isDark ? '#111111' : '#6366F1', fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>{row.userName.charAt(0)}</Avatar>
                                                <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#1E293B' }}>{row.userName}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600, color: isDark ? '#CBD5E1' : '#475569' }}>{row.testName}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={`${row.score} / ${row.totalQuestions}`} 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ fontWeight: 800, borderRadius: 1.5, borderColor: isDark ? 'rgba(148, 163, 184, 0.35)' : '#E2E8F0', color: isDark ? '#FFFFFF' : '#1E293B' }} 
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
                                                        height: 6, borderRadius: 3, bgcolor: isDark ? '#111111' : '#F1F5F9',
                                                        '& .MuiLinearProgress-bar': { bgcolor: percentage >= 50 ? '#10B981' : '#EF4444', borderRadius: 3 }
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                <CalendarToday sx={{ fontSize: 16, color: '#94A3B8' }} />
                                                <Typography sx={{ fontWeight: 600, color: isDark ? '#CBD5E1' : '#64748B' }}>
                                                    {dayjs(row.submittedAt).format('MMM DD, YYYY [at] HH:mm')}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={row.isPublished ? 'Released' : 'Pending'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    borderRadius: 1.5,
                                                    bgcolor: row.isPublished ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                                                    color: row.isPublished ? '#047857' : '#B45309',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigate(`/admin/results/${row.userId}/${row.testId}/answers`)}
                                                    sx={{ borderRadius: 2, fontWeight: 800, borderColor: '#E2E8F0', color: '#334155' }}
                                                >
                                                    View Answers
                                                </Button>
                                                <Button
                                                    variant={row.isPublished ? 'outlined' : 'contained'}
                                                    size="small"
                                                    disabled={row.isPublished}
                                                    onClick={() => handleReleaseResult(row.userId, row.testId)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        fontWeight: 800,
                                                        textTransform: 'none',
                                                        borderColor: row.isPublished ? '#BBF7D0' : '#16A34A',
                                                        bgcolor: row.isPublished ? '#F0FDF4' : '#16A34A',
                                                        color: row.isPublished ? '#15803D' : '#FFFFFF',
                                                        '&:hover': {
                                                            bgcolor: row.isPublished ? '#F0FDF4' : '#15803D',
                                                        },
                                                    }}
                                                >
                                                    {row.isPublished ? 'Released' : 'Release Result'}
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredResults.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                                            {searchTerm.trim()
                                                ? 'No results match your search.'
                                                : (error ?? 'No assessment records found in the database.')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <LinearProgress sx={{ width: '50%', mx: 'auto', borderRadius: 3 }} />
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: '#64748B' }}>RETRIEVING ENCRYPTED RECORDS...</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredResults.length > pageSize && (
                    <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center', bgcolor: isDark ? '#000000' : '#FFFFFF' }}>
                        <Pagination
                            color="primary"
                            shape="rounded"
                            page={page}
                            count={totalPages}
                            onChange={(_, value) => setPage(value)}
                        />
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default ViewResults;
