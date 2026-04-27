import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Grid, Card, CardContent, Avatar, Stack, Chip, Alert } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
    Assignment, 
        Timeline,
        ArrowForward,
        AccessTime,
        PersonOutline
} from '@mui/icons-material';
import { userApi } from '../../api/endpoints';

const UserDashboard = () => {
    const { t } = useTranslation();
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { name } = useSelector((state: any) => state.auth);
    const themeMode = useSelector((state: any) => state.theme?.mode || 'light');
    const isDark = themeMode === 'dark';
    const formatSubmissionDate = (value: string | Date) => new Intl.DateTimeFormat('en-GB').format(new Date(value));

    useEffect(() => {
        const fetchTests = async () => {
            setError(null);
            try {
                const res = await userApi.getAvailableTests();
                setTests(res.data);
            } catch (err: any) {
                console.error("Failed to fetch available tests.", err);
                const msg = err.response?.data?.message || err.message || t('userDashboard.errorFallback');
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    const completedCount = tests.filter(t => t.isResultPublished).length;
    const pendingCount = tests.filter(t => !t.isResultPublished).length;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                background:
                    isDark
                        ? 'linear-gradient(180deg, #000000 0%, #050505 100%)'
                        : 'radial-gradient(circle at 0% 6%, rgba(45, 212, 191, 0.16), transparent 28%), radial-gradient(circle at 95% 2%, rgba(59, 130, 246, 0.16), transparent 30%), linear-gradient(180deg, #F8FAFC 0%, #EEF6FF 44%, #F9FAFB 100%)',
                color: isDark ? '#FFFFFF' : 'inherit',
                '& .MuiPaper-root, & .MuiCard-root': {
                    backgroundColor: isDark ? '#000000' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiTypography-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiButton-outlined': {
                    backgroundColor: isDark ? 'transparent' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : undefined,
                    color: isDark ? '#E2E8F0' : undefined,
                },
                '& img': {
                    backgroundColor: isDark ? '#020617' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                },
                '@keyframes cardRise': {
                    from: { opacity: 0, transform: 'translateY(12px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
            }}
        >
            <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 6, lg: 10 }, pt: { xs: 2.5, md: 4 }, pb: 8, width: '100%' }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: { xs: 4, md: 6 },
                        overflow: 'hidden',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        boxShadow: '0 26px 48px rgba(15, 23, 42, 0.12)',
                        mb: { xs: 2.5, md: 3.5 },
                        animation: 'cardRise 380ms ease-out',
                    }}
                >
                    <Box
                        sx={{
                            p: { xs: 3, md: 4 },
                            background: 'linear-gradient(140deg, #0B3C49 0%, #0F172A 50%, #1D4ED8 100%)',
                            color: '#F8FAFC',
                            position: 'relative',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'radial-gradient(circle at 10% 20%, rgba(45, 212, 191, 0.22), transparent 28%), radial-gradient(circle at 92% 10%, rgba(147, 197, 253, 0.2), transparent 30%)',
                                pointerEvents: 'none',
                            }}
                        />
                        <Grid container spacing={2.6} alignItems="center" sx={{ position: 'relative' }}>
                            <Grid item xs={12} md={7}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.14)',
                                            width: { xs: 52, md: 62 },
                                            height: { xs: 52, md: 62 },
                                            border: '1px solid rgba(255,255,255,0.24)',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {name?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontWeight: 900,
                                                letterSpacing: '-0.03em',
                                                fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.2rem' },
                                                lineHeight: 1.12,
                                                color: '#FFFFFF',
                                            }}
                                        >
                                            {t('userDashboard.welcomeBack', { name: (name || '').split(' ')[0] || 'User' })}
                                        </Typography>
                                        <Typography sx={{ mt: 0.5, color: '#BFDBFE', maxWidth: 560 }}>
                                            {t('userDashboard.subtitle')}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <Stack direction="row" spacing={1.4} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" rowGap={1.4}>
                                    <Box sx={{ px: 2.2, py: 1.5, borderRadius: 3, minWidth: 120, bgcolor: 'rgba(236, 253, 245, 0.12)', border: '1px solid rgba(167, 243, 208, 0.34)' }}>
                                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#D1FAE5' }}>{completedCount}</Typography>
                                        <Typography sx={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#A7F3D0', letterSpacing: 0.7 }}>{t('userDashboard.finished')}</Typography>
                                    </Box>
                                    <Box sx={{ px: 2.2, py: 1.5, borderRadius: 3, minWidth: 120, bgcolor: 'rgba(219, 234, 254, 0.12)', border: '1px solid rgba(191, 219, 254, 0.35)' }}>
                                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#DBEAFE' }}>{pendingCount}</Typography>
                                        <Typography sx={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#BFDBFE', letterSpacing: 0.7 }}>{t('userDashboard.pending')}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.3, sm: 3, md: 4 },
                        borderRadius: { xs: 4, md: 5 },
                        border: isDark ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid #E2E8F0',
                        boxShadow: isDark ? '0 16px 34px rgba(0, 0, 0, 0.6)' : '0 16px 34px rgba(15, 23, 42, 0.08)',
                        animation: 'cardRise 420ms ease-out',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3.3, gap: 1.4, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Box>
                            <Typography sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                                {t('userDashboard.assignedEvaluations')}
                            </Typography>
                            <Typography sx={{ color: '#64748B', mt: 0.4 }}>
                                {t('userDashboard.portalSubtitle')}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<PersonOutline />}
                            onClick={() => navigate('/user/profile')}
                            sx={{
                                borderRadius: 2.5,
                                textTransform: 'none',
                                fontWeight: 800,
                                px: 2.1,
                                py: 1,
                                borderColor: '#CBD5E1',
                                color: '#0F172A',
                                bgcolor: '#FFFFFF',
                                '&:hover': {
                                    bgcolor: '#F8FAFC',
                                    borderColor: '#94A3B8',
                                },
                            }}
                        >
                            {t('userDashboard.viewProfile')}
                        </Button>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {t('userDashboard.systemConnectivityWarning')}: {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ py: 11, textAlign: 'center' }}>
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                <AccessTime sx={{ fontSize: 18, color: '#475569' }} />
                                <Typography color="text.secondary">{t('userDashboard.loadingSecureSessions')}</Typography>
                            </Stack>
                        </Box>
                    ) : (
                        <>
                            {tests.length === 0 ? (
                                <Box
                                    sx={{
                                        py: 9,
                                        px: 2,
                                        textAlign: 'center',
                                        bgcolor: '#F8FAFC',
                                        borderRadius: 4,
                                        border: '2px dashed #CBD5E1',
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: '#E2E8F0', color: '#64748B', width: 72, height: 72, mx: 'auto', mb: 2.2 }}>
                                        <Assignment sx={{ fontSize: 34 }} />
                                    </Avatar>
                                    <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.35rem' }, fontWeight: 800, color: '#334155', mb: 0.8 }}>
                                        {t('userDashboard.noAssessmentsAssigned')}
                                    </Typography>
                                    <Typography sx={{ color: '#64748B', maxWidth: 520, mx: 'auto', lineHeight: 1.65 }}>
                                        {t('userDashboard.noAssessmentsDescription')}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        sx={{ mt: 3, borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 2.6 }}
                                        onClick={() => window.location.reload()}
                                    >
                                        {t('userDashboard.checkForUpdates')}
                                    </Button>
                                </Box>
                            ) : (
                                <Grid container spacing={{ xs: 1.8, md: 2.2 }}>
                                    {tests.map((test, index) => {
                                        const shouldContinueTest = !!test.hasInProgressAttempt || (test.answeredCount ?? 0) > 0;
                                        return (
                                        <Grid item xs={12} sm={6} lg={4} xl={4} key={test.id} sx={{ display: 'flex' }}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    borderRadius: 4,
                                                    border: `1px solid ${alpha('#1E293B', 0.1)}`,
                                                    bgcolor: '#FFFFFF',
                                                    transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
                                                    animation: 'cardRise 420ms ease-out',
                                                    animationDelay: `${index * 60}ms`,
                                                    animationFillMode: 'both',
                                                    '&:hover': {
                                                        transform: 'translateY(-5px)',
                                                        boxShadow: `0 14px 30px ${alpha(test.isResultPublished ? '#10B981' : test.isSubmitted ? '#F59E0B' : '#2563EB', 0.2)}`,
                                                        borderColor: alpha(test.isResultPublished ? '#10B981' : test.isSubmitted ? '#F59E0B' : '#2563EB', 0.4),
                                                    },
                                                }}
                                            >
                                                <CardContent sx={{ p: 2.4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.2 }}>
                                                        <Box
                                                            sx={{
                                                                width: 44,
                                                                height: 44,
                                                                borderRadius: 2.5,
                                                                bgcolor: alpha(test.isResultPublished ? '#10B981' : test.isSubmitted ? '#F59E0B' : '#2563EB', 0.12),
                                                                color: test.isResultPublished ? '#10B981' : test.isSubmitted ? '#F59E0B' : '#2563EB',
                                                                display: 'grid',
                                                                placeItems: 'center',
                                                            }}
                                                        >
                                                            <Assignment />
                                                        </Box>
                                                        <Chip
                                                            label={
                                                                test.isResultPublished
                                                                    ? t('userDashboard.done')
                                                                    : test.isSubmitted
                                                                        ? t('userDashboard.pendingRelease')
                                                                        : shouldContinueTest
                                                                            ? t('userDashboard.inProgress')
                                                                            : t('userDashboard.takeTest')
                                                            }
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.68rem',
                                                                borderRadius: 1.5,
                                                                color: test.isResultPublished ? '#065F46' : test.isSubmitted ? '#92400E' : shouldContinueTest ? '#0C4A6E' : '#1E3A8A',
                                                                bgcolor: alpha(test.isResultPublished ? '#10B981' : test.isSubmitted ? '#F59E0B' : shouldContinueTest ? '#06B6D4' : '#2563EB', 0.12),
                                                            }}
                                                        />
                                                    </Box>

                                                    {test.testImageUrl && (
                                                        <Box
                                                            component="img"
                                                            src={test.testImageUrl}
                                                            alt={`${test.name} test image`}
                                                            sx={{
                                                                width: '100%',
                                                                height: 176,
                                                                objectFit: 'cover',
                                                                borderRadius: 2.4,
                                                                mb: 1.5,
                                                                border: `1px solid ${alpha('#1E293B', 0.08)}`,
                                                                bgcolor: '#F8FAFC',
                                                            }}
                                                        />
                                                    )}

                                                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', minHeight: '2.9rem', lineHeight: 1.32, mb: 1.4 }}>
                                                        {test.name}
                                                    </Typography>

                                                    {test.description && (
                                                        <Typography
                                                            sx={{
                                                                color: '#475569',
                                                                fontSize: '0.88rem',
                                                                lineHeight: 1.55,
                                                                mb: 1.8,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            {test.description}
                                                        </Typography>
                                                    )}

                                                    <Stack spacing={0.95} sx={{ mb: 2.6 }}>
                                                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: '#64748B' }}>
                                                            <Timeline sx={{ fontSize: 16 }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                {t('userDashboard.questionsAssigned', { count: test.questionCount })}
                                                            </Typography>
                                                        </Stack>
                                                        {(test.answeredCount ?? 0) > 0 || test.hasInProgressAttempt || test.isSubmitted ? (
                                                            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: '#0F766E' }}>
                                                                <Assignment sx={{ fontSize: 16 }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                    {t('userDashboard.mcqProgress', { answered: test.answeredCount || 0, total: test.questionCount })}
                                                                </Typography>
                                                            </Stack>
                                                        ) : null}
                                                        {test.closingAt && (
                                                            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ color: '#92400E' }}>
                                                                <AccessTime sx={{ fontSize: 16 }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                                        {t('userDashboard.lastDateOfSubmission')}: {formatSubmissionDate(test.closingAt)}
                                                                </Typography>
                                                            </Stack>
                                                        )}
                                                    </Stack>

                                                    <Box sx={{ mt: 'auto', pt: 1.8, borderTop: '1px solid #F1F5F9' }}>
                                                        {test.isResultPublished ? (
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                                <Box>
                                                                    <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                                                        {t('userDashboard.yourScore')}
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '1.18rem', fontWeight: 900, color: '#059669' }}>
                                                                        {test.score}/{test.questionCount}
                                                                    </Typography>
                                                                </Box>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() => navigate(`/user/result/${test.id}`)}
                                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                                                >
                                                                    {t('userDashboard.details')}
                                                                </Button>
                                                            </Box>
                                                        ) : test.isSubmitted ? (
                                                            <Box sx={{ borderRadius: 2.5, px: 1.5, py: 1.3, bgcolor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.22)' }}>
                                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: '#B45309' }}>
                                                                    {t('userDashboard.pendingRelease')}
                                                                </Typography>
                                                                <Typography sx={{ mt: 0.35, color: '#92400E', fontSize: '0.9rem', fontWeight: 600 }}>
                                                                    {t('userDashboard.resultLocked')}
                                                                </Typography>
                                                            </Box>
                                                        ) : (
                                                            <Button
                                                                variant="contained"
                                                                fullWidth
                                                                endIcon={<ArrowForward />}
                                                                onClick={() => navigate(shouldContinueTest ? `/user/test/${test.id}` : `/user/instructions/${test.id}`)}
                                                                sx={{
                                                                    py: 1.15,
                                                                    borderRadius: 2.2,
                                                                    textTransform: 'none',
                                                                    fontWeight: 700,
                                                                    background: 'linear-gradient(135deg, #0284C7, #2563EB)',
                                                                    boxShadow: '0 12px 20px rgba(37, 99, 235, 0.2)',
                                                                }}
                                                            >
                                                                {shouldContinueTest ? t('userDashboard.continueTest') : t('userDashboard.enrollNow')}
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )})}
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
