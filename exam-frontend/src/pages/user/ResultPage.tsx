import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const detailItems = result.items ?? [];
  const totalPages = Math.max(1, Math.ceil(detailItems.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return detailItems.slice(start, start + pageSize);
  }, [detailItems, page]);

  return (
    <Container
      maxWidth={false}
      sx={{ mt: { xs: 5, md: 8 }, px: { xs: 2, sm: 3, md: 6, lg: 10 } }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, sm: 4, md: 5 },
          textAlign: "center",
          borderRadius: 4,
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
        }}
      >
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
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 3, overflow: "hidden" }}
              >
                <Table sx={{ minWidth: { xs: "100%", sm: 900 } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                      <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>QUESTION</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>SELECTED</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>CORRECT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        STATUS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedItems.map((item) => (
                      <TableRow
                        key={item.questionId}
                        sx={{
                          "&:hover": { bgcolor: "#F8FAFC" },
                          transition: "background 0.2s",
                        }}
                      >
                        <TableCell sx={{ py: 2.5, fontWeight: 900 }}>
                          {item.orderIndex}
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {item.question_EN}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color:
                                item.selectedOption === 0
                                  ? "text.secondary"
                                  : "text.primary",
                            }}
                          >
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
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Typography sx={{ fontWeight: 700 }}>
                            Option {item.correctOption}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {getOptionText(item, item.correctOption)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2.5 }}>
                          {item.selectedOption === 0 ? (
                            <Chip
                              label="Not Answered"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          ) : item.isCorrect ? (
                            <Chip
                              label="Correct"
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                              }}
                            />
                          ) : (
                            <Chip
                              label="Wrong"
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: "rgba(239, 68, 68, 0.12)",
                                color: "#DC2626",
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {detailItems.length > pageSize && (
                <Box
                  sx={{
                    px: { xs: 1, sm: 2 },
                    py: 2,
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: { xs: "center", sm: "space-between" },
                    alignItems: "center",
                    gap: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    Showing {Math.min((page - 1) * pageSize + 1, detailItems.length)} -{" "}
                    {Math.min(page * pageSize, detailItems.length)} of {detailItems.length}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      sx={{ minWidth: { xs: "32px", sm: "36px" }, fontWeight: 700 }}
                    >
                      {"<<"}
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      sx={{ minWidth: { xs: "32px", sm: "36px" }, fontWeight: 700 }}
                    >
                      {"<"}
                    </Button>

                    <Typography sx={{ fontWeight: 700, px: { xs: 0.5, sm: 1 } }}>
                      page {page} of {totalPages}
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      sx={{ minWidth: { xs: "32px", sm: "36px" }, fontWeight: 700 }}
                    >
                      {">"}
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      sx={{ minWidth: { xs: "32px", sm: "36px" }, fontWeight: 700 }}
                    >
                      {">>"}
                    </Button>
                  </Box>
                </Box>
              )}
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
