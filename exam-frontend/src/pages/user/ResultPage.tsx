import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Grid,
} from "@mui/material";
import axios from "axios";
import { userApi } from "../../api/endpoints";

type ResultReviewItem = {
  questionId: number;
  orderIndex: number;
  question_EN: string;
  option1_EN: string;
  option2_EN: string;
  option3_EN: string;
  option4_EN: string;
  correctOption: number;
  selectedOption: number;
  isCorrect: boolean;
};

type ResultResponse = {
  userId: number;
  userName: string;
  testId: number;
  testName: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  isPublished?: boolean;
  showDetailedAnswers?: boolean;
  publishedAt?: string | null;
  items?: ResultReviewItem[] | null;
};

const ResultPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultResponse | null>(null);
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

  if (loading)
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );

  if (!result)
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
        <Typography
          variant="h5"
          color={isPendingRelease ? "warning.main" : "error"}
        >
          {isPendingRelease
            ? "Your exam is submitted. Result is pending admin release."
            : "Result not found or not generated yet."}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => navigate("/user")}
        >
          Back to Dashboard
        </Button>
      </Container>
    );

  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const passed = percentage >= 50;

  const getOptionText = (item: ResultReviewItem, opt: number) => {
    if (opt === 1) return item.option1_EN;
    if (opt === 2) return item.option2_EN;
    if (opt === 3) return item.option3_EN;
    if (opt === 4) return item.option4_EN;
    return "";
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={4} sx={{ p: 5, textAlign: "center", borderRadius: 4 }}>
        <Typography
          variant="h3"
          color={passed ? "success.main" : "error.main"}
          gutterBottom
        >
          {passed ? "🎉 Congratulations!" : "😞 Better Luck Next Time"}
        </Typography>

        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom>
            {result.userName}, your score for <strong>{result.testName}</strong>{" "}
            is:
          </Typography>
          <Typography variant="h2" fontWeight="bold" color="primary">
            {result.score} / {result.totalQuestions}
          </Typography>
          <Typography variant="h5" sx={{ mt: 1, color: "text.secondary" }}>
            ({percentage}%)
          </Typography>
        </Box>

        {result.showDetailedAnswers &&
          result.items &&
          result.items.length > 0 && (
            <Box sx={{ mt: 4, textAlign: "left" }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                Detailed Answer Review
              </Typography>
              <Grid container spacing={2}>
                {result.items.map((item) => (
                  <Grid item xs={12} key={item.questionId}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2.2, borderRadius: 3, textAlign: "left" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "wrap",
                          mb: 1.2,
                        }}
                      >
                        <Typography sx={{ fontWeight: 800 }}>
                          Q{item.orderIndex}. {item.question_EN}
                        </Typography>
                        <Chip
                          size="small"
                          label={item.isCorrect ? "Correct" : "Wrong"}
                          color={item.isCorrect ? "success" : "error"}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      <Grid container spacing={1.2}>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", fontWeight: 700 }}
                          >
                            Your Answer
                          </Typography>
                          <Typography sx={{ fontWeight: 700 }}>
                            {item.selectedOption === 0
                              ? "Not Answered"
                              : `Option ${item.selectedOption}`}
                          </Typography>
                          {item.selectedOption !== 0 && (
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary" }}
                            >
                              {getOptionText(item, item.selectedOption)}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", fontWeight: 700 }}
                          >
                            Correct Answer
                          </Typography>
                          <Typography sx={{ fontWeight: 700 }}>
                            Option {item.correctOption}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            {getOptionText(item, item.correctOption)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate("/user")}
          fullWidth
          sx={{ mt: 4 }}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default ResultPage;
