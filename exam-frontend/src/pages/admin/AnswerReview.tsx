import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';
import { useSelector } from 'react-redux';
import {
    Box,
    Button,
    Chip,
    Container,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import dayjs from 'dayjs';

type ReviewItem = {
    questionId: number;
    orderIndex: number;
    question_EN: string;
    option1_EN: string;
    option2_EN: string;
    option3_EN: string;
    option4_EN: string;
    correctOption: number;
    selectedOption: number;
    isCorrect: boolean;
};

type ReviewDto = {
    userId: number;
    userName: string;
    testId: number;
    testName: string;
    submittedAt: string;
    score: number;
    totalQuestions: number;
    items: ReviewItem[];
};

const AnswerReview = () => {
    const navigate = useNavigate();
    const { userId, testId } = useParams();
    const themeMode = useSelector((state: any) => state.theme?.mode || 'light');
    const isDark = themeMode === 'dark';

    const parsedUserId = useMemo(() => Number(userId), [userId]);
    const parsedTestId = useMemo(() => Number(testId), [testId]);

    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState<ReviewDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setError(null);
                const res = await adminApi.getAnswerReview(parsedUserId, parsedTestId);
                setReview(res.data);
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to load answer review.';
                setError(message);
                setReview(null);
            } finally {
                setLoading(false);
            }
        };

        if (!Number.isFinite(parsedUserId) || !Number.isFinite(parsedTestId)) {
            setLoading(false);
            return;
        }

        fetch();
    }, [parsedUserId, parsedTestId]);

    const getOptionText = (item: ReviewItem, opt: number) => {
        if (opt === 1) return item.option1_EN;
        if (opt === 2) return item.option2_EN;
        if (opt === 3) return item.option3_EN;
        if (opt === 4) return item.option4_EN;
        return '';
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
                '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableCell-root': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.28) !important' : undefined,
                },
                '& .MuiTableRow-root:hover': {
                    backgroundColor: isDark ? '#111111 !important' : undefined,
                },
            }}
        >
            <Box sx={{ bgcolor: isDark ? '#000000' : '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/admin/results')}
                        sx={{ mb: 2, color: isDark ? '#E2E8F0' : '#64748B', fontWeight: 700 }}
                    >
                        Back to Results
                    </Button>

                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                        Answer Review
                    </Typography>

                    {review && (
                        <Typography sx={{ mt: 1, fontWeight: 700, color: isDark ? '#CBD5E1' : '#475569' }}>
                            {review.userName} • {review.testName} • {review.score} / {review.totalQuestions} • {dayjs(review.submittedAt).format('MMM DD, YYYY [at] HH:mm')}
                        </Typography>
                    )}
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                {loading && (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0' }}>
                        <LinearProgress sx={{ borderRadius: 3 }} />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 700, color: isDark ? '#CBD5E1' : '#64748B' }}>
                            LOADING ANSWER REVIEW...
                        </Typography>
                    </Paper>
                )}

                {!loading && !review && (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0' }}>
                        <Typography sx={{ fontWeight: 700, color: isDark ? '#CBD5E1' : '#64748B' }}>
                            {error ?? 'No review data found.'}
                        </Typography>
                    </Paper>
                )}

                {!loading && review && (
                    <TableContainer
                        component={Paper}
                        elevation={0}
                        sx={{
                            borderRadius: 5,
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead sx={{ bgcolor: isDark ? '#000000' : '#F8FAFC' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', py: 2.5 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>QUESTION</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>SELECTED</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>CORRECT</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>STATUS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {review.items.map((item) => (
                                    <TableRow
                                        key={item.questionId}
                                        sx={{ '&:hover': { bgcolor: isDark ? '#111111' : '#F1F5F9' }, transition: 'background 0.2s' }}
                                    >
                                        <TableCell sx={{ py: 2.5, fontWeight: 900, color: isDark ? '#FFFFFF' : '#334155' }}>{item.orderIndex}</TableCell>
                                        <TableCell sx={{ py: 2.5 }}>
                                            <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>{item.question_EN}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5 }}>
                                            <Typography sx={{ fontWeight: 700, color: isDark ? (item.selectedOption === 0 ? '#CBD5E1' : '#FFFFFF') : (item.selectedOption === 0 ? '#64748B' : '#0F172A') }}>
                                                {item.selectedOption === 0 ? 'Not Answered' : `Option ${item.selectedOption}`}
                                            </Typography>
                                            {item.selectedOption !== 0 && (
                                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>
                                                    {getOptionText(item, item.selectedOption)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5 }}>
                                            <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>{`Option ${item.correctOption}`}</Typography>
                                            <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>
                                                {getOptionText(item, item.correctOption)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 2.5 }}>
                                            {item.selectedOption === 0 ? (
                                                <Chip label="Not Answered" size="small" variant="outlined" sx={{ fontWeight: 900, borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : undefined, color: isDark ? '#FFFFFF' : undefined }} />
                                            ) : item.isCorrect ? (
                                                <Chip label="Correct" size="small" sx={{ fontWeight: 900, bgcolor: isDark ? '#000000' : 'rgba(16, 185, 129, 0.12)', color: isDark ? '#FFFFFF' : '#059669' }} />
                                            ) : (
                                                <Chip label="Wrong" size="small" sx={{ fontWeight: 900, bgcolor: isDark ? '#000000' : 'rgba(239, 68, 68, 0.12)', color: isDark ? '#FFFFFF' : '#DC2626' }} />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </Box>
    );
};

export default AnswerReview;
