import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, Paper, TextField, Typography, List, ListItem, ListItemText } from '@mui/material';
import { adminApi } from '../../api/endpoints';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type ClassRow = {
  id: number;
  name: string;
  createdAt?: string;
};

const ManageClasses = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      <Button
        onClick={() => navigate('/admin')}
        sx={{ mb: 1, color: '#64748B', fontWeight: 700 }}
      >
        Back to Dashboard
      </Button>
      <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', mb: 3, color: '#0F172A' }}>
        {t('class.managementTitle')}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontWeight: 800, mb: 2, color: '#0F172A' }}>{t('class.createClass')}</Typography>
            <TextField label={t('class.className')} fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
            <Button variant="contained" fullWidth disabled={!canCreate || createLoading} onClick={handleCreate}>
              {createLoading ? t('class.creating') : t('common.create')}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('class.classes')}</Typography>
              <Button variant="outlined" onClick={load} disabled={loading}>
                {loading ? t('class.refreshing') : t('class.refresh')}
              </Button>
            </Box>

            {classes.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {t('class.noClasses')}
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {classes.map((c) => (
                  <ListItem
                    key={c.id}
                    divider
                    secondaryAction={
                      <Button color="error" onClick={() => handleDelete(c.id)}>
                        {t('common.delete')}
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={c.name}
                      secondary={t('class.idLabel', { id: c.id })}
                      primaryTypographyProps={{ sx: { fontWeight: 800, color: '#0F172A' } }}
                      secondaryTypographyProps={{ sx: { color: '#64748B' } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManageClasses;
