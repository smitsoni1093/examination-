import { useState, useEffect, useMemo } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Avatar, Chip, LinearProgress, Button, Checkbox } from '@mui/material';
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
    const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
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

    const handleBulkRelease = async () => {
        try {
            const itemsToRelease = pagedResults.filter((item) => {
                const key = `${item.userId}-${item.testId}`;
                return selectedResults.has(key) && !item.isPublished;
            });

            for (const item of itemsToRelease) {
                await adminApi.releaseResult(item.userId, item.testId);
            }

            setResults((prev) => prev.map((item) => {
                const key = `${item.userId}-${item.testId}`;
                if (selectedResults.has(key)) {
                    return {
                        ...item,
                        isPublished: true,
                        publishedAt: new Date().toISOString(),
                    };
                }
                return item;
            }));
            setSelectedResults(new Set());
        } catch (err) {
            console.error('Failed to bulk release results', err);
            setError('Failed to bulk release results. Please try again.');
        }
    };

    const toggleResultSelection = (userId: number, testId: number) => {
        const key = `${userId}-${testId}`;
        const newSelected = new Set(selectedResults);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedResults(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedResults.size === pagedResults.length) {
            setSelectedResults(new Set());
        } else {
            const allKeys = new Set<string>();
            pagedResults.forEach((item) => {
                allKeys.add(`${item.userId}-${item.testId}`);
            });
            setSelectedResults(allKeys);
        }
    };

    const unreleaseCount = Array.from(selectedResults).filter((key) => {
        const [userId, testId] = key.split('-');
        const item = results.find((r) => r.userId === Number(userId) && r.testId === Number(testId));
        return item && !item.isPublished;
    }).length;

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
            <Box sx={{ bgcolor: isDark ? '#000000' : '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: { xs: 2, md: 4 }, mb: { xs: 3, md: 6 } }}>
                <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 6, lg: 10 } }}>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate('/admin')}
                        sx={{ mb: 2, color: isDark ? '#E2E8F0' : '#64748B', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' } }}
                    >
                        Back to Dashboard
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Assessment sx={{ color: '#10B981', mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                            <Typography variant="overline" sx={{ fontWeight: 800, color: isDark ? '#CBD5E1' : '#94A3B8', letterSpacing: 1.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Analytics</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', sm: 'auto' } }}>
                            {selectedResults.size > 0 && unreleaseCount > 0 && (
                                <Button 
                                    variant="contained" 
                                    onClick={handleBulkRelease}
                                    sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontSize: { xs: '0.7rem', sm: '0.85rem' }, py: { xs: 0.8, sm: 1 } }}
                                >
                                    Release Selected ({unreleaseCount})
                                </Button>
                            )}
                            <Button 
                                variant="outlined" startIcon={<Download />} 
                                onClick={handleExportCsv}
                                disabled={loading || results.length === 0}
                                sx={{ borderRadius: 2, fontWeight: 700, fontSize: { xs: '0.7rem', sm: '0.85rem' }, borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : '#E2E8F0', color: isDark ? '#FFFFFF' : '#64748B', py: { xs: 0.8, sm: 1 } }}
                            >
                                Export CSV
                            </Button>
                        </Box>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '1.5rem', sm: '2.5rem', md: '3rem' } }}>Performance Analytics</Typography>
                    <Box sx={{ mt: { xs: 1.5, md: 2 } }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search by user, test, id, or score"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: '#94A3B8', fontSize: { xs: 18, sm: 20 } }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                maxWidth: { xs: '100%', md: 480 },
                                '& .MuiOutlinedInput-root': { borderRadius: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } },
                            }}
                        />
                    </Box>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 6, lg: 10 } }}>
                {/* Insights Bar */}
                <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, mb: { xs: 3, md: 5 }, flexWrap: 'wrap' }}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: { xs: 2, md: 3 }, flex: 1, minWidth: { xs: '100%', sm: 250 }, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', gap: 2, bgcolor: isDark ? '#000000' : '#FFFFFF' 
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
                            <TrendingUp />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>{stats.total}</Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Submissions Completed</Typography>
                        </Box>
                    </Paper>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: { xs: 2, md: 3 }, flex: 1, minWidth: { xs: '100%', sm: 250 }, borderRadius: 5, border: '1px solid #E2E8F0', 
                            display: 'flex', alignItems: 'center', gap: 2, bgcolor: isDark ? '#000000' : '#FFFFFF' 
                        }}
                    >
                        <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
                            <Percent />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>{stats.avg}%</Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>Average Accuracy Rate</Typography>
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
                        overflow: 'auto'
                    }}
                >
                    <Table sx={{ minWidth: { xs: '100%', sm: 800, md: 1000 } }}>
                        <TableHead sx={{ bgcolor: isDark ? '#000000' : '#F8FAFC' }}>
                            <TableRow>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, width: { xs: 40, sm: 50 }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>
                                    <Checkbox 
                                        checked={selectedResults.size === pagedResults.length && pagedResults.length > 0}
                                        indeterminate={selectedResults.size > 0 && selectedResults.size < pagedResults.length}
                                        onChange={toggleSelectAll}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>CANDIDATE</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>ASSESSMENT MODULE</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>SCORE RAW</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>ACCURACY %</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>SUBMITTED ON</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>RESULT STATUS</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: { xs: 1.5, md: 2.5 }, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>ACTIONS</TableCell>
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
                                        <TableCell align="center" sx={{ py: { xs: 1, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Checkbox 
                                                checked={selectedResults.has(`${row.userId}-${row.testId}`)}
                                                onChange={() => toggleResultSelection(row.userId, row.testId)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: { xs: 1, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, color: isDark ? '#FFFFFF' : '#1E293B' }}>{row.userName}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: { xs: 1, md: 2 }, display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Typography sx={{ fontWeight: 600, color: isDark ? '#CBD5E1' : '#475569', fontSize: { xs: '0.75rem', sm: '0.9rem' } }}>{row.testName}</Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: { xs: 1, md: 2 }, display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Chip 
                                                label={`${row.score} / ${row.totalQuestions}`} 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ fontWeight: 800, borderRadius: 1.5, borderColor: isDark ? 'rgba(148, 163, 184, 0.35)' : '#E2E8F0', color: isDark ? '#FFFFFF' : '#1E293B', fontSize: { xs: '0.6rem', sm: '0.75rem' } }} 
                                            />
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: { xs: 1, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Box sx={{ width: '100%', minWidth: { xs: 60, sm: 100 } }}>
                                                <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.5, fontSize: { xs: '0.7rem', sm: '0.9rem' }, color: percentage >= 50 ? '#10B981' : '#EF4444' }}>
                                                    {percentage}%
                                                </Typography>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={percentage} 
                                                    sx={{ 
                                                        height: { xs: 4, sm: 6 }, borderRadius: 3, bgcolor: isDark ? '#111111' : '#F1F5F9',
                                                        '& .MuiLinearProgress-bar': { bgcolor: percentage >= 50 ? '#10B981' : '#EF4444', borderRadius: 3 }
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: { xs: 1, md: 2 }, display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                <CalendarToday sx={{ fontSize: { xs: 12, sm: 16 }, color: '#94A3B8' }} />
                                                <Typography sx={{ fontWeight: 600, color: isDark ? '#CBD5E1' : '#64748B', fontSize: { xs: '0.65rem', sm: '0.9rem' } }}>
                                                    {dayjs(row.submittedAt).format('MMM DD, YYYY')}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: { xs: 1, md: 2 }, display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Chip
                                                label={row.isPublished ? 'Released' : 'Pending'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    borderRadius: 1.5,
                                                    bgcolor: row.isPublished ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                                                    color: row.isPublished ? '#047857' : '#B45309',
                                                    fontSize: { xs: '0.6rem', sm: '0.75rem' }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: { xs: 1, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.3, sm: 0.5 }, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => navigate(`/admin/results/${row.userId}/${row.testId}/answers`)}
                                                    sx={{ borderRadius: 1, fontWeight: 700, fontSize: { xs: '0.6rem', sm: '0.75rem' }, px: { xs: 0.8, sm: 1.5 }, py: { xs: 0.3, sm: 0.5 }, borderColor: '#E2E8F0', color: '#334155' }}
                                                >
                                                    View
                                                </Button>
                                                {!row.isPublished && (
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleReleaseResult(row.userId, row.testId)}
                                                        sx={{
                                                            borderRadius: 1,
                                                            fontWeight: 700,
                                                            fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                                            px: { xs: 0.8, sm: 1.5 },
                                                            py: { xs: 0.3, sm: 0.5 },
                                                            bgcolor: '#16A34A',
                                                            color: '#FFFFFF',
                                                            '&:hover': {
                                                                bgcolor: '#15803D',
                                                            },
                                                        }}
                                                    >
                                                        Release
                                                    </Button>
                                                )}
                                                {row.isPublished && (
                                                    <Chip label="Released" size="small" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#047857' }} />
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredResults.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: { xs: 5, md: 10 }, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
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
                                    <TableCell colSpan={8} align="center" sx={{ py: { xs: 5, md: 10 } }}>
                                        <LinearProgress sx={{ width: '50%', mx: 'auto', borderRadius: 3 }} />
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: '#64748B', fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>RETRIEVING ENCRYPTED RECORDS...</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredResults.length > 0 && (
                    <Box
                        sx={{
                            px: { xs: 2, sm: 3, md: 3 },
                            py: { xs: 2, sm: 2.5, md: 2.5 },
                            borderTop: '1px solid #E2E8F0',
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: { xs: 'center', sm: 'space-between' },
                            alignItems: 'center',
                            gap: { xs: 2, sm: 2, md: 3 },
                            bgcolor: isDark ? '#000000' : '#FFFFFF',
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: isDark ? '#CBD5E1' : '#64748B',
                                fontWeight: 600,
                                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                            }}
                        >
                            Showing {Math.min((page - 1) * pageSize + 1, filteredResults.length)} - {Math.min(page * pageSize, filteredResults.length)} of {filteredResults.length}
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 0.8, sm: 1.2, md: 1.5 },
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                                sx={{
                                    minWidth: { xs: '32px', sm: '36px' },
                                    p: { xs: 0.6, sm: 0.8 },
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    fontWeight: 700,
                                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                                    color: isDark ? '#E2E8F0' : undefined,
                                    '&:disabled': {
                                        opacity: 0.5,
                                    },
                                }}
                            >
                                {'<<'}
                            </Button>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                sx={{
                                    minWidth: { xs: '32px', sm: '36px' },
                                    p: { xs: 0.6, sm: 0.8 },
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    fontWeight: 700,
                                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                                    color: isDark ? '#E2E8F0' : undefined,
                                    '&:disabled': {
                                        opacity: 0.5,
                                    },
                                }}
                            >
                                {'<'}
                            </Button>

                            <Typography
                                sx={{
                                    minWidth: 'max-content',
                                    color: isDark ? '#E2E8F0' : '#0F172A',
                                    fontWeight: 700,
                                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                    px: { xs: 1, sm: 1.5, md: 2 },
                                }}
                            >
                                page {page} of {totalPages}
                            </Typography>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                sx={{
                                    minWidth: { xs: '32px', sm: '36px' },
                                    p: { xs: 0.6, sm: 0.8 },
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    fontWeight: 700,
                                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                                    color: isDark ? '#E2E8F0' : undefined,
                                    '&:disabled': {
                                        opacity: 0.5,
                                    },
                                }}
                            >
                                {'>'}
                            </Button>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setPage(totalPages)}
                                disabled={page === totalPages}
                                sx={{
                                    minWidth: { xs: '32px', sm: '36px' },
                                    p: { xs: 0.6, sm: 0.8 },
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    fontWeight: 700,
                                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                                    color: isDark ? '#E2E8F0' : undefined,
                                    '&:disabled': {
                                        opacity: 0.5,
                                    },
                                }}
                            >
                                {'>>'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default ViewResults;
