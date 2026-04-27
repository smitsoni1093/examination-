import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../api/endpoints';
import { setTest } from '../../store/examSlice';

const Instructions = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const formatSubmissionDate = (value: string | Date) => new Intl.DateTimeFormat('en-GB').format(new Date(value));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testData, setTestData] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResultPublished, setIsResultPublished] = useState(false);

  const instructionLines = Array.isArray(testData?.instructions)
    ? [...testData.instructions].sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    : [];

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const [testRes, statusRes] = await Promise.all([
          userApi.getTest(Number(testId)),
          userApi.getAvailableTests(),
        ]);

        setTestData(testRes.data);
        dispatch(setTest(testRes.data));

        const currentStatus = (statusRes.data || []).find((t: any) => t.id === Number(testId));
        setIsSubmitted(!!currentStatus?.isSubmitted);
        setIsResultPublished(!!currentStatus?.isResultPublished);
      } catch (err: any) {
        setError(err.response?.data?.message || t('userInstructions.errorLoadingTest'));
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId, dispatch, t]);

  if (loading) return <Container sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Container>;
  
  if (error) return (
    <Container maxWidth="md" sx={{ mt: 10, textAlign: 'center' }}>
      <Typography variant="h5" color="error">{error}</Typography>
      <Button
        variant="outlined"
        startIcon={<ArrowBackRounded />}
        sx={{
          mt: 3,
          borderRadius: 3,
          px: 2,
          py: 1,
          fontWeight: 700,
          borderColor: '#CBD5E1',
          color: '#334155',
          '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
        }}
        onClick={() => navigate('/user')}
      >
        {t('userInstructions.backToDashboard')}
      </Button>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper sx={{ p: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ mb: 0 }}>
            {t('userInstructions.title', { name: testData?.name })}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRounded />}
            onClick={() => navigate('/user')}
            sx={{
              borderRadius: 3,
              px: 2,
              py: 1,
              fontWeight: 700,
              borderColor: '#CBD5E1',
              color: '#334155',
              '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' },
            }}
          >
            {t('userInstructions.backToDashboard')}
          </Button>
        </Box>
        <Typography variant="h6" color="primary" gutterBottom>
          Total Questions: {testData?.questions.length}
        </Typography>

        {testData?.description && (
          <Typography
            variant="body1"
            sx={{
              mt: 1,
              color: '#334155',
              whiteSpace: 'pre-line',
              lineHeight: 1.8,
              fontWeight: 500,
            }}
          >
            {testData.description}
          </Typography>
        )}

        {testData?.closingAt && (
          <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 700, mb: 1 }}>
            Last Date of Submission: {formatSubmissionDate(testData.closingAt)}
          </Typography>
        )}

        <Box sx={{ mt: 4, mb: 4 }}>
          {instructionLines.length > 0 ? (
            instructionLines.map((item: any, index: number) => (
              <Typography key={item.id ?? index} variant="body1" paragraph>
                {index + 1}. {item.text}
              </Typography>
            ))
          ) : (
            <Typography variant="body1" paragraph>
              No test-specific instructions were configured for this test.
            </Typography>
          )}
        </Box>

        {isSubmitted && (
          <Alert severity={isResultPublished ? 'success' : 'info'} sx={{ mb: 2 }}>
            {isResultPublished
              ? t('userInstructions.resultReleasedInfo')
              : t('userInstructions.resultPendingReleaseInfo')}
          </Alert>
        )}

        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          fullWidth
          disabled={isSubmitted}
          onClick={async () => {
            try {
              const startRes = await userApi.startTestAttempt(Number(testId));
              dispatch(setTest({ ...testData, attemptId: startRes.data.attemptId }));
              navigate(`/user/test/${testId}`);
            } catch (err: any) {
              const message = err.response?.data?.message || '';
              if (String(message).toLowerCase().includes('already submitted')) {
                navigate(`/user/result/${testId}`);
                return;
              }
              setError(message || t('userInstructions.unableToStartTest'));
            }
          }}
        >
          {isSubmitted
            ? (isResultPublished ? t('userInstructions.viewResult') : t('userInstructions.submittedPendingRelease'))
            : t('test.startTest')}
        </Button>

        {isSubmitted && (
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            fullWidth
            onClick={() => navigate(`/user/result/${testId}`)}
          >
            {t('userInstructions.goToResult')}
          </Button>
        )}
      </Paper>
    </Container>
  );
};

export default Instructions;
