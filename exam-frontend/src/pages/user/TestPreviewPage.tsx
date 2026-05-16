import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { ArrowBackRounded } from "@mui/icons-material";
import type { RootState } from "../../store/store";
import {
  clearAnswer,
  clearTest,
  saveAnswer,
  setAttemptId,
  setTest,
  skipAnswer,
} from "../../store/examSlice";
import { userApi } from "../../api/endpoints";

const lang = "EN";

const TestPreviewPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMode = useSelector(
    (state: RootState) => state.theme?.mode || "light",
  );
  const isDark = themeMode === "dark";
  const { testName, questions, savedAnswers, attemptId } = useSelector(
    (state: RootState) => state.exam,
  );

  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [draftOption, setDraftOption] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!testId) return;

      try {
        const res = await userApi.getTestAttempt(Number(testId));
        dispatch(
          setTest({
            id: res.data.testId,
            name: res.data.testName,
            testImageUrl: res.data.testImageUrl,
            duration: res.data.duration,
            questions: res.data.questions,
            savedAnswers: res.data.savedAnswers,
            attemptId: res.data.attemptId,
          }),
        );
        dispatch(setAttemptId(res.data.attemptId));
      } catch {
        try {
          const legacy = await userApi.getTest(Number(testId));
          dispatch(setTest(legacy.data));
        } catch {
          // ignore and keep empty state
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [testId, dispatch]);

  useEffect(() => {
    if (!questions.length) return;

    const safeIndex = Math.min(selectedIdx, questions.length - 1);
    setSelectedIdx(safeIndex);
    const answerEntry = savedAnswers[questions[safeIndex].id];
    setDraftOption(
      answerEntry?.status === "answered"
        ? answerEntry.selectedOption || ""
        : "",
    );
  }, [questions, savedAnswers, selectedIdx]);

  const currentQuestion = questions[selectedIdx];
  const currentAnswer = currentQuestion
    ? savedAnswers[currentQuestion.id]
    : undefined;

  const counts = questions.reduce(
    (acc, question) => {
      const answer = savedAnswers[question.id];
      if (answer?.status === "answered") {
        acc.answered += 1;
      } else if (answer?.status === "skipped") {
        acc.skipped += 1;
      } else {
        acc.unanswered += 1;
      }
      return acc;
    },
    { answered: 0, skipped: 0, unanswered: 0 },
  );

  const persistAnswer = useCallback(
    async (
      questionId: number,
      selectedOption: number,
      questionIndex: number,
    ) => {
      if (attemptId) {
        await userApi.saveAttemptAnswer(attemptId, {
          questionId,
          selectedOption,
          lastQuestionIndex: questionIndex,
        });
        return;
      }

      await userApi.submitAnswer({
        testId: Number(testId),
        questionId,
        selectedOption,
      });
    },
    [attemptId, testId],
  );

  const handleSaveAnswer = async () => {
    if (!currentQuestion) return;
    if (draftOption === "" || draftOption === 0) return;

    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        selectedOption: draftOption,
      }),
    );

    try {
      await persistAnswer(currentQuestion.id, draftOption, selectedIdx);
    } catch (err) {
      console.error("Preview save failed", err);
    }
  };

  const handleClearAnswer = async () => {
    if (!currentQuestion) return;

    dispatch(clearAnswer({ questionId: currentQuestion.id }));
    setDraftOption("");

    try {
      await persistAnswer(currentQuestion.id, 0, selectedIdx);
    } catch (err) {
      console.error("Preview clear failed", err);
    }
  };

  const handleSkipQuestion = async () => {
    if (!currentQuestion) return;

    dispatch(skipAnswer({ questionId: currentQuestion.id }));
    setDraftOption("");

    try {
      await persistAnswer(currentQuestion.id, 0, selectedIdx);
    } catch (err) {
      console.error("Preview skip failed", err);
    }
  };

  const handleFinalSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      if (attemptId) {
        await userApi.submitAttempt(attemptId);
      } else {
        await userApi.submitTest({ testId: Number(testId) });
      }
      dispatch(clearTest());
      navigate(`/user/result/${testId}`);
    } catch (err) {
      console.error("Submit failed", err);
      setSubmitting(false);
    }
  }, [submitting, attemptId, testId, navigate, dispatch]);

  if (loading) {
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!questions.length || !currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ mt: 10 }}>
        <Alert severity="warning">No test data is available for preview.</Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 4,
        mb: 4,
        color: isDark ? "#FFFFFF" : "inherit",
        "& .MuiPaper-root": {
          backgroundColor: isDark ? "#000000" : undefined,
          color: isDark ? "#FFFFFF" : undefined,
          borderColor: isDark ? "rgba(148, 163, 184, 0.28)" : undefined,
        },
        "& .MuiButton-root": {
          color: isDark ? "#FFFFFF" : undefined,
        },
        "& .MuiTypography-root": {
          color: isDark ? "#FFFFFF" : undefined,
        },
        "& .MuiFormControlLabel-label": {
          color: isDark ? "#FFFFFF" : undefined,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {testName || "Test Preview"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: isDark ? "#CBD5E1" : "#475569" }}
          >
            Green means answered, red means unanswered, and yellow means
            skipped.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate(`/user/test/${testId}`)}
          sx={{
            borderRadius: 3,
            px: 2,
            py: 1,
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Back to Test
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={3}>
          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Typography
              variant="caption"
              sx={{ color: "#64748B", fontWeight: 700 }}
            >
              Total
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
              {questions.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Paper
            sx={{
              p: 2.2,
              borderRadius: 3,
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "#047857", fontWeight: 700 }}
            >
              Answered
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 0.5, color: "#059669" }}
            >
              {counts.answered}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Paper
            sx={{
              p: 2.2,
              borderRadius: 3,
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "#B91C1C", fontWeight: 700 }}
            >
              Unanswered
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 0.5, color: "#DC2626" }}
            >
              {counts.unanswered}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Paper
            sx={{
              p: 2.2,
              borderRadius: 3,
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "#B45309", fontWeight: 700 }}
            >
              Skipped
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, mt: 0.5, color: "#D97706" }}
            >
              {counts.skipped}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
              Question Map
            </Typography>
            <Grid container spacing={1}>
              {questions.map((question, index) => {
                const answer = savedAnswers[question.id];
                const isSelected = index === selectedIdx;

                return (
                  <Grid item xs={3} sm={2} md={1.5} key={question.id}>
                    <Button
                      fullWidth
                      onClick={() => {
                        setSelectedIdx(index);
                        setDraftOption(
                          answer?.status === "answered"
                            ? answer.selectedOption || ""
                            : "",
                        );
                      }}
                      sx={{
                        minHeight: 56,
                        aspectRatio: "1 / 1",
                        borderRadius: 3,
                        p: 0,
                        textTransform: "none",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? "2px solid #2563EB"
                          : "1px solid rgba(148, 163, 184, 0.35)",
                        bgcolor: isSelected
                          ? "#2563EB"
                          : isDark
                            ? "rgba(255,255,255,0.03)"
                            : "#FFFFFF",
                        color: isSelected
                          ? "#FFFFFF"
                          : isDark
                            ? "#FFFFFF"
                            : "#0F172A",
                        boxShadow: isSelected
                          ? "0 12px 24px rgba(37, 99, 235, 0.16)"
                          : "none",
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        "&:hover": {
                          bgcolor: isSelected
                            ? "#1D4ED8"
                            : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "#F8FAFC",
                        },
                      }}
                    >
                      {index + 1}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3.2, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Review Question
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: isDark ? "#CBD5E1" : "#64748B", mb: 2 }}
            >
              Use the buttons below to save, skip, or clear the selected
              question.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Question ${selectedIdx + 1}`}
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip
                label={
                  currentAnswer?.status === "answered"
                    ? "Answered"
                    : currentAnswer?.status === "skipped"
                      ? "Skipped"
                      : "Unanswered"
                }
                color={
                  currentAnswer?.status === "answered"
                    ? "success"
                    : currentAnswer?.status === "skipped"
                      ? "warning"
                      : "error"
                }
                sx={{ mb: 1 }}
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 3, lineHeight: 1.45 }}>
              {(currentQuestion as any)[`question_${lang}`]}
            </Typography>

            <FormControl component="fieldset" sx={{ width: "100%" }}>
              <RadioGroup
                value={draftOption}
                onChange={(e) => setDraftOption(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((opt) => (
                  <FormControlLabel
                    key={opt}
                    value={opt}
                    control={<Radio />}
                    label={(currentQuestion as any)[`option${opt}_${lang}`]}
                    sx={{
                      mb: 1.2,
                      px: 1.2,
                      py: 0.8,
                      borderRadius: 2,
                      border: "1px solid rgba(148, 163, 184, 0.28)",
                      bgcolor:
                        draftOption === opt
                          ? isDark
                            ? "rgba(255,255,255,0.08)"
                            : "#EFF6FF"
                          : "transparent",
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.92rem",
                        lineHeight: 1.45,
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSaveAnswer}
                disabled={draftOption === ""}
              >
                Save Answer
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleSkipQuestion}
              >
                Skip
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleClearAnswer}
              >
                Clear
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/user/test/${testId}`)}
              >
                Back to Test
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setConfirmSubmit(true)}
              >
                Submit Test
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit test now?</DialogTitle>
        <Box sx={{ px: 3, pb: 1.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            You still have {counts.unanswered} unanswered and {counts.skipped}{" "}
            skipped questions. You can submit as-is or go back and review first.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmSubmit(false)}>Go Back</Button>
          <Button
            onClick={handleFinalSubmit}
            variant="contained"
            color="error"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Anyway"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestPreviewPage;
