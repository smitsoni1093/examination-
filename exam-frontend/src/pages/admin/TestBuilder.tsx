import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Avatar,
  Chip,
  Stack,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Quiz,
  DoneAll,
  Search,
  PlaylistAddCheck,
  ArrowBack,
  ArrowForward,
  Storage,
  AddCircle,
  RemoveCircle,
  PhotoCamera,
  DeleteOutline,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/endpoints";

type TestMessageState = {
  type: "success" | "error" | "";
  text: string;
};

type ClassItem = {
  id: number;
  name: string;
};

type InstructionItem = {
  id: number;
  text: string;
  isActive: boolean;
};

type BankQuestion = {
  id: number;
  question_EN: string;
  sourceFileName?: string | null;
};

type SelectedQuestion = {
  id: number;
  question_EN: string;
};

type TestData = {
  name: string;
  description: string;
  totalMarks: number;
  closingAt: string;
};

type TestRecord = {
  id: number;
  name: string;
  description?: string;
  totalMarks?: number;
  closingAt?: string;
  testImageUrl?: string | null;
  instructions?: Array<{ id: number }>;
};

type TestPayload = {
  duration: number;
  closingAt: string;
  isGlobal: boolean;
  testImageUrl: string | null;
  instructionIds: number[];
  name: string;
  description: string;
  totalMarks: number;
  classId?: number | null;
};

const toLocalDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toIsoEndOfDay = (dateOnly: string) => {
  const date = new Date(`${dateOnly}T23:59:59`);
  return date.toISOString();
};

