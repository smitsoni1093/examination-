import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  Container, Typography, Box, Paper, Button, Radio, RadioGroup, 
  FormControlLabel, FormControl, Grid, Dialog, DialogTitle, DialogActions 
} from '@mui/material';
import type { RootState } from '../../store/store';
import { saveAnswer, clearTest } from '../../store/examSlice';
import { userApi } from '../../api/endpoints';

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  
  const { testName, duration, questions, savedAnswers } = useSelector((state: RootState) => state.exam);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : 3600);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Anti-cheat: Warning on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitting) {
        alert("WARNING: Tab switching is not allowed. Further violations may cancel your exam.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Prevent right click
    const handleContextMenu = (e: any) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [submitting]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const currentQ = questions[currentIdx];
  const lang = i18n.language.toUpperCase(); // EN, HI, GU
  const currentAnswer = savedAnswers[currentQ?.id] || 0;

  const handleOptionSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const optionNo = Number(e.target.value);
    
    // Optimistic UI update
    dispatch(saveAnswer({ questionId: currentQ.id, selectedOption: optionNo }));

    // Auto-save to backend
    try {
      await userApi.submitAnswer({
        testId: Number(testId),
        questionId: currentQ.id,
        selectedOption: optionNo
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleFinalSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await userApi.submitTest({ testId: Number(testId) });
      dispatch(clearTest());
      navigate(`/user/result/${testId}`);
    } catch (err) {
      console.error("Submit failed", err);
      setSubmitting(false);
    }
  }, [submitting, testId, navigate, dispatch]);

  if (!currentQ) return <Typography>Loading test...</Typography>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, userSelect: 'none' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{testName}</Typography>
        <Paper sx={{ p: 1.5, bgcolor: timeLeft < 300 ? 'error.light' : 'primary.light', color: 'white' }}>
          <Typography variant="h6" fontWeight="bold">
            ⏱ {t('timeLeft')}: {formatTime(timeLeft)}
          </Typography>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - Question */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 4, minHeight: 400 }}>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Q{currentIdx + 1}. {(currentQ as any)[`question_${lang}`]}
            </Typography>

            <FormControl component="fieldset">
              <RadioGroup value={currentAnswer || ''} onChange={handleOptionSelect}>
                {[1, 2, 3, 4].map((opt) => (
                  <FormControlLabel 
                    key={opt} value={opt} 
                    control={<Radio size="medium" />} 
                    label={(currentQ as any)[`option${opt}_${lang}`]} 
                    sx={{ mb: 2 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              variant="outlined" 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
            >
              ⟵ {t('previous')}
            </Button>
            
            {currentIdx === questions.length - 1 ? (
              <Button variant="contained" color="error" onClick={() => setConfirmSubmit(true)}>
                {t('submitTest')}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={() => setCurrentIdx(prev => prev + 1)}
              >
                {t('next')} ⟶
              </Button>
            )}
          </Box>
        </Grid>

        {/* Right Side - Question Grid Navigator */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom align="center">Question Navigator</Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {questions.map((q, idx) => {
                const isAnswered = !!savedAnswers[q.id];
                const isActive = idx === currentIdx;
                
                return (
                  <Grid item xs={3} key={q.id}>
                    <Button
                      fullWidth
                      variant={isActive ? "contained" : (isAnswered ? "contained" : "outlined")}
                      color={isActive ? "primary" : (isAnswered ? "success" : "inherit")}
                      sx={{ minWidth: 0, p: 1 }}
                      onClick={() => setCurrentIdx(idx)}
                    >
                      {idx + 1}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
            <Box sx={{ mt: 4, mb: 2 }}>
              <Button fullWidth variant="contained" color="error" onClick={() => setConfirmSubmit(true)}>
                FINISH EXAM
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Are you sure you want to submit the test?</DialogTitle>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button onClick={handleFinalSubmit} variant="contained" color="error" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Yes, Submit Final'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestPage;
