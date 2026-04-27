import { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Button, Container, Paper, Stack, Typography, Chip, Grid, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowBack, AssignmentTurnedIn, PendingActions, VerifiedUser } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../api/endpoints';

type UserProfileDto = {
  id: number;
  name: string;
  username: string;
  email: string;
  mobileNumber?: string | null;
  rollNumber?: string | null;
  pincode?: string | null;
  address?: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  preferredLanguage: string;
  createdAt: string;
  classId?: number | null;
  className?: string | null;
  adminId?: number | null;
  adminName?: string | null;
};

const UserProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name, role } = useSelector((state: any) => state.auth);
  const themeMode = useSelector((state: any) => state.theme?.mode || 'light');
  const isDark = themeMode === 'dark';
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, testsRes] = await Promise.all([
          userApi.getProfile(),
          userApi.getAvailableTests(),
        ]);

        setProfile(profileRes.data ?? null);
        setTests(Array.isArray(testsRes.data) ? testsRes.data : []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => ({
    total: tests.length,
    completed: tests.filter((test) => test.isResultPublished).length,
    pending: tests.filter((test) => !test.isResultPublished).length,
  }), [tests]);

  const displayName = profile?.name || name || 'User';
  const displayRole = profile?.role || role || t('user.user');

  const fieldRows = [
    { label: t('profile.userId'), value: profile?.id?.toString() || '-' },
    { label: t('profile.accountName'), value: profile?.name || name || '-' },
    { label: t('profile.username'), value: profile?.username || '-' },
    { label: t('user.email'), value: profile?.email || '-' },
    { label: t('invite.mobileNumber'), value: profile?.mobileNumber || '-' },
    { label: t('invite.rollNumber'), value: profile?.rollNumber || '-' },
    { label: t('class.className'), value: profile?.className || '-' },
    { label: t('invite.address'), value: profile?.address || '-' },
    { label: t('invite.pincode'), value: profile?.pincode || '-' },
    { label: t('profile.accountRole'), value: displayRole },
    { label: t('profile.createdBy'), value: profile?.adminName || '-' },
    { label: t('user.status'), value: profile ? (profile.isActive ? t('user.active') : t('user.inactive')) : '-' },
    { label: t('profile.emailVerified'), value: profile ? (profile.isEmailVerified ? t('common.yes') : t('common.no')) : '-' },
    { label: t('user.createdAt'), value: profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : '-' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark ? 'linear-gradient(180deg, #000000 0%, #050505 100%)' : 'linear-gradient(180deg, #F8FAFC 0%, #EEF6FF 42%, #F9FAFB 100%)',
        pb: 8,
        color: isDark ? '#FFFFFF' : 'inherit',
        '& .MuiPaper-root': {
          backgroundColor: isDark ? '#000000' : undefined,
          borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
          color: isDark ? '#FFFFFF' : undefined,
        },
        '& .MuiTypography-root': {
          color: isDark ? '#FFFFFF' : undefined,
        },
        '& .MuiDivider-root': {
          borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ pt: { xs: 2.5, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/user')}
          sx={{ mb: 2.5, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, color: isDark ? '#E2E8F0' : '#0F172A' }}
        >
          {t('common.back')}
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: { xs: 4, md: 5 },
            border: '1px solid #E2E8F0',
            boxShadow: '0 18px 38px rgba(15, 23, 42, 0.08)',
            mb: 3,
            background: 'linear-gradient(135deg, #0F172A 0%, #1D4ED8 100%)',
            color: '#FFFFFF',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={2.2} alignItems="center">
              <Avatar sx={{ width: { xs: 56, md: 72 }, height: { xs: 56, md: 72 }, bgcolor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 900, fontSize: '1.4rem' }}>
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: { xs: '1.5rem', md: '2.1rem' }, fontWeight: 900, lineHeight: 1.1 }}>
                  {t('profile.myProfile')}
                </Typography>
                <Typography sx={{ color: '#BFDBFE', mt: 0.6 }}>
                  {displayName}
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<VerifiedUser sx={{ fontSize: 16 }} />}
              label={displayRole}
              sx={{
                fontWeight: 800,
                borderRadius: 2,
                color: '#E0F2FE',
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                '& .MuiChip-icon': { color: '#BAE6FD' },
              }}
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2.4, md: 3 }, borderRadius: 4, border: '1px solid #E2E8F0' }}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2.2 }}>
            <VerifiedUser sx={{ color: '#2563EB' }} />
            <Typography sx={{ fontWeight: 900, color: '#0F172A' }}>{t('profile.detailsTitle')}</Typography>
          </Stack>

          <Grid container spacing={1.8}>
            {fieldRows.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.label}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: isDark ? '#000000' : '#F8FAFC', border: isDark ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid #E2E8F0', height: '100%' }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.55 }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ mt: 0.8, fontWeight: 800, color: '#0F172A', wordBreak: 'break-word' }}>
                    {item.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2.2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', height: '100%' }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                  <AssignmentTurnedIn sx={{ color: '#2563EB' }} />
                  <Typography sx={{ fontWeight: 900, color: '#0F172A' }}>{t('profile.assignedTests')}</Typography>
                </Stack>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A' }}>
                  {loading ? '...' : stats.total}
                </Typography>
                <Typography sx={{ color: '#64748B' }}>
                  {t('profile.assignedTestsDescription')}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', height: '100%' }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                  <PendingActions sx={{ color: '#F59E0B' }} />
                  <Typography sx={{ fontWeight: 900, color: '#0F172A' }}>{t('profile.testStatus')}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${t('userDashboard.finished')}: ${stats.completed}`} sx={{ fontWeight: 800, bgcolor: alpha('#10B981', 0.12), color: '#047857' }} />
                  <Chip label={`${t('userDashboard.pending')}: ${stats.pending}`} sx={{ fontWeight: 800, bgcolor: alpha('#F59E0B', 0.14), color: '#B45309' }} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ mt: 3, p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
          <Typography sx={{ fontWeight: 900, color: '#0F172A', mb: 1 }}>
            {t('profile.quickActions')}
          </Typography>
          <Typography sx={{ color: '#64748B', mb: 2.2 }}>
            {t('profile.quickActionsDescription')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" onClick={() => navigate('/user')} sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 800 }}>
              {t('profile.goToDashboard')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default UserProfile;
