import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F8FAFC', minHeight: 'calc(100vh - 72px)' }}>
      <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', mb: 3, color: '#0F172A' }}>
        SuperAdmin Console
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A' }}>Manage Admins</Typography>
            <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
              Create and manage Admin accounts.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/superadmin/admins')}>
              Open
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F172A' }}>System Data</Typography>
            <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
              View all users, tests, and results.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/superadmin/system')}>
              View
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboard;
