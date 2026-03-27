import { Container, Typography, Box, Paper, Grid, Avatar, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Group, 
  Quiz, 
  Assignment, 
  Assessment,
  ArrowForwardIos,
  Shield
} from '@mui/icons-material';

const Dashboard = () => {
    const navigate = useNavigate();

    const menuItems = [
        { 
          title: 'User Management', 
          subtitle: 'Create and authorize students',
          icon: <Group sx={{ fontSize: 32 }} />, 
          path: '/admin/create-user',
          color: '#6366F1'
        },
        { 
          title: 'Question Bank', 
          subtitle: 'Manage MCQ translations',
          icon: <Quiz sx={{ fontSize: 32 }} />, 
          path: '/admin/create-question',
          color: '#8B5CF6'
        },
        { 
          title: 'Test Engineering', 
          subtitle: 'Build and assign evaluations',
          icon: <Assignment sx={{ fontSize: 32 }} />, 
          path: '/admin/create-test',
          color: '#EC4899'
        },
        { 
          title: 'Performance Analytics', 
          subtitle: 'Track student outcomes',
          icon: <Assessment sx={{ fontSize: 32 }} />, 
          path: '/admin/results',
          color: '#10B981'
        },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            {/* Integrated Admin Header */}
            <Box sx={{ 
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
                pt: { xs: 4, md: 8 }, 
                pb: { xs: 12, md: 16 }, 
                color: 'white',
                position: 'relative'
            }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }} />
                
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Shield sx={{ fontSize: 24, mr: 1, color: '#6366F1' }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2, color: '#94A3B8' }}>System Management Console</Typography>
                    </Box>
                    <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: '-2px', mb: 1, fontSize: { xs: '2.5rem', md: '4rem' } }}>
                        Admin Terminal
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 500, maxWidth: 600 }}>
                        Orchestrate secure assessments, manage global questions, and analyze performance data in real-time.
                    </Typography>
                </Container>
            </Box>

            {/* Expansive Grid Section */}
            <Container maxWidth={false} sx={{ mt: -6, px: { xs: 3, md: 6, lg: 10 } }}>
                <Grid container spacing={4}>
                    {menuItems.map((item, index) => (
                        <Grid item xs={12} sm={6} lg={3} key={index}>
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 4, 
                                    height: '100%',
                                    borderRadius: 6, 
                                    border: '1px solid #E2E8F0',
                                    cursor: 'pointer', 
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    position: 'relative',
                                    overflow: 'hidden',
                                    bgcolor: '#FFFFFF',
                                    '&:hover': { 
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                        borderColor: item.color
                                    },
                                    '&:hover .icon-box': {
                                        transform: 'scale(1.1)',
                                        bgcolor: item.color,
                                        color: 'white'
                                    }
                                }}
                                onClick={() => navigate(item.path)}
                            >
                                <Box 
                                    className="icon-box"
                                    sx={{ 
                                        width: 64, 
                                        height: 64, 
                                        borderRadius: 4, 
                                        bgcolor: `${item.color}15`, 
                                        color: item.color,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        mb: 4,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {item.icon}
                                </Box>

                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0F172A' }}>{item.title}</Typography>
                                <Typography variant="body2" sx={{ color: '#64748B', mb: 4, lineHeight: 1.6 }}>{item.subtitle}</Typography>

                                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', color: item.color, fontWeight: 800, fontSize: '0.85rem' }}>
                                    Launch Module <ArrowForwardIos sx={{ fontSize: 12, ml: 1 }} />
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* System Insights (Placeholder for future stats) */}
                <Paper sx={{ mt: 6, p: 4, borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={6}>
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Exams</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>24</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Students</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>1.2k</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Submissions Today</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>156</Typography>
                        </Box>
                    </Stack>
                    <Avatar sx={{ bgcolor: '#F1F5F9', color: '#64748B', width: 48, height: 48 }}>
                        <Assessment />
                    </Avatar>
                </Paper>
            </Container>
        </Box>
    );
};

export default Dashboard;
