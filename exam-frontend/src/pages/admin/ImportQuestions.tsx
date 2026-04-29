import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  Alert,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  CloudUpload,
  TableChart,
  CheckCircle,
  ErrorOutline,
  FileDownload,
  ArrowBack,
  Storage,
  Preview,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/endpoints";

type Step = "upload" | "mapping" | "preview" | "result";

type UploadHeader = {
  index: number;
  header: string;
};

type MappingState = {
  qNo: number | "";
  question: number | "";
  optionA: number | "";
  optionB: number | "";
  optionC: number | "";
  optionD: number | "";
  correctAnswer: number | "";
};

type PreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
  isValid: boolean;
  errors: string[];
};

type PreviewResult = {
  sessionId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: PreviewRow[];
  errors: string[];
};

type ImportSummary = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
};

const systemFields = [
  { key: "qNo", label: "Q_no", required: false },
  { key: "question", label: "Question", required: true },
  { key: "optionA", label: "Option A", required: true },
  { key: "optionB", label: "Option B", required: true },
  { key: "optionC", label: "Option C", required: false },
  { key: "optionD", label: "Option D", required: false },
  { key: "correctAnswer", label: "Correct Answer", required: true },
] as const;

const initialMapping: MappingState = {
  qNo: "",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
};

const ImportQuestions = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [headers, setHeaders] = useState<UploadHeader[]>([]);
  const [mapping, setMapping] = useState<MappingState>(initialMapping);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [errorMode, setErrorMode] = useState<"stop" | "skip">("stop");
  const [error, setError] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewRowsPerPage, setPreviewRowsPerPage] = useState(10);

  const headerOptions = useMemo(() => headers, [headers]);
  const paginatedPreviewRows = useMemo(() => {
    if (!preview) return [];
    const start = previewPage * previewRowsPerPage;
    return preview.rows.slice(start, start + previewRowsPerPage);
  }, [preview, previewPage, previewRowsPerPage]);
  const previewPageCount = useMemo(() => {
    if (!preview || preview.rows.length === 0) return 1;
    return Math.ceil(preview.rows.length / previewRowsPerPage);
  }, [preview, previewRowsPerPage]);

  useEffect(() => {
    if (previewPage > previewPageCount - 1) {
      setPreviewPage(Math.max(0, previewPageCount - 1));
    }
  }, [previewPage, previewPageCount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
      setPreview(null);
      setStep("upload");
    }
  };

  const handleInspectColumns = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPreview(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await adminApi.initializeQuestionImport(formData);
      setSessionId(res.data.sessionId);
      setHeaders(res.data.headers ?? []);
      setMapping(initialMapping);
      setStep("mapping");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Upload failed. Please check the file format.",
      );
    } finally {
      setLoading(false);
    }
  };

  const buildMappingPayload = () => ({
    qNo: mapping.qNo === "" ? null : mapping.qNo,
    question: mapping.question === "" ? null : mapping.question,
    optionA: mapping.optionA === "" ? null : mapping.optionA,
    optionB: mapping.optionB === "" ? null : mapping.optionB,
    optionC: mapping.optionC === "" ? null : mapping.optionC,
    optionD: mapping.optionD === "" ? null : mapping.optionD,
    correctAnswer: mapping.correctAnswer === "" ? null : mapping.correctAnswer,
  });

  const validateMapping = () => {
    const requiredFields: Array<keyof MappingState> = [
      "question",
      "optionA",
      "optionB",
      "correctAnswer",
    ];

    for (const field of requiredFields) {
      if (mapping[field] === "") {
        return `Please map ${systemFields.find((item) => item.key === field)?.label ?? field}.`;
      }
    }

    const selected = Object.entries(mapping)
      .filter(([, value]) => value !== "")
      .map(([, value]) => value as number);

    const unique = new Set(selected);
    if (unique.size !== selected.length) {
      return "Duplicate column mapping is not allowed.";
    }

    return null;
  };

  const handleMappingChange = (field: keyof MappingState, value: string) => {
    const nextValue = value === "" ? "" : Number(value);
    setMapping((current) => ({ ...current, [field]: nextValue }));
  };

  const handlePreview = async () => {
    const validationError = validateMapping();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!sessionId) {
      setError("Import session expired. Please upload the file again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminApi.previewQuestionImport({
        sessionId,
        mapping: buildMappingPayload(),
        skipInvalidRows: errorMode === "skip",
      });

      setPreview(res.data);
      setPreviewPage(0);
      setStep("preview");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(
        errorObj.response?.data?.message ||
          "Preview failed. Please review the mapping and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!sessionId) {
      setError("Import session expired. Please upload the file again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminApi.confirmQuestionImport({
        sessionId,
        mapping: buildMappingPayload(),
        skipInvalidRows: errorMode === "skip",
      });

      setResult(res.data);
      setStep("result");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const restartImport = () => {
    setFile(null);
    setSessionId(null);
    setHeaders([]);
    setMapping(initialMapping);
    setPreview(null);
    setResult(null);
    setError(null);
    setErrorMode("stop");
    setStep("upload");
    setPreviewPage(0);
    setPreviewRowsPerPage(10);
  };

  const downloadTemplate = () => {
    const csvHeaders =
      "Column 1,Column 2,Column 3,Column 4,Column 5,Column 6,Column 7\n";
    const example =
      "1,What is the capital of France?,Paris,London,Berlin,Madrid,A";
    const blob = new Blob([csvHeaders + example], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question_import_example.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderFieldSelect = (fieldKey: keyof MappingState, label: string) => {
    const fieldValue = mapping[fieldKey];

    return (
      <TableRow
        key={fieldKey}
        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
      >
        <TableCell sx={{ width: "40%", py: 2.25 }}>
          <Typography sx={{ fontWeight: 800, color: "#0F172A" }}>
            {label}
          </Typography>
        </TableCell>
        <TableCell sx={{ width: "60%", py: 2.25 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{`Select Excel header for ${label}`}</InputLabel>
            <Select
              value={fieldValue === "" ? "" : String(fieldValue)}
              label={`Select Excel header for ${label}`}
              onChange={(event: SelectChangeEvent<string>) =>
                handleMappingChange(fieldKey, event.target.value)
              }
            >
              <MenuItem value="">
                <em>Not Available / Skip</em>
              </MenuItem>
              {headerOptions.map((header) => (
                <MenuItem key={header.index} value={header.index}>
                  {header.header || "(Blank header)"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
      </TableRow>
    );
  };

  const renderPreviewStatus = (row: PreviewRow) => (
    <Chip
      label={row.isValid ? "VALID" : "INVALID"}
      size="small"
      sx={{
        fontWeight: 900,
        borderRadius: 2,
        bgcolor: row.isValid
          ? "rgba(16, 185, 129, 0.12)"
          : "rgba(239, 68, 68, 0.12)",
        color: row.isValid ? "#047857" : "#B91C1C",
      }}
    />
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F1F5F9", pb: 10 }}>
      <Box
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          py: 4,
          mb: 6,
          position: "sticky",
          top: 0,
          zIndex: 1100,
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate("/admin")}
                sx={{ mb: 1, color: "#64748B", fontWeight: 700 }}
              >
                Dashboard
              </Button>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(99, 102, 241, 0.1)",
                    color: "#6366F1",
                    mr: 2,
                    width: 32,
                    height: 32,
                  }}
                >
                  <TableChart sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: "-1.5px",
                    color: "#0F172A",
                  }}
                >
                  Bulk{" "}
                  <Box component="span" sx={{ color: "#94A3B8" }}>
                    Import
                  </Box>
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={downloadTemplate}
              sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
            >
              Download Example CSV
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md">
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 6,
                borderRadius: 8,
                border: "2px dashed #E2E8F0",
                bgcolor: "#FFFFFF",
                textAlign: "center",
                transition: "all 0.3s",
                "&:hover": { borderColor: "#6366F1", bgcolor: "#F8FAFC" },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "rgba(99, 102, 241, 0.05)",
                  color: "#6366F1",
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 3,
                }}
              >
                <CloudUpload sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Manual Question Import
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748B", mb: 2 }}>
                Upload any .xlsx or .csv file. You will map every system field
                manually before import.
              </Typography>
              <Typography variant="body2" sx={{ color: "#94A3B8", mb: 4 }}>
                No automatic header matching is used.
              </Typography>

              <input
                type="file"
                accept=".xlsx,.csv"
                id="excel-upload"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <label htmlFor="excel-upload">
                <Button
                  variant="contained"
                  component="span"
                  sx={{
                    bgcolor: "#0F172A",
                    fontWeight: 900,
                    px: 6,
                    py: 1.5,
                    borderRadius: 4,
                    "&:hover": { bgcolor: "#1E293B" },
                  }}
                >
                  Browse Files
                </Button>
              </label>

              {file && (
                <Stack spacing={2} sx={{ mt: 4, alignItems: "center" }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#F1F5F9",
                      borderRadius: 3,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#0F172A", mr: 2 }}
                    >
                      {file.name}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    disabled={loading}
                    onClick={handleInspectColumns}
                    sx={{
                      bgcolor: "#6366F1",
                      fontWeight: 900,
                      borderRadius: 2,
                      px: 5,
                    }}
                  >
                    {loading ? "Inspecting..." : "Inspect Columns"}
                  </Button>
                </Stack>
              )}

              {loading && (
                <Box sx={{ mt: 4, width: "100%" }}>
                  <LinearProgress
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "#E2E8F0",
                      "& .MuiLinearProgress-bar": { bgcolor: "#6366F1" },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: "block",
                      fontWeight: 700,
                      color: "#64748B",
                    }}
                  >
                    Parsing file and preparing mapping session...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 4, fontWeight: 700 }}>
                {error}
              </Alert>
            </Grid>
          )}

          {step === "mapping" && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Manual Column Mapping
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                      Template field on the left, Excel header selector on the
                      right.
                    </Typography>
                  </Box>
                  <Chip
                    label={`${headers.length} uploaded columns`}
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>

                <TableContainer
                  sx={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                        <TableCell
                          sx={{
                            fontWeight: 900,
                            color: "#475569",
                            width: "40%",
                          }}
                        >
                          Template Side
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 900,
                            color: "#475569",
                            width: "60%",
                          }}
                        >
                          Excel Side
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {systemFields.map((field) =>
                        renderFieldSelect(field.key, field.label),
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 4 }} />

                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={restartImport}
                    sx={{ fontWeight: 800 }}
                  >
                    Start Over
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="contained"
                    startIcon={<Preview />}
                    onClick={handlePreview}
                    sx={{ bgcolor: "#0F172A", fontWeight: 900 }}
                  >
                    Preview Rows
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          )}

          {step === "preview" && preview && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Preview
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                      Review the mapped rows before final import.
                    </Typography>
                  </Box>
                  <Chip
                    label={`${preview.totalRows} rows`}
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>

                <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: "#94A3B8" }}
                    >
                      VALID
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 900, color: "#10B981" }}
                    >
                      {preview.validRows}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: "#94A3B8" }}
                    >
                      INVALID
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 900, color: "#EF4444" }}
                    >
                      {preview.invalidRows}
                    </Typography>
                  </Box>
                </Stack>

                <TableContainer
                  sx={{ border: "1px solid #E2E8F0", borderRadius: 3, mb: 3 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                        <TableCell sx={{ fontWeight: 800 }}>Row</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Question</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Option A</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Option B</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Option C</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Option D</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Correct Answer
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPreviewRows.map((row) => (
                        <TableRow key={row.rowNumber} hover>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {row.rowNumber}
                          </TableCell>
                          <TableCell>{row.values.Question || "-"}</TableCell>
                          <TableCell>{row.values["Option A"] || "-"}</TableCell>
                          <TableCell>{row.values["Option B"] || "-"}</TableCell>
                          <TableCell>{row.values["Option C"] || "-"}</TableCell>
                          <TableCell>{row.values["Option D"] || "-"}</TableCell>
                          <TableCell>
                            {row.values["Correct Answer"] || "-"}
                          </TableCell>
                          <TableCell>{renderPreviewStatus(row)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  sx={{ mb: 2 }}
                >
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Rows per page</InputLabel>
                    <Select
                      label="Rows per page"
                      value={String(previewRowsPerPage)}
                      onChange={(event: SelectChangeEvent<string>) => {
                        setPreviewRowsPerPage(parseInt(event.target.value, 10));
                        setPreviewPage(0);
                      }}
                    >
                      {[10, 25, 50, 100].map((size) => (
                        <MenuItem key={size} value={String(size)}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent={{ xs: "space-between", sm: "flex-end" }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setPreviewPage(0)}
                      disabled={previewPage === 0}
                      sx={{ minWidth: 38, px: 1 }}
                    >
                      {"<<"}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        setPreviewPage((prev) => Math.max(0, prev - 1))
                      }
                      disabled={previewPage === 0}
                      sx={{ minWidth: 38, px: 1 }}
                    >
                      {"<"}
                    </Button>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Page {previewPage + 1} of {previewPageCount}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        setPreviewPage((prev) =>
                          Math.min(previewPageCount - 1, prev + 1),
                        )
                      }
                      disabled={previewPage >= previewPageCount - 1}
                      sx={{ minWidth: 38, px: 1 }}
                    >
                      {">"}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setPreviewPage(previewPageCount - 1)}
                      disabled={previewPage >= previewPageCount - 1}
                      sx={{ minWidth: 38, px: 1 }}
                    >
                      {">>"}
                    </Button>
                  </Stack>
                </Stack>

                {preview.errors.length > 0 && (
                  <List
                    sx={{
                      bgcolor: "rgba(239, 68, 68, 0.02)",
                      borderRadius: 4,
                      p: 2,
                    }}
                  >
                    {preview.errors.map((item, index) => (
                      <ListItem key={`${item}-${index}`}>
                        <ListItemIcon>
                          <ErrorOutline sx={{ color: "#EF4444" }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            color: "#64748B",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setStep("mapping")}
                    sx={{ fontWeight: 800 }}
                  >
                    Back to Mapping
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="contained"
                    onClick={handleConfirm}
                    sx={{ bgcolor: "#0F172A", fontWeight: 900 }}
                  >
                    Confirm Import
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          )}

          {step === "result" && result && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack direction="row" spacing={4} sx={{ mb: 6 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: "#94A3B8" }}
                    >
                      PROCESSED
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 900, color: "#0F172A" }}
                    >
                      {result.totalRows}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: "#10B981" }}
                    >
                      SUCCESSFUL
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 900, color: "#10B981" }}
                    >
                      {result.successCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: "#EF4444" }}
                    >
                      FAILED
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 900, color: "#EF4444" }}
                    >
                      {result.failedCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: "#F59E0B" }}
                    >
                      SKIPPED
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 900, color: "#F59E0B" }}
                    >
                      {result.skippedCount}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 4 }} />

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Import Details
                </Typography>
                {result.errors.length > 0 ? (
                  <List
                    sx={{
                      bgcolor: "rgba(239, 68, 68, 0.02)",
                      borderRadius: 4,
                      p: 2,
                    }}
                  >
                    {result.errors
                      .slice(0, 10)
                      .map((err: string, idx: number) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <ErrorOutline sx={{ color: "#EF4444" }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={err}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              color: "#64748B",
                            }}
                          />
                        </ListItem>
                      ))}
                    {result.errors.length > 10 && (
                      <Typography
                        variant="caption"
                        sx={{ p: 2, display: "block", color: "#94A3B8" }}
                      >
                        Check source file for {result.errors.length - 10}{" "}
                        additional errors.
                      </Typography>
                    )}
                  </List>
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "rgba(16, 185, 129, 0.05)",
                      borderRadius: 4,
                    }}
                  >
                    <CheckCircle
                      sx={{ color: "#10B981", fontSize: 40, mb: 1 }}
                    />
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 700, color: "#047857" }}
                    >
                      All valid rows were imported successfully.
                    </Typography>
                  </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={restartImport}
                    sx={{ fontWeight: 800 }}
                  >
                    Import Another File
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="outlined"
                    startIcon={<Storage />}
                    onClick={() => navigate("/admin/create-question")}
                    sx={{ fontWeight: 800 }}
                  >
                    Review Question Registry
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default ImportQuestions;
