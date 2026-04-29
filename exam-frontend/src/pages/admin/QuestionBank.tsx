import { useState, useEffect, useCallback } from "react";
import type { RootState } from "../../store/store";
import {
  Container,
  Typography,
  Box,
  Paper,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  Button,
} from "@mui/material";
import {
  Search,
  Delete,
  Visibility,
  Storage,
  Refresh,
  ArrowBack,
} from "@mui/icons-material";
import { adminApi } from "../../api/endpoints";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

type SourceFileSummary = {
  sourceFileName: string;
  totalQuestions: number;
  usedQuestions: number;
  canSoftDelete: boolean;
  lastImportedAt: string;
};

type MessageState = {
  type: "success" | "error" | "warning" | "info" | "";
  text: string;
};

type Question = {
  id: number;
  question_EN: string;
  sourceFileName?: string;
  createdAt: string;
};

const QuestionBank = () => {
  const navigate = useNavigate();
  const themeMode = useSelector(
    (state: RootState) => state.theme?.mode || "light",
  );
  const isDark = themeMode === "dark";
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFileSummary[]>([]);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionPageSize] = useState(20);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  const fetchQuestionsPage = useCallback(
    async (page: number, source: string, search: string) => {
      const safePage = Math.max(page, 1);
      const skip = (safePage - 1) * questionPageSize;
      const sourceParam = source === "All Sources" ? "" : source;

      const res = await adminApi.getQuestionsPaged(
        sourceParam,
        search,
        skip,
        questionPageSize,
      );
      const items = Array.isArray(res.data?.items)
        ? (res.data.items as Question[])
        : Array.isArray(res.data)
          ? (res.data as Question[])
          : [];
      const totalCount =
        typeof res.data?.totalCount === "number"
          ? res.data.totalCount
          : items.length;

      setQuestions(items);
      setTotalQuestions(totalCount);
      setSelectedIds([]);

      if (safePage > 1 && items.length === 0 && totalCount > 0) {
        setQuestionPage(safePage - 1);
        return;
      }

      setQuestionPage(safePage);
    },
    [questionPageSize],
  );

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      const sRes = await adminApi.getQuestionSources();
      setSources((sRes.data ?? []).filter((s: string | null) => s !== null));

      await fetchQuestionsPage(1, sourceFilter, searchTerm);

      try {
        const sfRes = await adminApi.getQuestionSourceFiles();
        setSourceFiles(sfRes.data ?? []);
      } catch (sourceError: unknown) {
        // Keep Question Bank usable even if source-file API is unavailable.
        console.error(sourceError);
        setSourceFiles([]);
        setMessage({
          type: "error",
          text: "Imported source files could not be loaded. Please restart backend and refresh.",
        });
      }
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: "error", text: "Unable to load question bank data." });
    } finally {
      setLoading(false);
    }
  }, [fetchQuestionsPage, searchTerm, sourceFilter]);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleFilterChange = async (
    source: string,
    search: string,
    page: number = 1,
  ) => {
    setLoading(true);
    try {
      await fetchQuestionsPage(page, source, search);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Permanently remove ${selectedIds.length} items from the repository?`,
      )
    )
      return;
    try {
      await adminApi.deleteBulkQuestions(selectedIds);
      setMessage({ type: "success", text: "Bulk operation completed." });
      setSelectedIds([]);
      await initData();
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: "error", text: "Operation failed." });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSoftDeleteSource = async (sourceFileName: string) => {
    if (
      !window.confirm(
        `Soft delete source file ${sourceFileName}? This hides its questions from active source lists.`,
      )
    )
      return;
    try {
      await adminApi.softDeleteQuestionSource(sourceFileName);
      setMessage({
        type: "success",
        text: "Source file soft deleted successfully.",
      });
      await initData();
      await handleFilterChange(sourceFilter, searchTerm, questionPage);
    } catch (err: unknown) {
      const errorObj = err as Record<
        string,
        Record<string, Record<string, string>>
      >;
      const errorMessage =
        errorObj?.response?.data?.message || "Unable to delete source file.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#000000" : "#F1F5F9",
        color: isDark ? "#FFFFFF" : "inherit",
        pb: 10,
        "& .MuiPaper-root": {
          backgroundColor: isDark ? "#000000 !important" : undefined,
          color: isDark ? "#FFFFFF !important" : undefined,
          borderColor: isDark
            ? "rgba(148, 163, 184, 0.28) !important"
            : undefined,
        },
        "& .MuiTypography-root, & .MuiButton-root": {
          color: isDark ? "#FFFFFF" : undefined,
        },
        "& .MuiOutlinedInput-root, & .MuiInputBase-root, & .MuiSelect-select": {
          backgroundColor: isDark ? "#000000 !important" : undefined,
          color: isDark ? "#FFFFFF !important" : undefined,
        },
        "& .MuiOutlinedInput-notchedOutline, & .MuiDivider-root, & .MuiTableCell-root":
          {
            borderColor: isDark
              ? "rgba(148, 163, 184, 0.32) !important"
              : undefined,
          },
        "& .MuiTableHead-root .MuiTableCell-root, & .MuiTableCell-root": {
          backgroundColor: isDark ? "#000000 !important" : undefined,
          color: isDark ? "#FFFFFF !important" : undefined,
        },
        "& .MuiTableRow-root:hover": {
          backgroundColor: isDark ? "#111111 !important" : undefined,
        },
        "& .MuiChip-root, & .MuiAvatar-root, & .MuiCheckbox-root": {
          color: isDark ? "#FFFFFF" : undefined,
        },
        "& .MuiIconButton-root": {
          color: isDark ? "#E2E8F0" : undefined,
        },
      }}
    >
      {/* Header Area */}
      <Box
        sx={{
          bgcolor: isDark ? "#000000" : "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          py: 5,
          mb: 6,
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Box>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(99, 102, 241, 0.1)",
                    color: "#6366F1",
                    width: 32,
                    height: 32,
                  }}
                >
                  <Storage sx={{ fontSize: 18 }} />
                </Avatar>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    color: isDark ? "#CBD5E1" : "#94A3B8",
                    letterSpacing: 1.5,
                  }}
                >
                  Inventory Management
                </Typography>
              </Stack>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-1.5px",
                  color: isDark ? "#FFFFFF" : "#0F172A",
                }}
              >
                Global Question Bank
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate("/admin")}
                sx={{
                  fontWeight: 700,
                  borderRadius: 3,
                  color: isDark ? "#FFFFFF" : undefined,
                  borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : undefined,
                }}
              >
                Back
              </Button>
              {selectedIds.length > 0 && (
                <IconButton
                  color="error"
                  onClick={handleBulkDelete}
                  sx={{
                    bgcolor: isDark ? "#000000" : "rgba(239, 68, 68, 0.05)",
                    borderRadius: 3,
                    px: 2,
                  }}
                >
                  <Delete sx={{ mr: 1 }} />
                  <Typography variant="button" sx={{ fontWeight: 800 }}>
                    Delete ({selectedIds.length})
                  </Typography>
                </IconButton>
              )}
              <IconButton
                onClick={() =>
                  handleFilterChange(sourceFilter, searchTerm, questionPage)
                }
                sx={{
                  bgcolor: isDark ? "#000000" : "#F8FAFC",
                  borderRadius: 3,
                }}
              >
                <Refresh />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
        {message.text && (
          <Alert
            severity={
              (message.type as "success" | "error" | "warning" | "info") ||
              "info"
            }
            sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}
          >
            {message.text}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            mb: 4,
          }}
        >
          <Box
            sx={{
              p: 3,
              bgcolor: isDark ? "#000000" : "#FFFFFF",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: isDark ? "#FFFFFF" : "#0F172A" }}
            >
              Imported Source Files
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: isDark ? "#CBD5E1" : "#64748B", mt: 0.5 }}
            >
              You can soft delete a file only when none of its questions are
              assigned to tests.
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 900,
                      color: isDark ? "#FFFFFF" : "#64748B",
                      bgcolor: isDark ? "#000000" : "#F8FAFC",
                    }}
                  >
                    FILE NAME
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 900,
                      color: isDark ? "#FFFFFF" : "#64748B",
                      bgcolor: isDark ? "#000000" : "#F8FAFC",
                    }}
                  >
                    QUESTIONS
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 900,
                      color: isDark ? "#FFFFFF" : "#64748B",
                      bgcolor: isDark ? "#000000" : "#F8FAFC",
                    }}
                  >
                    IN USE
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 900,
                      color: isDark ? "#FFFFFF" : "#64748B",
                      bgcolor: isDark ? "#000000" : "#F8FAFC",
                    }}
                  >
                    LAST IMPORT
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 900,
                      color: isDark ? "#FFFFFF" : "#64748B",
                      bgcolor: isDark ? "#000000" : "#F8FAFC",
                    }}
                  >
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sourceFiles.map((sf) => (
                  <TableRow
                    key={sf.sourceFileName}
                    hover
                    sx={{
                      "&:hover": { bgcolor: isDark ? "#111111" : undefined },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: isDark ? "#FFFFFF" : "#0F172A",
                      }}
                    >
                      {sf.sourceFileName}
                    </TableCell>
                    <TableCell>{sf.totalQuestions}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={sf.usedQuestions > 0 ? "warning" : "success"}
                        label={sf.usedQuestions}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDark ? "#CBD5E1" : "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {new Date(sf.lastImportedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={!sf.canSoftDelete}
                        onClick={() =>
                          handleSoftDeleteSource(sf.sourceFileName)
                        }
                      >
                        Soft Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sourceFiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 5, textAlign: "center" }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: isDark ? "#CBD5E1" : "#94A3B8",
                        }}
                      >
                        No imported files found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
            border: "1px solid #E2E8F0",
            overflow: "hidden",
          }}
        >
          {/* Filters Header */}
          <Box
            sx={{
              p: 4,
              bgcolor: isDark ? "#000000" : "#FFFFFF",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            <TextField
              size="small"
              placeholder="Search in questions..."
              value={searchTerm}
              onChange={(e) => {
                const nextSearch = e.target.value;
                setSearchTerm(nextSearch);
                handleFilterChange(sourceFilter, nextSearch, 1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#ADB5BD" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: { xs: "1 1 100%", md: "0 0 auto" },
                minWidth: { xs: "100%", sm: 240, md: 350 },
                bgcolor: isDark ? "#000000" : "#F8FAFC",
                borderRadius: 3,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            />

            <TextField
              select
              size="small"
              label="Source Selection"
              value={sourceFilter}
              onChange={(e) => {
                const nextSource = e.target.value;
                setSourceFilter(nextSource);
                handleFilterChange(nextSource, searchTerm, 1);
              }}
              sx={{
                minWidth: { xs: 160, sm: 220, md: 250 },
                "& .MuiOutlinedInput-root": { borderRadius: 3 },
              }}
            >
              <MenuItem value="All Sources" sx={{ fontWeight: 700 }}>
                All Import Sources
              </MenuItem>
              {sources.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontWeight: 600 }}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <Box
              sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? "#CBD5E1" : "#94A3B8",
                    fontWeight: 800,
                    display: "block",
                  }}
                >
                  POOL SIZE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {totalQuestions}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? "#CBD5E1" : "#94A3B8",
                    fontWeight: 800,
                    display: "block",
                  }}
                >
                  RESOURCES
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {sources.length}
                </Typography>
              </Box>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ p: 15, textAlign: "center" }}>
              <CircularProgress sx={{ color: "#6366F1" }} />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 650, overflowX: "auto" }}>
              <Table stickyHeader sx={{ minWidth: { xs: 700, sm: 900 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      padding="checkbox"
                      sx={{ bgcolor: isDark ? "#000000" : "#F8FAFC" }}
                    >
                      <Checkbox
                        checked={
                          selectedIds.length === questions.length &&
                          questions.length > 0
                        }
                        indeterminate={
                          selectedIds.length > 0 &&
                          selectedIds.length < questions.length
                        }
                        onChange={() => {
                          if (selectedIds.length === questions.length)
                            setSelectedIds([]);
                          else setSelectedIds(questions.map((q) => q.id));
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 900,
                        color: isDark ? "#FFFFFF" : "#64748B",
                        bgcolor: isDark ? "#000000" : "#F8FAFC",
                      }}
                    >
                      ASSESSMENT ITEM
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: "none", sm: "table-cell" },
                        fontWeight: 900,
                        color: isDark ? "#FFFFFF" : "#64748B",
                        bgcolor: isDark ? "#000000" : "#F8FAFC",
                      }}
                    >
                      SOURCE ORIGIN
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: "none", md: "table-cell" },
                        fontWeight: 900,
                        color: isDark ? "#FFFFFF" : "#64748B",
                        bgcolor: isDark ? "#000000" : "#F8FAFC",
                      }}
                    >
                      INDEX DATE
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 900,
                        color: isDark ? "#FFFFFF" : "#64748B",
                        bgcolor: isDark ? "#000000" : "#F8FAFC",
                      }}
                    >
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {questions.map((q) => {
                    const isSelected = selectedIds.includes(q.id);
                    return (
                      <TableRow
                        key={q.id}
                        hover
                        selected={isSelected}
                        sx={{
                          "&:hover": {
                            bgcolor: isDark
                              ? "#111111 !important"
                              : "#F8FAFC !important",
                          },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelect(q.id)}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 3 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: isDark ? "#FFFFFF" : "#0F172A",
                              mb: 0.5,
                            }}
                          >
                            {q.question_EN}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Typography
                              sx={{
                                color: isDark ? "#CBD5E1" : "#94A3B8",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              #Q-{q.id.toString().padStart(4, "0")}
                            </Typography>
                            <Chip
                              label="MCQ"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: 9,
                                fontWeight: 900,
                                bgcolor: isDark ? "#000000" : "#F1F5F9",
                                color: isDark ? "#FFFFFF" : "#64748B",
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", sm: "table-cell" } }}
                        >
                          <Chip
                            icon={
                              <Storage sx={{ fontSize: "14px !important" }} />
                            }
                            label={q.sourceFileName || "Manual Entry"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: isDark
                                ? "#000000"
                                : "rgba(99, 102, 241, 0.05)",
                              color: isDark ? "#FFFFFF" : "#6366F1",
                              border: "1px solid rgba(99, 102, 241, 0.1)",
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: isDark ? "#CBD5E1" : "#64748B",
                              fontWeight: 600,
                            }}
                          >
                            {new Date(q.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <IconButton
                              size="small"
                              sx={{ color: isDark ? "#E2E8F0" : "#94A3B8" }}
                            >
                              <Visibility sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              sx={{ color: isDark ? "#E2E8F0" : "#94A3B8" }}
                            >
                              <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {questions.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ py: 15, textAlign: "center" }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: isDark ? "#CBD5E1" : "#ADB5BD",
                          }}
                        >
                          Repository currently empty.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalQuestions > questionPageSize && (
            <Box
              sx={{
                px: { xs: 2, sm: 3, md: 3 },
                py: { xs: 2, sm: 2.5, md: 2.5 },
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "center", sm: "space-between" },
                alignItems: "center",
                gap: { xs: 2, sm: 2, md: 3 },
                bgcolor: isDark ? "#000000" : "#FFFFFF",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: isDark ? "#CBD5E1" : "#64748B",
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                }}
              >
                Showing{" "}
                {Math.min(
                  (questionPage - 1) * questionPageSize + 1,
                  totalQuestions,
                )}{" "}
                - {Math.min(questionPage * questionPageSize, totalQuestions)} of{" "}
                {totalQuestions}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.8, sm: 1.2, md: 1.5 },
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleFilterChange(sourceFilter, searchTerm, 1)
                  }
                  disabled={questionPage === 1}
                  sx={{
                    minWidth: { xs: "32px", sm: "36px" },
                    p: { xs: 0.6, sm: 0.8 },
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    fontWeight: 700,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.3)"
                      : undefined,
                    color: isDark ? "#E2E8F0" : undefined,
                    "&:disabled": { opacity: 0.5 },
                  }}
                >
                  {"<<"}
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleFilterChange(
                      sourceFilter,
                      searchTerm,
                      Math.max(1, questionPage - 1),
                    )
                  }
                  disabled={questionPage === 1}
                  sx={{
                    minWidth: { xs: "32px", sm: "36px" },
                    p: { xs: 0.6, sm: 0.8 },
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    fontWeight: 700,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.3)"
                      : undefined,
                    color: isDark ? "#E2E8F0" : undefined,
                    "&:disabled": { opacity: 0.5 },
                  }}
                >
                  {"<"}
                </Button>

                <Typography
                  sx={{
                    minWidth: "max-content",
                    color: isDark ? "#E2E8F0" : "#0F172A",
                    fontWeight: 700,
                    fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                    px: { xs: 1, sm: 1.5, md: 2 },
                  }}
                >
                  page {questionPage} of{" "}
                  {Math.max(1, Math.ceil(totalQuestions / questionPageSize))}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleFilterChange(
                      sourceFilter,
                      searchTerm,
                      Math.min(
                        Math.max(
                          1,
                          Math.ceil(totalQuestions / questionPageSize),
                        ),
                        questionPage + 1,
                      ),
                    )
                  }
                  disabled={
                    questionPage ===
                    Math.ceil(totalQuestions / questionPageSize)
                  }
                  sx={{
                    minWidth: { xs: "32px", sm: "36px" },
                    p: { xs: 0.6, sm: 0.8 },
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    fontWeight: 700,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.3)"
                      : undefined,
                    color: isDark ? "#E2E8F0" : undefined,
                    "&:disabled": { opacity: 0.5 },
                  }}
                >
                  {">"}
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    handleFilterChange(
                      sourceFilter,
                      searchTerm,
                      Math.max(1, Math.ceil(totalQuestions / questionPageSize)),
                    )
                  }
                  disabled={
                    questionPage ===
                    Math.ceil(totalQuestions / questionPageSize)
                  }
                  sx={{
                    minWidth: { xs: "32px", sm: "36px" },
                    p: { xs: 0.6, sm: 0.8 },
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    fontWeight: 700,
                    borderColor: isDark
                      ? "rgba(148, 163, 184, 0.3)"
                      : undefined,
                    color: isDark ? "#E2E8F0" : undefined,
                    "&:disabled": { opacity: 0.5 },
                  }}
                >
                  {">>"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default QuestionBank;
