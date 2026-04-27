import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/endpoints';
import type { RootState } from '../../store/store';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const SetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const isDark = useSelector((state: RootState) => state.theme.mode === 'dark');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setError(t('invite.invalidOrMissingToken'));
        setValidating(false);
        return;
      }

      try {
        await authApi.validateInvite(token);
        setInviteValid(true);
      } catch (err: any) {
        const messageKey = err?.response?.data?.messageKey;
        if (messageKey && t(`api.${messageKey}`) !== `api.${messageKey}`) {
          setError(t(`api.${messageKey}`));
        } else {
          setError(t('invite.invalidOrMissingToken'));
        }
        setInviteValid(false);
      } finally {
        setValidating(false);
      }
    };

    validate();
  }, [token, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordRule.test(password)) {
      setError(t('invite.passwordRule'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('invite.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await authApi.setPassword({ token, password });
      setSuccess(t('invite.passwordSetSuccess'));
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      const messageKey = err?.response?.data?.messageKey;
      if (messageKey && t(`api.${messageKey}`) !== `api.${messageKey}`) {
        setError(t(`api.${messageKey}`));
      } else {
        setError(t('invite.passwordSetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'linear-gradient(120deg, #020617 0%, #0F172A 100%)'
          : 'linear-gradient(120deg, #F8FAFC 0%, #EEF2FF 100%)',
        p: 2,
        color: isDark ? '#F8FAFC' : 'inherit',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            background: isDark ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.96) 100%)' : undefined,
            color: isDark ? '#F8FAFC' : undefined,
            border: isDark ? '1px solid rgba(148, 163, 184, 0.18)' : undefined,
          }}
          elevation={4}
        >
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: isDark ? '#F8FAFC' : undefined }}>
            {t('invite.setPasswordTitle')}
          </Typography>
          <Typography variant="body1" color={isDark ? '#CBD5E1' : 'text.secondary'} sx={{ mb: 3 }}>
            {t('invite.setPasswordSubtitle')}
          </Typography>

          {validating ? (
            <Typography>{t('invite.validatingLink')}</Typography>
          ) : !inviteValid ? (
            <Alert severity="error">{error || t('invite.invalidOrMissingToken')}</Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField
                type="password"
                label={t('invite.newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                disabled={loading || !!success}
                InputProps={{
                  sx: {
                    bgcolor: isDark ? '#020617' : undefined,
                    color: isDark ? '#F8FAFC' : undefined,
                    '& fieldset': { borderColor: isDark ? 'rgba(148, 163, 184, 0.28)' : undefined },
                  },
                }}
                InputLabelProps={{ sx: { color: isDark ? '#CBD5E1' : undefined } }}
              />

              <TextField
                type="password"
                label={t('invite.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                disabled={loading || !!success}
                InputProps={{
                  sx: {
                    bgcolor: isDark ? '#020617' : undefined,
                    color: isDark ? '#F8FAFC' : undefined,
                    '& fieldset': { borderColor: isDark ? 'rgba(148, 163, 184, 0.28)' : undefined },
                  },
                }}
                InputLabelProps={{ sx: { color: isDark ? '#CBD5E1' : undefined } }}
              />

              <Typography variant="caption" color={isDark ? '#CBD5E1' : 'text.secondary'}>
                {t('invite.passwordRule')}
              </Typography>

              <Button type="submit" variant="contained" disabled={loading || !!success}>
                {loading ? t('invite.settingPassword') : t('invite.setPasswordAction')}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default SetPassword;
