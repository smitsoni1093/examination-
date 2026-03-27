import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../api/endpoints';
import { setTest } from '../../store/examSlice';

const Instructions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await userApi.getTest(Number(testId));
        setTestData(res.data);
        dispatch(setTest(res.data));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading test');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId, dispatch]);

  if (loading) return <Container sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Container>;
  
  if (error) return (
    <Container maxWidth="md" sx={{ mt: 10, textAlign: 'center' }}>
      <Typography variant="h5" color="error">{error}</Typography>
      <Button variant="outlined" sx={{ mt: 3 }} onClick={() => navigate('/user')}>Back to Dashboard</Button>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper sx={{ p: 5 }}>
        <Typography variant="h4" gutterBottom>Instructions: {testData?.name}</Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          Duration: {testData?.duration} Minutes | Total Questions: {testData?.questions.length}
        </Typography>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="body1" paragraph>
            1. The test contains {testData?.questions.length} multiple-choice questions.
          </Typography>
          <Typography variant="body1" paragraph>
            2. You will have exactly {testData?.duration} minutes to complete the test.
          </Typography>
          <Typography variant="body1" paragraph>
            3. <strong>Anti-Cheat Enabled:</strong> Do not refresh the page or switch browser tabs. Doing so will issue a warning.
          </Typography>
          <Typography variant="body1" paragraph>
            4. Your answers are automatically saved when you select an option.
          </Typography>
          <Typography variant="body1" paragraph>
            5. The test will automatically submit when the timer reaches zero.
          </Typography>
        </Box>

        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          fullWidth
          onClick={() => navigate(`/user/test/${testId}`)}
        >
          {t('startTest')}
        </Button>
      </Paper>
    </Container>
  );
};

export default Instructions;
