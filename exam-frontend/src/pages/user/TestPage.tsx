import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid,
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import { ArrowBackRounded } from "@mui/icons-material";
import type { RootState } from "../../store/store";
import {
  saveAnswer,
  clearTest,
  setTest,
  setAttemptId,
  skipAnswer,
} from "../../store/examSlice";
import { userApi } from "../../api/endpoints";

const TestPage = () => {
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

  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [navigatorPage, setNavigatorPage] = useState(1);
  const navigatorPageSize = 20;

  // Load attempt progress on mount / when testId changes
  useEffect(() => {
    const loadAttempt = async () => {
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

        // Jump to last saved index or first unanswered
        const answers = res.data.savedAnswers || {};
        const qs: any[] = res.data.questions || [];
        const lastIdx: number | null = res.data.lastQuestionIndex ?? null;

        if (
          typeof lastIdx === "number" &&
          lastIdx >= 0 &&
          lastIdx < qs.length
        ) {
          setCurrentIdx(lastIdx);
        } else {
          const firstUnanswered = qs.findIndex((q: any) => {
            const answer = answers[q.id];
            return !answer || answer.status !== "answered";
          });
          setCurrentIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
      } catch (err) {
        // If no attempt exists (direct navigation), fall back to legacy test load
        try {
          const legacy = await userApi.getTest(Number(testId));
          dispatch(setTest(legacy.data));
        } catch {
          // ignore
        }
      }
    };

    loadAttempt();
  }, [testId, dispatch]);

  // Anti-cheat: keep right-click prevention only
  useEffect(() => {
    // Prevent right click
    const handleContextMenu = (e: any) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const pageFromIndex = Math.floor(currentIdx / navigatorPageSize) + 1;
    if (pageFromIndex !== navigatorPage) {
      setNavigatorPage(pageFromIndex);
    }
  }, [currentIdx]);

  const currentQ = questions[currentIdx];
  const lang = "EN";
  const currentAnswerEntry = currentQ ? savedAnswers[currentQ.id] : undefined;
  const currentAnswer =
    currentAnswerEntry?.status === "answered"
      ? currentAnswerEntry.selectedOption || 0
      : 0;
  const navigatorPageCount = Math.max(
    1,
    Math.ceil(questions.length / navigatorPageSize),
  );
  const navigatorStart = (navigatorPage - 1) * navigatorPageSize;
  const navigatorQuestions = questions.slice(
    navigatorStart,
    navigatorStart + navigatorPageSize,
  );
  const answerCounts = questions.reduce(
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

  const handleOptionSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const optionNo = Number(e.target.value);

    // Optimistic UI update
    dispatch(saveAnswer({ questionId: currentQ.id, selectedOption: optionNo }));

    try {
      await persistAnswer(currentQ.id, optionNo, currentIdx);
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleSkipQuestion = async () => {
    dispatch(skipAnswer({ questionId: currentQ.id }));

    try {
      await persistAnswer(currentQ.id, 0, currentIdx);
    } catch (err) {
      console.error("Skip save failed", err);
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePreview = () => {
    navigate(`/user/test/${testId}/preview`);
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
  }, [submitting, testId, navigate, dispatch, attemptId]);

  const handleFinishClick = () => {
    setConfirmSubmit(true);
  };

  if (!currentQ) return <Typography>Loading test...</Typography>;

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 4,
        userSelect: "none",
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
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/user")}
          sx={{
            borderRadius: 3,
            px: 2,
            py: 0.8,
            fontWeight: 700,
            fontSize: "0.83rem",
            textTransform: "none",
            borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : "#CBD5E1",
            color: isDark ? "#FFFFFF" : "#334155",
            bgcolor: isDark ? "#000000" : "#FFFFFF",
            "& .MuiButton-startIcon svg": { fontSize: 18 },
            "&:hover": {
              borderColor: isDark ? "#CBD5E1" : "#94A3B8",
              bgcolor: isDark ? "#111111" : "#F8FAFC",
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: isDark ? "#FFFFFF" : undefined }}
          >
            {testName}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: isDark ? "#CBD5E1" : "#475569" }}
          >
            Review unanswered and skipped questions in preview before final
            submission.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - Question */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 4, minHeight: 400 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontSize: "1.08rem",
                lineHeight: 1.4,
                color: isDark ? "#FFFFFF" : undefined,
              }}
            >
              Q{currentIdx + 1}. {(currentQ as any)[`question_${lang}`]}
            </Typography>

            <FormControl component="fieldset">
              <RadioGroup
                value={currentAnswer || ""}
                onChange={handleOptionSelect}
              >
                {[1, 2, 3, 4].map((opt) => (
                  <FormControlLabel
                    key={opt}
                    value={opt}
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: isDark ? "#94A3B8" : undefined,
                          "&.Mui-checked": {
                            color: isDark ? "#FFFFFF" : undefined,
                          },
                        }}
                      />
                    }
                    label={(currentQ as any)[`option${opt}_${lang}`]}
                    sx={{
                      mb: 1.4,
                      px: 1.25,
                      py: 0.9,
                      borderRadius: 2.5,
                      border: isDark
                        ? "1px solid rgba(148, 163, 184, 0.28)"
                        : "1px solid #E2E8F0",
                      bgcolor:
                        currentAnswer === opt
                          ? isDark
                            ? "rgba(255,255,255,0.12)"
                            : "#EFF6FF"
                          : isDark
                            ? "#000000"
                            : "#FFFFFF",
                      transition:
                        "background-color 180ms ease, border-color 180ms ease",
                      "&:hover": {
                        bgcolor: isDark ? "#111111" : "#F8FAFC",
                      },
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.92rem",
                        lineHeight: 1.35,
                        color: isDark ? "#FFFFFF" : "#0F172A",
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                gap: 2,
                mt: 3,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                color="warning"
                onClick={handleSkipQuestion}
                sx={{ fontSize: "0.82rem", py: 0.8 }}
              >
                Skip Question
              </Button>
            </Box>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              sx={{
                fontSize: "0.82rem",
                py: 0.8,
                color: isDark ? "#FFFFFF" : undefined,
                borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : undefined,
                bgcolor: isDark ? "#000000" : undefined,
              }}
            >
              ⟵ Previous
            </Button>

            {currentIdx === questions.length - 1 ? (
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handlePreview}
                  sx={{ fontSize: "0.82rem", py: 0.8 }}
                >
                  Preview Test
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleFinishClick}
                  sx={{ fontSize: "0.82rem", py: 0.8 }}
                >
                  Submit Test
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                sx={{ fontSize: "0.82rem", py: 0.8 }}
              >
                Next ⟶
              </Button>
            )}
          </Box>
        </Grid>

        {/* Right Side - Question Grid Navigator */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              align="center"
              sx={{
                fontSize: "0.86rem",
                fontWeight: 700,
                color: isDark ? "#FFFFFF" : undefined,
              }}
            >
              Question Navigator
            </Typography>

            <Grid container spacing={1} sx={{ mt: 1 }}>
              {navigatorQuestions.map((q, localIdx) => {
                const idx = navigatorStart + localIdx;
                const answerEntry = savedAnswers[q.id];
                const isAnswered = answerEntry?.status === "answered";
                const isSkipped = answerEntry?.status === "skipped";
                const isActive = idx === currentIdx;
                const buttonLabel =
                  isAnswered && !isActive
                    ? `✓ ${idx + 1}`
                    : isSkipped && !isActive
                      ? `S ${idx + 1}`
                      : `${idx + 1}`;

                return (
                  <Grid item xs={3} key={q.id}>
                    <Button
                      fullWidth
                      variant={isActive ? "contained" : "outlined"}
                      sx={{
                        minWidth: 0,
                        p: 0.7,
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor: isDark
                          ? isActive
                            ? "#111111"
                            : isAnswered
                              ? "#000000"
                              : isSkipped
                                ? "rgba(250, 204, 21, 0.16)"
                                : "#000000"
                          : isActive
                            ? "#2563EB"
                            : isAnswered
                              ? "#10B981"
                              : isSkipped
                                ? "#FDE68A"
                                : "#FFFFFF",
                        color: isDark
                          ? "#FFFFFF"
                          : isActive
                            ? "#FFFFFF"
                            : "#0F172A",
                        borderColor: isDark
                          ? isActive
                            ? "#FFFFFF"
                            : isAnswered
                              ? "#10B981"
                              : isSkipped
                                ? "#FACC15"
                                : "rgba(148, 163, 184, 0.45)"
                          : isActive
                            ? "#2563EB"
                            : isAnswered
                              ? "#10B981"
                              : isSkipped
                                ? "#F59E0B"
                                : "#CBD5E1",
                        boxShadow:
                          isDark && isAnswered && !isActive
                            ? "0 0 0 1px rgba(16, 185, 129, 0.55)"
                            : undefined,
                        "&:hover": {
                          bgcolor: isDark
                            ? isActive
                              ? "#1F1F1F"
                              : isAnswered
                                ? "#111111"
                                : isSkipped
                                  ? "rgba(250, 204, 21, 0.22)"
                                  : "#111111"
                            : isActive
                              ? "#1D4ED8"
                              : isAnswered
                                ? "#059669"
                                : isSkipped
                                  ? "#F8D66D"
                                  : "#F8FAFC",
                        },
                      }}
                      onClick={() => setCurrentIdx(idx)}
                    >
                      {buttonLabel}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>

            {navigatorPageCount > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 0.75,
                  mt: 2,
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setNavigatorPage(1)}
                  disabled={navigatorPage === 1}
                  sx={{
                    minWidth: 32,
                    px: 0.6,
                    fontSize: "0.72rem",
                    lineHeight: 1,
                    color: isDark ? "#FFFFFF" : undefined,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.45)"
                      : undefined,
                    bgcolor: isDark ? "#000000" : undefined,
                  }}
                >
                  {"<<"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setNavigatorPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={navigatorPage === 1}
                  sx={{
                    minWidth: 32,
                    px: 0.6,
                    fontSize: "0.72rem",
                    lineHeight: 1,
                    color: isDark ? "#FFFFFF" : undefined,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.45)"
                      : undefined,
                    bgcolor: isDark ? "#000000" : undefined,
                  }}
                >
                  {"<"}
                </Button>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    px: 0.4,
                    fontSize: "0.72rem",
                    color: isDark ? "#FFFFFF" : undefined,
                  }}
                >
                  Page {navigatorPage} of {navigatorPageCount}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setNavigatorPage((prev) =>
                      Math.min(navigatorPageCount, prev + 1),
                    )
                  }
                  disabled={navigatorPage === navigatorPageCount}
                  sx={{
                    minWidth: 32,
                    px: 0.6,
                    fontSize: "0.72rem",
                    lineHeight: 1,
                    color: isDark ? "#FFFFFF" : undefined,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.45)"
                      : undefined,
                    bgcolor: isDark ? "#000000" : undefined,
                  }}
                >
                  {">"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setNavigatorPage(navigatorPageCount)}
                  disabled={navigatorPage === navigatorPageCount}
                  sx={{
                    minWidth: 32,
                    px: 0.6,
                    fontSize: "0.72rem",
                    lineHeight: 1,
                    color: isDark ? "#FFFFFF" : undefined,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.45)"
                      : undefined,
                    bgcolor: isDark ? "#000000" : undefined,
                  }}
                >
                  {">>"}
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 4, mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleFinishClick}
                sx={{ fontSize: "0.8rem", py: 0.95 }}
              >
                FINISH EXAM
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle
          sx={{
            bgcolor: isDark ? "#000000" : undefined,
            color: isDark ? "#FFFFFF" : undefined,
          }}
        >
          Submit without preview?
        </DialogTitle>
        <Box sx={{ px: 3, pb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{ color: isDark ? "#CBD5E1" : "text.secondary" }}
          >
            You have {answerCounts.unanswered} unanswered and{" "}
            {answerCounts.skipped} skipped questions. You can still submit now,
            or cancel and open the preview first.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button
            onClick={handleFinalSubmit}
            variant="contained"
            color="error"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Yes, Submit Final"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestPage;
