import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, Paper, TextField, Typography, List, ListItem, ListItemText, Container } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { adminApi } from '../../api/endpoints';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

type ClassRow = {
  id: number;
  name: string;
  createdAt?: string;
};

type RootState = {
  theme?: {
    mode?: string;
  };
};

const ManageClasses = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const themeMode = useSelector((state: RootState) => state.theme?.mode || 'light');
  const isDark = themeMode === 'dark';
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [name, setName] = useState('');

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getClasses();
      setClasses(res.data as ClassRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreateLoading(true);
    try {
      await adminApi.createClass({ name });
      setName('');
      await load();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await adminApi.deleteClass(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Box
      sx={{
        bgcolor: isDark ? '#000000' : '#F8FAFC',
        color: isDark ? '#FFFFFF' : 'inherit',
        minHeight: 'calc(100vh - 72px)',
        pb: 10,
        '& .MuiPaper-root': {
          backgroundColor: isDark ? '#000000 !important' : undefined,
          color: isDark ? '#FFFFFF !important' : undefined,
          borderColor: isDark ? 'rgba(148, 163, 184, 0.28) !important' : undefined,
        },
        '& .MuiTypography-root, & .MuiButton-root': {
          color: isDark ? '#FFFFFF' : undefined,
        },
        '& .MuiOutlinedInput-root, & .MuiInputBase-root': {
          backgroundColor: isDark ? '#000000 !important' : undefined,
          color: isDark ? '#FFFFFF !important' : undefined,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? 'rgba(148, 163, 184, 0.32) !important' : undefined,
        },
        '& .MuiList-root': {
          backgroundColor: isDark ? '#000000 !important' : undefined,
        },
        '& .MuiListItem-root': {
          borderColor: isDark ? 'rgba(148, 163, 184, 0.28) !important' : undefined,
        },
      }}
    >
      {/* Header Section */}
      <Box sx={{ bgcolor: isDark ? '#000000' : '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: { xs: 2, md: 4 }, mb: { xs: 3, md: 6 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 6, lg: 10 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            sx={{ mb: 2, color: isDark ? '#E2E8F0' : '#64748B', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' } }}
          >
            Back to Dashboard
          </Button>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: '-1px',
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontSize: { xs: '1.5rem', sm: '2.5rem', md: '3rem' },
            }}
          >
            {t('class.managementTitle')}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 6, lg: 10 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Create Class Form */}
          <Grid item xs={12} md={5} lg={4}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3, md: 3 },
                borderRadius: 4,
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              }}
            >
              <Typography sx={{ fontWeight: 800, mb: { xs: 1.5, md: 2 }, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>
                {t('class.createClass')}
              </Typography>
              <TextField
                label={t('class.className')}
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: { xs: 1.5, md: 2 } }}
                size="small"
              />
              <Button
                variant="contained"
                fullWidth
                disabled={!canCreate || createLoading}
                onClick={handleCreate}
                sx={{
                  py: { xs: 1, md: 1.2 },
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                {createLoading ? t('class.creating') : t('common.create')}
              </Button>
            </Paper>
          </Grid>

          {/* Classes List */}
          <Grid item xs={12} md={7} lg={8}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3, md: 3 },
                borderRadius: 4,
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.5, md: 2 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                <Typography sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' } }}>
                  {t('class.classes')}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={load}
                  disabled={loading}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.85rem', md: '0.9rem' },
                    py: { xs: 0.6, sm: 0.8 },
                    px: { xs: 1.5, sm: 2 },
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : undefined,
                    color: isDark ? '#E2E8F0' : undefined,
                  }}
                >
                  {loading ? t('class.refreshing') : t('class.refresh')}
                </Button>
              </Box>

              {classes.length === 0 ? (
                <Typography variant="body2" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                  {t('class.noClasses')}
                </Typography>
              ) : (
                <List sx={{ p: 0, maxHeight: { xs: '300px', sm: '400px', md: '600px' }, overflowY: 'auto' }}>
                  {classes.map((c) => (
                    <ListItem
                      key={c.id}
                      divider
                      secondaryAction={
                        <Button
                          color="error"
                          onClick={() => handleDelete(c.id)}
                          size="small"
                          sx={{
                            fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                            py: { xs: 0.4, sm: 0.5 },
                            px: { xs: 0.8, sm: 1 },
                          }}
                        >
                          {t('common.delete')}
                        </Button>
                      }
                      sx={{
                        py: { xs: 1, sm: 1.5, md: 2 },
                        px: { xs: 1, sm: 1.5, md: 2 },
                        '&:hover': {
                          bgcolor: isDark ? '#111111' : '#F8FAFC',
                        },
                      }}
                    >
                      <ListItemText
                        primary={c.name}
                        secondary={t('class.idLabel', { id: c.id })}
                        primaryTypographyProps={{
                          sx: {
                            fontWeight: 800,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                          },
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            color: isDark ? '#CBD5E1' : '#64748B',
                            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ManageClasses;
