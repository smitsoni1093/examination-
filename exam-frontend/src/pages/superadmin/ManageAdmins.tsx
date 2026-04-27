import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, Paper, Switch, TextField, Typography } from '@mui/material';
import { superAdminApi } from '../../api/endpoints';

type AdminRow = {
  id: number;
  name: string;
  username: string;
  isActive: boolean;
  createdAt?: string;
};

const ManageAdmins = () => {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const canCreate = useMemo(() => name.trim() && username.trim() && password.trim(), [name, username, password]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAdmins();
      const data = (res.data?.value ?? res.data) as AdminRow[];
      setAdmins(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleToggleActive = async (adminId: number, isActive: boolean) => {
    await superAdminApi.setAdminActive(adminId, isActive);
    setAdmins((prev) => prev.map((a) => (a.id === adminId ? { ...a, isActive } : a)));
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreateLoading(true);
    try {
      await superAdminApi.createAdmin({ name, username, password });
      setName('');
      setUsername('');
      setPassword('');
      await load();
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', mb: 3, color: '#0F172A' }}>
        Manage Admins
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontWeight: 800, mb: 2, color: '#0F172A' }}>Create Admin</Typography>

            <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Username" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />

            <Button variant="contained" fullWidth disabled={!canCreate || createLoading} onClick={handleCreate}>
              {createLoading ? 'Creating...' : 'Create Admin'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>Admins</Typography>
              <Button variant="outlined" onClick={load} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>

            {admins.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#475569' }}>
                No admins found.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {admins.map((a) => (
                  <Box
                    key={a.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{a.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {a.username} • Id: {a.id}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: a.isActive ? '#16A34A' : '#DC2626', fontWeight: 800 }}>
                        {a.isActive ? 'ACTIVE' : 'DISABLED'}
                      </Typography>
                      <Switch
                        checked={a.isActive}
                        onChange={(e) => handleToggleActive(a.id, e.target.checked)}
                        inputProps={{ 'aria-label': 'toggle admin active' }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManageAdmins;
