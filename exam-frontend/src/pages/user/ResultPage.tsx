import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import { userApi } from '../../api/endpoints';

const ResultPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPendingRelease, setIsPendingRelease] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsPendingRelease(false);
        const res = await userApi.getResult(Number(testId));
        setResult(res.data);
      } catch (err) {
        console.error("Error fetching result", err);
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setIsPendingRelease(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [testId]);

  if (loading) return <Container sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Container>;
  
  if (!result) return (
    <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
      <Typography variant="h5" color={isPendingRelease ? 'warning.main' : 'error'}>
        {isPendingRelease
          ? 'Your exam is submitted. Result is pending admin release.'
          : 'Result not found or not generated yet.'}
      </Typography>
      <Button variant="contained" sx={{ mt: 3 }} onClick={() => navigate('/user')}>Back to Dashboard</Button>
    </Container>
  );

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const passed = percentage >= 50;

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={4} sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
        <Typography variant="h3" color={passed ? 'success.main' : 'error.main'} gutterBottom>
          {passed ? '🎉 Congratulations!' : '😞 Better Luck Next Time'}
        </Typography>

        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom>
            {result.userName}, your score for <strong>{result.testName}</strong> is:
          </Typography>
          <Typography variant="h2" fontWeight="bold" color="primary">
            {result.score} / {result.totalQuestions}
          </Typography>
          <Typography variant="h5" sx={{ mt: 1, color: 'text.secondary' }}>
            ({percentage}%)
          </Typography>
        </Box>

        <Button variant="outlined" size="large" onClick={() => navigate('/user')} fullWidth>
          Return to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default ResultPage;