const TestBuilder = () => {
  const { testId: existingTestId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<TestMessageState>({
    type: "",
    text: "",
  });

  // Step 1: Test Details
  const [testData, setTestData] = useState<TestData>({
    name: "",
    description: "",
    totalMarks: 100,
    closingAt: "",
  });
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);

  const [isGlobal, setIsGlobal] = useState(false);
  const [classId, setClassId] = useState<number | "">("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [instructionBank, setInstructionBank] = useState<InstructionItem[]>([]);
  const [selectedInstructionIds, setSelectedInstructionIds] = useState<
    number[]
  >([]);

  // Step 2: Question Selection
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<
    SelectedQuestion[]
  >([]);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [searchTerm, setSearchTerm] = useState("");
  const [bankSelection, setBankSelection] = useState<number[]>([]);
  const [testId, setTestId] = useState<number | null>(
    existingTestId ? Number(existingTestId) : null,
  );

  const loadClasses = useCallback(async () => {
    try {
      const [classRes, instructionRes] = await Promise.all([
        adminApi.getClasses(),
        adminApi.getInstructions(),
      ]);

      setClasses(
        Array.isArray(classRes.data) ? (classRes.data as ClassItem[]) : [],
      );
      setInstructionBank(
        Array.isArray(instructionRes.data)
          ? (instructionRes.data as InstructionItem[])
          : [],
      );
    } catch (error: unknown) {
      console.error(error);
    }
  }, []);

  const loadExistingTest = useCallback(async () => {
    if (!existingTestId) return;

    setLoading(true);
    try {
      const res = await adminApi.getTests();
      const test = Array.isArray(res.data)
        ? (res.data as TestRecord[]).find(
            (item) => item.id === Number(existingTestId),
          )
        : undefined;

      if (test) {
        setTestData({
          name: test.name,
          description: test.description || "",
          totalMarks: test.totalMarks || 100,
          closingAt: toLocalDateInput(test.closingAt),
        });
        setTestImageUrl(test.testImageUrl || null);
        setSelectedInstructionIds(
          (test.instructions || []).map((item) => item.id),
        );

        const qRes = await adminApi.getTestQuestionsDetails(
          Number(existingTestId),
        );
        setSelectedQuestions(
          Array.isArray(qRes.data) ? (qRes.data as SelectedQuestion[]) : [],
        );
        setTestId(Number(existingTestId));
        setActiveStep(1);
      }
    } catch (error: unknown) {
      setMessage({ type: "error", text: "Failed to load test instance." });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [existingTestId]);

  const initBank = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, srcRes] = await Promise.all([
        adminApi.getQuestions(),
        adminApi.getQuestionSources(),
      ]);
      setBankQuestions(
        Array.isArray(qRes.data) ? (qRes.data as BankQuestion[]) : [],
      );
      setSources(
        (Array.isArray(srcRes.data) ? srcRes.data : []).filter(
          (item: string | null) => item !== null,
        ),
      );
    } catch (error: unknown) {
      console.error(error);
      setMessage({ type: "error", text: "Bank connection failed." });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload a valid image file." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size should be up to 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTestImageUrl(reader.result as string);
      setMessage({ type: "", text: "" });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activeStep === 1) {
      initBank();
    }
  }, [activeStep, initBank]);

  useEffect(() => {
    if (existingTestId) {
      loadExistingTest();
    }
  }, [existingTestId, loadExistingTest]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreateTest = async () => {
    setLoading(true);
    try {
      if (testId) {
        // Update test logic could be here if we had a dedicated PUT for test
        // For now, we just proceed to step 2 if testId exists
        setActiveStep(1);
      } else {
        if (!isGlobal && classId === "") {
          setMessage({
            type: "error",
            text: "Please select a class or enable All Classes.",
          });
          return;
        }

        if (!testData.closingAt) {
          setMessage({
            type: "error",
            text: "Please set a last date of submission.",
          });
          return;
        }

        const closingAtDate = new Date(`${testData.closingAt}T23:59:59`);
        if (
          Number.isNaN(closingAtDate.getTime()) ||
          closingAtDate <= new Date()
        ) {
          setMessage({
            type: "error",
            text: "Last date of submission must be in the future.",
          });
          return;
        }

        const payload: TestPayload = {
          ...testData,
          duration: 0,
          closingAt: toIsoEndOfDay(testData.closingAt),
          isGlobal,
          testImageUrl,
          instructionIds: selectedInstructionIds,
        };
        if (!isGlobal) payload.classId = classId === "" ? null : classId;
        const res = await adminApi.createTest(payload);
        setTestId(res.data.id);
        setActiveStep(1);
        setMessage({
          type: "success",
          text: "Evaluation context initialized.",
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error: unknown) {
      console.error(error);
      setMessage({ type: "error", text: "Initialization error." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSelected = () => {
    const toAdd = bankQuestions.filter((q) => bankSelection.includes(q.id));
    const currentIds = selectedQuestions.map((q) => q.id);
    const filteredToAdd = toAdd.filter((q) => !currentIds.includes(q.id));

    setSelectedQuestions((prev) => [...prev, ...filteredToAdd]);
    setBankSelection([]);
  };

  const handleRemoveSelected = (id: number) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSaveSelection = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      await adminApi.assignQuestions({
        testId,
        questionIds: selectedQuestions.map((q) => q.id),
      });
      setMessage({
        type: "success",
        text: "Assessment strategy synchronization complete.",
      });
      setTimeout(() => navigate("/admin/tests"), 2000);
    } catch (error: unknown) {
      console.error(error);
      setMessage({ type: "error", text: "Strategy synchronization failed." });
    } finally {
      setLoading(false);
    }
  };

  const filteredBank = bankQuestions.filter((q) => {
    const matchesSource =
      sourceFilter === "All Sources" || q.sourceFileName === sourceFilter;
    const matchesSearch = q.question_EN
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSource && matchesSearch;
  });

  const handleSelectAllFromFile = (source: string) => {
    const fileQuestions = bankQuestions
      .filter((q) => q.sourceFileName === source)
      .map((q) => q.id);
    setBankSelection((prev) =>
      Array.from(new Set([...prev, ...fileQuestions])),
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          py: 6,
          mb: 6,
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate("/admin/tests")}
                sx={{ mb: 2, color: "#64748B", fontWeight: 700 }}
              >
                Exit Builder
              </Button>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-1.5px",
                  color: "#0F172A",
                }}
              >
                {testId ? "Edit Assessment" : "New Test Builder"}
              </Typography>
            </Box>
            <Box sx={{ width: 400 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                <Step>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      IDENTITY
                    </Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      CONTENT
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 4, md: 8, lg: 12 } }}>
        {message.text && (
          <Alert
            severity={(message.type as "success" | "error") || "info"}
            sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}
          >
            {message.text}
          </Alert>
        )}

        {activeStep === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              maxWidth: 800,
              mx: "auto",
              borderRadius: 6,
              border: "1px solid #E2E8F0",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>
              Evaluation Parameters
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Evaluation Title"
                  placeholder="e.g. Mechanical Engineering Proficiency"
                  value={testData.name}
                  onChange={(e) =>
                    setTestData({ ...testData, name: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detailed Description"
                  placeholder="Explain the focus of this assessment..."
                  value={testData.description}
                  onChange={(e) =>
                    setTestData({ ...testData, description: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1.5}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, color: "#334155" }}
                  >
                    Test Image (Optional)
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      sx={{ borderRadius: 3, fontWeight: 700 }}
                    >
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageUpload}
                      />
                    </Button>
                    {testImageUrl && (
                      <Button
                        variant="text"
                        color="error"
                        startIcon={<DeleteOutline />}
                        onClick={() => setTestImageUrl(null)}
                        sx={{ fontWeight: 700 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                  {testImageUrl && (
                    <Box
                      component="img"
                      src={testImageUrl}
                      alt="Test preview"
                      sx={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "cover",
                        borderRadius: 3,
                        border: "1px solid #E2E8F0",
                      }}
                    />
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Last Date of Submission"
                  value={testData.closingAt}
                  onChange={(e) =>
                    setTestData({ ...testData, closingAt: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  helperText="Users cannot start or continue this test after this date."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isGlobal}
                      onChange={(e) => setIsGlobal(e.target.checked)}
                    />
                  }
                  label="All Classes"
                />
              </Grid>

              {!isGlobal && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Class"
                    value={classId}
                    onChange={(e) =>
                      setClassId(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                  >
                    <MenuItem value="">Select Class</MenuItem>
                    {classes.map((c: ClassItem) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Target Performance (Marks)"
                  value={testData.totalMarks}
                  onChange={(e) =>
                    setTestData({
                      ...testData,
                      totalMarks: Number(e.target.value),
                    })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Quiz sx={{ color: "#94A3B8" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: "#334155", mb: 1.25 }}
                >
                  Test Instructions
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "#E2E8F0",
                    maxHeight: 220,
                    overflow: "auto",
                  }}
                >
                  <List sx={{ py: 0 }}>
                    {instructionBank
                      .filter((item: InstructionItem) => item.isActive)
                      .map((item: InstructionItem) => {
                        const checked = selectedInstructionIds.includes(
                          item.id,
                        );
                        return (
                          <ListItem
                            key={item.id}
                            divider
                            onClick={() =>
                              setSelectedInstructionIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id],
                              )
                            }
                            sx={{ cursor: "pointer" }}
                          >
                            <Checkbox checked={checked} />
                            <ListItemText primary={item.text} />
                          </ListItem>
                        );
                      })}
                    {instructionBank.filter(
                      (item: InstructionItem) => item.isActive,
                    ).length === 0 && (
                      <ListItem>
                        <ListItemText primary="No active instructions found. Create them in Instruction Bank." />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleCreateTest}
                  disabled={loading || !testData.name}
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 2,
                    borderRadius: 4,
                    fontWeight: 800,
                    bgcolor: "#0F172A",
                    "&:hover": { bgcolor: "#1E293B" },
                  }}
                >
                  {loading
                    ? "Initializing..."
                    : "Proceed to content composition"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {/* Left Column: Repository */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                  height: "calc(100vh - 350px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: "1px solid #F1F5F9",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#64748B",
                      fontWeight: 800,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Storage sx={{ fontSize: 16, mr: 1 }} /> INVENTORY
                    REPOSITORY
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Global search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Search sx={{ color: "#ADB5BD", fontSize: 20 }} />
                        ),
                      }}
                      sx={{
                        bgcolor: "#F8FAFC",
                        borderRadius: 2,
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                      }}
                    />
                    <TextField
                      select
                      size="small"
                      sx={{ minWidth: 150 }}
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                    >
                      <MenuItem value="All Sources" sx={{ fontWeight: 800 }}>
                        All Sources
                      </MenuItem>
                      {sources.map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontWeight: 600 }}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Checkbox
                        size="small"
                        checked={
                          filteredBank.length > 0 &&
                          filteredBank.every(
                            (q) =>
                              bankSelection.includes(q.id) ||
                              selectedQuestions.some((sq) => sq.id === q.id),
                          )
                        }
                        indeterminate={
                          bankSelection.length > 0 &&
                          bankSelection.length <
                            filteredBank.filter(
                              (q) =>
                                !selectedQuestions.some((sq) => sq.id === q.id),
                            ).length +
                              bankSelection.filter(
                                (id) =>
                                  !filteredBank.some((fq) => fq.id === id),
                              ).length
                        } // Simplified indeterminate logic
                        onChange={(e) => {
                          const available = filteredBank.filter(
                            (q) =>
                              !selectedQuestions.some((sq) => sq.id === q.id),
                          );
                          if (e.target.checked) {
                            const newIds = available.map((q) => q.id);
                            setBankSelection((prev) =>
                              Array.from(new Set([...prev, ...newIds])),
                            );
                          } else {
                            const idsToRemove = available.map((q) => q.id);
                            setBankSelection((prev) =>
                              prev.filter((id) => !idsToRemove.includes(id)),
                            );
                          }
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: "#64748B" }}
                      >
                        SELECT ALL VISIBLE (
                        {
                          filteredBank.filter(
                            (q) =>
                              !selectedQuestions.some((sq) => sq.id === q.id),
                          ).length
                        }{" "}
                        items)
                      </Typography>
                    </Stack>

                    {sourceFilter !== "All Sources" && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleSelectAllFromFile(sourceFilter)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          color: "#6366F1",
                        }}
                      >
                        + Source: {sourceFilter}
                      </Button>
                    )}
                  </Box>
                </Box>
                <Box sx={{ flex: 1, overflow: "auto" }}>
                  {loading && bankQuestions.length === 0 ? (
                    <Box sx={{ p: 5, textAlign: "center" }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {filteredBank.map((q) => {
                        const isSelected = bankSelection.includes(q.id);
                        const alreadyInTest = selectedQuestions.some(
                          (sq) => sq.id === q.id,
                        );
                        return (
                          <ListItem
                            key={q.id}
                            divider
                            disabled={alreadyInTest}
                            onClick={() =>
                              !alreadyInTest &&
                              setBankSelection((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== q.id)
                                  : [...prev, q.id],
                              )
                            }
                            sx={{
                              py: 2,
                              px: 3,
                              cursor: "pointer",
                              opacity: alreadyInTest ? 0.4 : 1,
                            }}
                          >
                            <Checkbox
                              size="small"
                              checked={isSelected || alreadyInTest}
                              sx={{
                                color: alreadyInTest ? "#10B981" : "#E2E8F0",
                                "&.Mui-checked": {
                                  color: alreadyInTest ? "#10B981" : "#6366F1",
                                },
                              }}
                            />
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800, color: "#0F172A" }}
                                >
                                  {q.question_EN}
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 700, color: "#94A3B8" }}
                                >
                                  {q.sourceFileName || "Manual"}
                                </Typography>
                              }
                            />
                            {alreadyInTest && (
                              <Chip
                                label="ASSIGNEED"
                                size="small"
                                sx={{
                                  fontWeight: 900,
                                  fontSize: 8,
                                  height: 16,
                                  bgcolor: "#10B981",
                                  color: "white",
                                }}
                              />
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderTop: "1px solid #F1F5F9",
                    textAlign: "center",
                  }}
                >
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddSelected}
                    disabled={bankSelection.length === 0}
                    startIcon={<AddCircle />}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 800,
                      bgcolor: "#6366F1",
                      "&:hover": { bgcolor: "#4F46E5" },
                    }}
                  >
                    Incorporate {bankSelection.length} selected items
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Right Column: Active Composition */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                  height: "calc(100vh - 350px)",
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderBottom: "1px solid #F1F5F9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "#0F172A",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <PlaylistAddCheck
                        sx={{ fontSize: 16, mr: 1, color: "#EC4899" }}
                      />{" "}
                      TEST COMPOSITION
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#94A3B8" }}
                    >
                      Live sequence of assessment items
                    </Typography>
                  </Box>
                  <Chip
                    label={`${selectedQuestions.length} ITEMS`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: "#0F172A",
                      color: "white",
                      px: 1,
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1, overflow: "auto" }}>
                  {selectedQuestions.length === 0 ? (
                    <Box sx={{ p: 10, textAlign: "center" }}>
                      <Avatar
                        sx={{
                          bgcolor: "#F8FAFC",
                          color: "#E2E8F0",
                          width: 60,
                          height: 60,
                          mx: "auto",
                          mb: 2,
                        }}
                      >
                        <Quiz />
                      </Avatar>
                      <Typography sx={{ color: "#ADB5BD", fontWeight: 800 }}>
                        Composition palette empty.
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {selectedQuestions.map((q, index) => (
                        <ListItem key={q.id} divider sx={{ py: 2, px: 3 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: 10,
                              fontWeight: 900,
                              bgcolor: "#F1F5F9",
                              color: "#64748B",
                              mr: 2,
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 800, color: "#0F172A" }}
                              >
                                {q.question_EN}
                              </Typography>
                            }
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveSelected(q.id)}
                          >
                            <RemoveCircle sx={{ fontSize: 18 }} />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                <Box sx={{ p: 3, borderTop: "1px solid #F1F5F9" }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSaveSelection}
                    disabled={loading || selectedQuestions.length === 0}
                    startIcon={<DoneAll />}
                    sx={{
                      py: 2,
                      borderRadius: 4,
                      fontWeight: 900,
                      bgcolor: "#EC4899",
                      "&:hover": { bgcolor: "#DB2777" },
                      boxShadow: "0 10px 15px -3px rgba(236, 72, 153, 0.3)",
                    }}
                  >
                    {loading
                      ? "Finalizing..."
                      : "Save & Publish Evaluation Strategy"}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default TestBuilder;
