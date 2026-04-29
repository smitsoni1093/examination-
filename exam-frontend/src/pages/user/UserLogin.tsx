import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowForward, CheckCircleOutline, Login, PhoneIphone, Shield, School, Bolt } from '@mui/icons-material';
import { authApi, type OtpAccountOption } from '../../api/endpoints';
import { loginSuccess } from '../../store/authSlice';
import type { RootState } from '../../store/store';

const normalizeMobile = (value: string) => value.replace(/\D/g, '').slice(-10);

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isDark = useSelector((state: RootState) => state.theme.mode === 'dark');

  const [mobileNumber, setMobileNumber] = useState('');
  const [accounts, setAccounts] = useState<OtpAccountOption[]>([]);
  const [selectionToken, setSelectionToken] = useState('');
  const [lookupComplete, setLookupComplete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const pageBackground = isDark
    ? 'radial-gradient(circle at 0% 12%, rgba(56, 189, 248, 0.12), transparent 26%), radial-gradient(circle at 92% 6%, rgba(99, 102, 241, 0.18), transparent 34%), linear-gradient(155deg, #020617 0%, #050816 48%, #09090b 100%)'
    : 'radial-gradient(circle at 0% 12%, rgba(14, 165, 233, 0.18), transparent 26%), radial-gradient(circle at 92% 6%, rgba(99, 102, 241, 0.2), transparent 34%), linear-gradient(155deg, #F8FAFC 0%, #EEF2FF 48%, #E0F2FE 100%)';

  const paperBackground = isDark
    ? 'linear-gradient(180deg, rgba(2, 6, 23, 0.96) 0%, rgba(15, 23, 42, 0.94) 100%)'
    : '#FFFFFF';

  const sidePanelBackground = isDark
    ? 'linear-gradient(150deg, #020617 0%, #0F172A 55%, #1E1B4B 100%)'
    : 'linear-gradient(150deg, #082F49 0%, #0F172A 55%, #1E1B4B 100%)';

  const fieldBackground = isDark ? '#020617' : '#F8FAFC';
  const fieldBorder = alpha(isDark ? '#94A3B8' : '#1E293B', isDark ? 0.32 : 0.16);

  const maskedMobile = useMemo(() => {
    if (mobileNumber.length !== 10) return mobileNumber;
    return `******${mobileNumber.slice(-4)}`;
  }, [mobileNumber]);

  const mapError = (err: any) => {
    const messageKey = err?.response?.data?.messageKey;
    if (messageKey && t(`api.${messageKey}`) !== `api.${messageKey}`) {
      return t(`api.${messageKey}`);
    }

    return err?.response?.data?.message || err?.message || t('api.ERROR_UNKNOWN');
  };

  const handleLookupMobile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalized = normalizeMobile(mobileNumber);
    if (normalized.length !== 10) {
      setError(t('auth.mobileInvalid'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.lookupMobile(normalized);
      const nextAccounts = res.data.accounts ?? [];

      setMobileNumber(normalized);
      setAccounts(nextAccounts);
      setSelectionToken(res.data.selectionToken ?? '');
      setLookupComplete(true);

      if (res.data.login) {
        dispatch(loginSuccess(res.data.login));
        if (res.data.login.role === 'SuperAdmin') {
          navigate('/superadmin');
        } else if (res.data.login.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
        return;
      }

      setSuccess(nextAccounts.length > 0 ? t('auth.selectAccountPrompt') : t('auth.findAccount'));
    } catch (err: any) {
      setError(mapError(err));
      setAccounts([]);
      setSelectionToken('');
      setLookupComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (userId: number) => {
    if (!selectionToken) return;

    setError('');
    setLoading(true);
    try {
      const res = await authApi.completeOtpSelection({ selectionToken, userId });
      dispatch(loginSuccess(res.data));

      if (res.data.role === 'SuperAdmin') {
        navigate('/superadmin');
      } else if (res.data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err: any) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (loading) return;
    setAccounts([]);
    setSelectionToken('');
    setLookupComplete(false);
    setSuccess('');
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100dvh - 64px)', md: 'calc(100dvh - 72px)' },
        width: '100%',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        px: { xs: 1.5, sm: 2.5, md: 4 },
        pt: { xs: 2.5, md: 4 },
        pb: 'max(28px, env(safe-area-inset-bottom))',
        background: pageBackground,
        '@keyframes riseFade': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 4, md: 6 },
            border: isDark ? '1px solid rgba(148, 163, 184, 0.18)' : '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: isDark ? '0 28px 64px rgba(0, 0, 0, 0.5)' : '0 24px 54px rgba(15, 23, 42, 0.14)',
            background: paperBackground,
            animation: 'riseFade 420ms ease-out',
          }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.06fr 1fr' } }}>
            <Box
              sx={{
                p: { xs: 3, sm: 4, md: 5 },
                background: sidePanelBackground,
                color: '#F1F5F9',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(circle at 80% 15%, rgba(125, 211, 252, 0.2), transparent 28%), radial-gradient(circle at 10% 95%, rgba(129, 140, 248, 0.22), transparent 32%)',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ position: 'relative' }}>
                <Chip
                  icon={<Shield sx={{ fontSize: 16 }} />}
                  label={t('auth.mobileLogin')}
                  sx={{
                    mb: 2.2,
                    color: '#BAE6FD',
                    border: '1px solid rgba(186, 230, 253, 0.35)',
                    bgcolor: 'rgba(2, 132, 199, 0.16)',
                    '& .MuiChip-icon': { color: '#7DD3FC' },
                  }}
                />

                <Typography
                  component="h2"
                  sx={{
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    fontSize: { xs: '1.8rem', sm: '2.2rem' },
                    color: '#FFFFFF',
                    maxWidth: 520,
                  }}
                >
                  {t('auth.mobileLogin')}
                </Typography>

                <Typography sx={{ mt: 2, color: 'rgba(241, 245, 249, 0.86)', lineHeight: 1.75, maxWidth: 470 }}>
                  {t('auth.enterMobileToViewAccounts')}
                </Typography>

                <Stack spacing={1.1} sx={{ mt: 4.5 }}>
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <CheckCircleOutline sx={{ color: '#7DD3FC', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(241, 245, 249, 0.82)', maxWidth: 360 }}>
                      {t('auth.mobileLoginHint1')}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <CheckCircleOutline sx={{ color: '#7DD3FC', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(241, 245, 249, 0.82)', maxWidth: 360 }}>
                      {t('auth.mobileLoginHint2')}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <CheckCircleOutline sx={{ color: '#7DD3FC', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(241, 245, 249, 0.82)', maxWidth: 360 }}>
                      {t('auth.mobileLoginHint3')}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.2} sx={{ mt: 4.5, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<School sx={{ fontSize: 16 }} />}
                    label={t('auth.mobileFirst')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#E2E8F0', '& .MuiChip-icon': { color: '#C4B5FD' } }}
                  />
                  <Chip
                    icon={<Bolt sx={{ fontSize: 16 }} />}
                    label={t('auth.chooseAccountToLogin')}
                    sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#E2E8F0', '& .MuiChip-icon': { color: '#FDE68A' } }}
                  />
                </Stack>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, bgcolor: paperBackground }}>
              <Stack spacing={3}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Box component="form" onSubmit={handleLookupMobile}>
                  <Stack spacing={2.25}>
                    <TextField
                      label={t('auth.mobileNumber')}
                      placeholder="9876543210"
                      inputMode="numeric"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(normalizeMobile(e.target.value))}
                      fullWidth
                      disabled={loading || lookupComplete}
                      helperText={lookupComplete ? t('auth.selectAccountPrompt') : t('auth.enterMobileToViewAccounts')}
                      InputProps={{
                        startAdornment: <PhoneIphone sx={{ color: isDark ? '#94A3B8' : '#1D4ED8', mr: 1 }} />,
                        sx: {
                          bgcolor: fieldBackground,
                          borderRadius: 3,
                          '& fieldset': { borderColor: fieldBorder },
                        },
                      }}
                      InputLabelProps={{ sx: { color: isDark ? '#CBD5E1' : '#334155' } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                        sx={{
                          flex: 1,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 800,
                          letterSpacing: '0.01em',
                          background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
                          boxShadow: '0 18px 30px rgba(79, 70, 229, 0.24)',
                        }}
                      >
                        {t('auth.findAccount')}
                      </Button>

                      {lookupComplete && (
                        <Button
                          type="button"
                          variant="outlined"
                          size="large"
                          onClick={handleReset}
                          disabled={loading}
                          sx={{
                            py: 1.45,
                            borderRadius: 3,
                            fontWeight: 800,
                            borderColor: fieldBorder,
                            color: isDark ? '#E2E8F0' : '#1E293B',
                          }}
                        >
                          {t('auth.changeMobile')}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>

                {lookupComplete && accounts.length > 0 && (
                  <Box sx={{ pt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 800, color: isDark ? '#E2E8F0' : '#0F172A', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {t('auth.selectAccountTitle')}
                    </Typography>
                    <Stack spacing={1.5}>
                      {accounts.map((account) => (
                        <Card
                          key={account.userId}
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.22)',
                            background: isDark ? 'rgba(2, 6, 23, 0.95)' : '#FFFFFF',
                          }}
                        >
                          <CardContent sx={{ p: { xs: 1.8, sm: 2.25 }, '&:last-child': { pb: { xs: 1.8, sm: 2.25 } } }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.2, sm: 1.5 }} alignItems={{ xs: 'stretch', sm: 'flex-start' }} justifyContent="space-between">
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '0.95rem', sm: '1rem' }, overflowWrap: 'break-word' }}>{account.name}</Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.85rem' }, overflowWrap: 'break-word' }}>
                                  {account.role}{account.className ? ` • ${account.className}` : ''}
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.85rem' }, overflowWrap: 'break-word' }}>
                                  {t('auth.username')}: {account.username || t('common.noData')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mt: 0.6, fontSize: { xs: '0.8rem', sm: '0.85rem' }, overflowWrap: 'break-word' }}>
                                  {t('user.email')}: {account.email || t('common.noData')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mt: 0.8, fontSize: { xs: '0.75rem', sm: '0.8rem' }, overflowWrap: 'break-word' }}>
                                  {t('auth.mobileNumber')}: {account.mobileNumber || maskedMobile}
                                </Typography>
                              </Box>

                              <Button
                                variant="contained"
                                startIcon={<Login />}
                                onClick={() => handleSelectAccount(account.userId)}
                                disabled={loading}
                                sx={{
                                  alignSelf: { xs: 'flex-start', sm: 'center' },
                                  whiteSpace: { xs: 'normal', sm: 'nowrap' },
                                  width: { xs: '100%', sm: 'auto' },
                                  minHeight: 40,
                                  borderRadius: 2.5,
                                  fontWeight: 800,
                                  px: { xs: 1.5, sm: 2.25 },
                                  py: { xs: 0.8, sm: 1 },
                                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                  background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 100%)',
                                }}
                              >
                                {t('auth.loginWithThisAccount')}
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}

                {lookupComplete && accounts.length === 0 && !loading && (
                  <Alert severity="info">{t('auth.selectAccountDescription')}</Alert>
                )}
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default UserLogin;
