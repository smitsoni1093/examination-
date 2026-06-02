import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  useMediaQuery,
  useTheme,
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
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
  const [questionMapFilter, setQuestionMapFilter] = useState<
    "answered" | "unanswered"
  >("answered");
  const [questionMapPage, setQuestionMapPage] = useState(1);
  const [submitSliderX, setSubmitSliderX] = useState(0);
  const [draggingSubmitSlider, setDraggingSubmitSlider] = useState(false);
  const submitSliderTrackRef = useRef<HTMLDivElement | null>(null);
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);
  const dragStartClientXRef = useRef(0);
  const dragStartSliderXRef = useRef(0);
  const submitKnobSize = 54;
  const questionMapPageSize = 30;

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

  useEffect(() => {
    if (!questions.length) return;

    const params = new URLSearchParams(location.search);
    const qParam = Number(params.get("q"));

    if (Number.isInteger(qParam) && qParam >= 1 && qParam <= questions.length) {
      setSelectedIdx(qParam - 1);
      window.requestAnimationFrame(() => {
        reviewSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [location.search, questions.length]);

  useEffect(() => {
    if (!draggingSubmitSlider) return;

    const getSliderMax = () => {
      const trackWidth = submitSliderTrackRef.current?.clientWidth || 0;
      return Math.max(0, trackWidth - submitKnobSize - 6);
    };

    const onPointerMove = (event: PointerEvent) => {
      const delta = event.clientX - dragStartClientXRef.current;
      const next = dragStartSliderXRef.current + delta;
      const clamped = Math.min(Math.max(next, 0), getSliderMax());
      setSubmitSliderX(clamped);
    };

    const onPointerUp = () => {
      const max = getSliderMax();
      const reachedEnd = max > 0 && submitSliderX >= max * 0.9;
      setDraggingSubmitSlider(false);
      setSubmitSliderX(0);
      if (reachedEnd) {
        setConfirmSubmit(true);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [draggingSubmitSlider, submitSliderX]);

  useEffect(() => {
    const resetSliderOnResize = () => setSubmitSliderX(0);
    window.addEventListener("resize", resetSliderOnResize);
    return () => window.removeEventListener("resize", resetSliderOnResize);
  }, []);

  const currentQuestion = questions[selectedIdx];
  const currentAnswer = currentQuestion
    ? savedAnswers[currentQuestion.id]
    : undefined;

  const counts = questions.reduce(
    (acc, question) => {
      const answer = savedAnswers[question.id];
      if (answer?.status === "answered") {
        acc.answered += 1;
      } else {
        acc.unanswered += 1;
      }
      return acc;
    },
    { answered: 0, unanswered: 0 },
  );

  const filteredQuestions = questions.filter((question) => {
    const answer = savedAnswers[question.id];
    if (questionMapFilter === "answered") {
      return answer?.status === "answered";
    }

    return answer?.status !== "answered";
  });

  const questionMapPageCount = Math.max(
    1,
    Math.ceil(filteredQuestions.length / questionMapPageSize),
  );
  const questionMapStart = (questionMapPage - 1) * questionMapPageSize;
  const questionMapQuestions = filteredQuestions.slice(
    questionMapStart,
    questionMapStart + questionMapPageSize,
  );

  useEffect(() => {
    setQuestionMapPage(1);
  }, [questionMapFilter]);

  useEffect(() => {
    setQuestionMapPage((prev) => Math.min(prev, questionMapPageCount));
  }, [questionMapPageCount]);

  const handleQuestionSelect = useCallback(
    (index: number) => {
      setSelectedIdx(index);
      const answer = savedAnswers[questions[index].id];
      setDraftOption(
        answer?.status === "answered" ? answer.selectedOption || "" : "",
      );

      window.requestAnimationFrame(() => {
        reviewSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [questions, savedAnswers],
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
        <Grid item xs={12} sm={4} md={4}>
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
        <Grid item xs={12} sm={4} md={4}>
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
        <Grid item xs={12} sm={4} md={4}>
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
      </Grid>

      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3.2,
              borderRadius: 4,
              height: "100%",
              minHeight: { lg: 760 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
              Question Map
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              <Chip
                clickable
                size="small"
                label={`Answered (${counts.answered})`}
                color={questionMapFilter === "answered" ? "primary" : "default"}
                variant={
                  questionMapFilter === "answered" ? "filled" : "outlined"
                }
                onClick={() => setQuestionMapFilter("answered")}
                sx={{
                  fontWeight: 700,
                  borderColor: "rgba(16,185,129,0.4)",
                  bgcolor:
                    questionMapFilter === "answered"
                      ? "#2563EB"
                      : isDark
                        ? "rgba(16,185,129,0.16)"
                        : "#ECFDF5",
                  color:
                    questionMapFilter === "answered"
                      ? "#FFFFFF"
                      : isDark
                        ? "#A7F3D0"
                        : "#065F46",
                }}
              />
              <Chip
                clickable
                size="small"
                label={`Unanswered (${counts.unanswered})`}
                color={
                  questionMapFilter === "unanswered" ? "primary" : "default"
                }
                variant={
                  questionMapFilter === "unanswered" ? "filled" : "outlined"
                }
                onClick={() => setQuestionMapFilter("unanswered")}
                sx={{
                  fontWeight: 700,
                  borderColor: "rgba(239,68,68,0.4)",
                  bgcolor:
                    questionMapFilter === "unanswered"
                      ? "#2563EB"
                      : isDark
                        ? "rgba(239,68,68,0.14)"
                        : "#FEF2F2",
                  color:
                    questionMapFilter === "unanswered"
                      ? "#FFFFFF"
                      : isDark
                        ? "#FCA5A5"
                        : "#991B1B",
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 2,
                color: isDark ? "#94A3B8" : "#64748B",
              }}
            >
              Showing {questionMapQuestions.length} of{" "}
              {filteredQuestions.length} questions.
            </Typography>
            <Grid container spacing={0.75}>
              {questionMapQuestions.map((question) => {
                const index = questions.findIndex(
                  (item) => item.id === question.id,
                );
                const answer = savedAnswers[question.id];
                const isSelected = index === selectedIdx;
                const isAnswered = answer?.status === "answered";
                const isSkipped = answer?.status === "skipped";
                const buttonLabel = isAnswered
                  ? `✓ ${index + 1}`
                  : isSkipped
                    ? `S ${index + 1}`
                    : `${index + 1}`;

                return (
                  <Grid item xs={4} sm={3} md={2} key={question.id}>
                    <Button
                      fullWidth
                      onClick={() => handleQuestionSelect(index)}
                      sx={{
                        minWidth: 0,
                        p: 0.55,
                        minHeight: 34,
                        borderRadius: 2,
                        textTransform: "none",
                        alignItems: "center",
                        justifyContent: "center",
                        border: isSelected
                          ? "2px solid #2563EB"
                          : isAnswered
                            ? "1px solid rgba(16, 185, 129, 0.45)"
                            : isSkipped
                              ? "1px solid rgba(245, 158, 11, 0.55)"
                              : "1px solid rgba(239, 68, 68, 0.4)",
                        bgcolor: isSelected
                          ? "#2563EB"
                          : isAnswered
                            ? isDark
                              ? "rgba(16,185,129,0.16)"
                              : "#ECFDF5"
                            : isSkipped
                              ? isDark
                                ? "rgba(245,158,11,0.16)"
                                : "#FFFBEB"
                              : isDark
                                ? "rgba(239,68,68,0.14)"
                                : "#FEF2F2",
                        color: isSelected
                          ? "#FFFFFF"
                          : isAnswered
                            ? isDark
                              ? "#A7F3D0"
                              : "#065F46"
                            : isSkipped
                              ? isDark
                                ? "#FDE68A"
                                : "#92400E"
                              : isDark
                                ? "#FCA5A5"
                                : "#991B1B",
                        boxShadow: isSelected
                          ? "0 12px 24px rgba(37, 99, 235, 0.16)"
                          : "none",
                        fontSize: isMobile ? "0.66rem" : "0.72rem",
                        fontWeight: 700,
                        lineHeight: 1,
                        "&:hover": {
                          bgcolor: isSelected
                            ? "#1D4ED8"
                            : isAnswered
                              ? isDark
                                ? "rgba(16,185,129,0.24)"
                                : "#D1FAE5"
                              : isSkipped
                                ? isDark
                                  ? "rgba(245,158,11,0.22)"
                                  : "#FEF3C7"
                                : isDark
                                  ? "rgba(239,68,68,0.2)"
                                  : "#FEE2E2",
                        },
                      }}
                    >
                      {buttonLabel}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 0.75,
                mt: 2,
                overflowX: "auto",
              }}
            >
              <Button
                size="small"
                variant="outlined"
                onClick={() => setQuestionMapPage(1)}
                disabled={questionMapPage === 1}
                sx={{
                  minWidth: 32,
                  px: 0.6,
                  fontSize: isMobile ? "0.68rem" : "0.72rem",
                  lineHeight: 1,
                  color: isDark ? "#FFFFFF" : undefined,
                  borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : undefined,
                  bgcolor: isDark ? "#000000" : undefined,
                }}
              >
                {"<<"}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  setQuestionMapPage((prev) => Math.max(1, prev - 1))
                }
                disabled={questionMapPage === 1}
                sx={{
                  minWidth: 32,
                  px: 0.6,
                  fontSize: isMobile ? "0.68rem" : "0.72rem",
                  lineHeight: 1,
                  color: isDark ? "#FFFFFF" : undefined,
                  borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : undefined,
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
                  fontSize: isMobile ? "0.68rem" : "0.72rem",
                  color: isDark ? "#FFFFFF" : undefined,
                  whiteSpace: "nowrap",
                }}
              >
                Page {questionMapPage} of {questionMapPageCount}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  setQuestionMapPage((prev) =>
                    Math.min(questionMapPageCount, prev + 1),
                  )
                }
                disabled={questionMapPage === questionMapPageCount}
                sx={{
                  minWidth: 32,
                  px: 0.6,
                  fontSize: isMobile ? "0.68rem" : "0.72rem",
                  lineHeight: 1,
                  color: isDark ? "#FFFFFF" : undefined,
                  borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : undefined,
                  bgcolor: isDark ? "#000000" : undefined,
                }}
              >
                {">"}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setQuestionMapPage(questionMapPageCount)}
                disabled={questionMapPage === questionMapPageCount}
                sx={{
                  minWidth: 32,
                  px: 0.6,
                  fontSize: isMobile ? "0.68rem" : "0.72rem",
                  lineHeight: 1,
                  color: isDark ? "#FFFFFF" : undefined,
                  borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : undefined,
                  bgcolor: isDark ? "#000000" : undefined,
                }}
              >
                {">>"}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper
            ref={reviewSectionRef}
            sx={{
              p: 3.2,
              borderRadius: 4,
              height: "100%",
              minHeight: { lg: 760 },
            }}
          >
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
                onClick={() =>
                  navigate(`/user/test/${testId}?q=${selectedIdx + 1}`)
                }
              >
                Back to Test
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 3,
          border: "1px solid rgba(148, 163, 184, 0.3)",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: isDark ? "#CBD5E1" : "#475569", mb: 1.2 }}
        >
          Slide the round button from left to right to ask for final submit.
        </Typography>

        <Box
          ref={submitSliderTrackRef}
          sx={{
            position: "relative",
            height: 62,
            borderRadius: 999,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
            overflow: "hidden",
            touchAction: "pan-y",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#E2E8F0" : "#334155",
              fontWeight: 700,
              fontSize: "0.9rem",
              letterSpacing: 0.2,
              pointerEvents: "none",
            }}
          >
            Slide to Submit Final Test
          </Box>

          <Box
            role="button"
            aria-label="Slide to submit"
            onPointerDown={(event) => {
              dragStartClientXRef.current = event.clientX;
              dragStartSliderXRef.current = submitSliderX;
              setDraggingSubmitSlider(true);
            }}
            sx={{
              position: "absolute",
              top: 4,
              left: 4,
              width: submitKnobSize,
              height: submitKnobSize,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              transform: `translateX(${submitSliderX}px)`,
              transition: draggingSubmitSlider
                ? "none"
                : "transform 180ms ease",
              bgcolor: "#DC2626",
              color: "#FFFFFF",
              fontWeight: 900,
              boxShadow: "0 10px 24px rgba(220, 38, 38, 0.35)",
              cursor: "grab",
              userSelect: "none",
              touchAction: "none",
            }}
          >
            »
          </Box>
        </Box>
      </Box>

      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Submit test now?</DialogTitle>
        <Box sx={{ px: 3, pb: 1.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            You still have {counts.unanswered} unanswered questions. You can
            submit as-is or go back and review first.
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
