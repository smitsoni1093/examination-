import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
} from "@mui/icons-material";
import { authApi } from "../../api/endpoints";
import { loginSuccess } from "../../store/authSlice";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      if (res.data.role === "SuperAdmin") {
        dispatch(loginSuccess(res.data));
        navigate("/superadmin");
      } else if (res.data.role === "Admin") {
        dispatch(loginSuccess(res.data));
        navigate("/admin");
      } else {
        setError(t("auth.adminAccessDenied"));
      }
    } catch {
      setError(t("auth.adminAuthFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        background:
          "radial-gradient(circle at 0% 12%, rgba(14, 165, 233, 0.18), transparent 26%), radial-gradient(circle at 92% 6%, rgba(99, 102, 241, 0.2), transparent 34%), linear-gradient(155deg, #F8FAFC 0%, #EEF2FF 48%, #E0F2FE 100%)",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          width: { xs: 280, sm: 420 },
          height: { xs: 280, sm: 420 },
          borderRadius: "50%",
          top: { xs: -90, sm: -120 },
          right: { xs: -90, sm: -120 },
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0) 70%)",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: { xs: 260, sm: 380 },
          height: { xs: 260, sm: 380 },
          borderRadius: "50%",
          bottom: { xs: -100, sm: -130 },
          left: { xs: -110, sm: -140 },
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 70%)",
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4.5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: "22px",
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.86) 0%, rgba(15, 23, 42, 0.94) 100%)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(148, 163, 184, 0.24)",
            boxShadow: "0 24px 60px rgba(2, 6, 23, 0.55)",
            color: "white",
          }}
        >
          <Box
            sx={{
              p: 1.8,
              borderRadius: "20px",
              background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
              color: "white",
              mb: 2.4,
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 10px 26px rgba(2, 132, 199, 0.36)",
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 40 }} />
          </Box>

          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 0.8,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.7rem", sm: "1.95rem" },
            }}
          >
            {t("auth.adminConsole")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mb: 3.4,
              color: "rgba(226, 232, 240, 0.8)",
              fontWeight: 500,
              textAlign: "center",
              maxWidth: 290,
              lineHeight: 1.45,
            }}
          >
            {t("auth.adminPortalTagline")}
          </Typography>

          {error && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                width: "100%",
                mb: 2.5,
                borderRadius: "12px",
                bgcolor: "rgba(220, 38, 38, 0.86)",
                border: "1px solid rgba(254, 202, 202, 0.26)",
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label={t("auth.adminId")}
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                sx: {
                  borderRadius: "12px",
                  bgcolor: "rgba(15, 23, 42, 0.5)",
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(148, 163, 184, 0.34)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(56, 189, 248, 0.72)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#38BDF8",
                    borderWidth: 2,
                  },
                },
              }}
              InputLabelProps={{
                sx: { color: "rgba(203, 213, 225, 0.9)", fontWeight: 600 },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label={t("auth.securePassword")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                sx: {
                  borderRadius: "12px",
                  bgcolor: "rgba(15, 23, 42, 0.5)",
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(148, 163, 184, 0.34)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(56, 189, 248, 0.72)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#38BDF8",
                    borderWidth: 2,
                  },
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "rgba(203, 213, 225, 0.95)" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: { color: "rgba(203, 213, 225, 0.9)", fontWeight: 600 },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 4,
                mb: 2.4,
                py: 1.65,
                fontSize: "1.02rem",
                fontWeight: 800,
                letterSpacing: 0.2,
                borderRadius: "12px",
                textTransform: "none",
                background: "linear-gradient(135deg, #0284C7 0%, #2563EB 100%)",
                boxShadow: "0 14px 26px rgba(37, 99, 235, 0.35)",
                "&:hover": {
                  boxShadow: "0 16px 30px rgba(14, 116, 214, 0.42)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  color: "rgba(226, 232, 240, 0.7)",
                  background: "rgba(51, 65, 85, 0.88)",
                },
              }}
            >
              {loading ? t("auth.authenticating") : t("auth.enterConsole")}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="caption"
                sx={{ color: "rgba(148, 163, 184, 0.95)", fontWeight: 500 }}
              >
                {t("auth.systemVersionCaption")}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;
