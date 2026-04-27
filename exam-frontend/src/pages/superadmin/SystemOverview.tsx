import { useEffect, useState } from 'react';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import { superAdminApi } from '../../api/endpoints';

const SystemOverview = () => {
  const [counts, setCounts] = useState({ users: 0, tests: 0, results: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, testsRes, resultsRes] = await Promise.all([
        superAdminApi.getUsers(),
        superAdminApi.getTests(),
        superAdminApi.getResults(),
      ]);

      const users = (usersRes.data?.value ?? usersRes.data) as any[];
      const tests = (testsRes.data?.value ?? testsRes.data) as any[];
      const results = (resultsRes.data?.value ?? resultsRes.data) as any[];

      setCounts({
        users: Array.isArray(users) ? users.length : 0,
        tests: Array.isArray(tests) ? tests.length : 0,
        results: Array.isArray(results) ? results.length : 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', color: '#0F172A' }}>
          System Overview
        </Typography>
        <Button variant="outlined" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              USERS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A' }}>
              {counts.users}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              TESTS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A' }}>
              {counts.tests}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
              RESULTS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0F172A' }}>
              {counts.results}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="body2" sx={{ color: '#475569', mt: 3 }}>
        This page is a lightweight overview. If you want, I can expand it with tables for Users/Tests/Results.
      </Typography>
    </Box>
  );
};

export default SystemOverview;
