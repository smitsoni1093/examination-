import { useEffect, useState, type ElementType } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Chip,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
  Container,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Group,
  Assessment,
  Shield,
  Bolt,
  Timeline,
  VerifiedUser,
  Menu,
  Close,
  Class,
  PersonAddAlt1,
  LibraryBooks,
  AddTask,
  FactCheck,
  Description,
  UploadFile,
} from "@mui/icons-material";
import { adminApi } from "../../api/endpoints";

type DashboardStats = {
  activeExams: number;
  totalStudents: number;
  submissionsToday: number;
};

type AdminMenuItem = {
  label: string;
  subtitle: string;
  icon: ElementType;
  path: string;
  color: string;
};

type DashboardTest = {
  isActive?: boolean;
};

type DashboardResult = {
  submittedAt?: string;
};

type SidebarContentProps = {
  compact?: boolean;
  menuItems: AdminMenuItem[];
  onItemClick: (path: string) => void;
  onNavigate?: () => void;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
};

const SidebarContent = ({
  compact = false,
  menuItems,
  onItemClick,
  onNavigate,
  onToggleSidebar,
  onCloseSidebar,
}: SidebarContentProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <Box
      sx={{
        px: compact ? 0.6 : 2.4,
        py: compact ? 1 : 2.2,
        display: "flex",
        alignItems: "center",
        justifyContent: compact ? "center" : "flex-start",
        gap: compact ? 0 : 1.4,
      }}
    >
      <Box
        onClick={onToggleSidebar}
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(14, 165, 233, 0.12)",
          color: "#0284C7",
          border: "1px solid rgba(14, 165, 233, 0.18)",
          flexShrink: 0,
          cursor: "pointer",
          transition: "all 200ms ease",
          "&:hover": {
            bgcolor: "rgba(14, 165, 233, 0.24)",
            transform: "scale(1.05)",
          },
        }}
      >
        <Shield sx={{ fontSize: 20 }} />
      </Box>
      {!compact && (
        <Box
          onClick={onCloseSidebar}
          sx={{
            minWidth: 0,
            cursor: "pointer",
            transition: "opacity 200ms ease",
            "&:hover": { opacity: 0.7 },
          }}
        >
          <Typography
            sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}
          >
            Admin Actions
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#64748B", fontWeight: 700 }}
          >
            Quick access panel
          </Typography>
        </Box>
      )}
    </Box>

    <List
      sx={{
        px: compact ? 0.6 : 1.4,
        py: compact ? 0.8 : 1.6,
        flexGrow: 1,
        overflow: "auto",
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "rgba(148, 163, 184, 0.3)",
          borderRadius: "3px",
          "&:hover": { bgcolor: "rgba(148, 163, 184, 0.5)" },
        },
      }}
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <ListItemButton
            key={item.path}
            onClick={() => {
              onItemClick(item.path);
              onNavigate?.();
            }}
            sx={{
              borderRadius: 2,
              mb: compact ? 0.6 : 0.8,
              px: compact ? 0.8 : 1.8,
              py: compact ? 1 : 1.2,
              justifyContent: compact ? "center" : "flex-start",
              "&:hover": { bgcolor: alpha(item.color, 0.08) },
            }}
          >
            <Tooltip title={compact ? item.label : ""} placement="right">
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: compact ? 0 : 1.5,
                  color: item.color,
                  justifyContent: "center",
                }}
              >
                <Icon sx={{ fontSize: compact ? 20 : 22 }} />
              </ListItemIcon>
            </Tooltip>
            {!compact && (
              <ListItemText
                primary={item.label}
                secondary={item.subtitle}
                primaryTypographyProps={{
                  sx: { fontWeight: 800, color: "#0F172A", lineHeight: 1.1 },
                }}
                secondaryTypographyProps={{
                  sx: {
                    color: "#64748B",
                    fontWeight: 600,
                    fontSize: "0.74rem",
                  },
                }}
              />
            )}
          </ListItemButton>
        );
      })}
    </List>
  </Box>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statsData, setStatsData] = useState<DashboardStats>({
    activeExams: 0,
    totalStudents: 0,
    submissionsToday: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [testsRes, usersRes, resultsRes] = await Promise.all([
          adminApi.getTests(),
          adminApi.getUsers(),
          adminApi.getResults(),
        ]);

        const tests = Array.isArray(testsRes.data)
          ? (testsRes.data as DashboardTest[])
          : [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const results = Array.isArray(resultsRes.data)
          ? (resultsRes.data as DashboardResult[])
          : [];

        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const tomorrowStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );

        const activeExams = tests.filter((test) => !!test.isActive).length;
        const submissionsToday = results.filter((result) => {
          const submittedAt = result?.submittedAt
            ? new Date(result.submittedAt)
            : null;
          return (
            submittedAt &&
            submittedAt >= todayStart &&
            submittedAt < tomorrowStart
          );
        }).length;

        setStatsData({
          activeExams,
          totalStudents: users.length,
          submissionsToday,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        setStatsData({
          activeExams: 0,
          totalStudents: 0,
          submissionsToday: 0,
        });
      }
    };

    fetchDashboardStats();
  }, []);

  const menuItems: AdminMenuItem[] = [
    {
      label: "Classes",
      subtitle: "Manage class groups",
      icon: Class,
      path: "/admin/classes",
      color: "#0EA5E9",
    },
    {
      label: "Create Users",
      subtitle: "Add new students",
      icon: PersonAddAlt1,
      path: "/admin/create-user",
      color: "#6366F1",
    },
    {
      label: "Questions Bank",
      subtitle: "Browse question pool",
      icon: LibraryBooks,
      path: "/admin/question-bank",
      color: "#8B5CF6",
    },
    {
      label: "Create Test",
      subtitle: "Build a new test",
      icon: AddTask,
      path: "/admin/test-builder",
      color: "#EC4899",
    },
    {
      label: "Manage Test",
      subtitle: "Edit active tests",
      icon: FactCheck,
      path: "/admin/tests",
      color: "#6366F1",
    },
    {
      label: "Instructions",
      subtitle: "Maintain instructions",
      icon: Description,
      path: "/admin/instructions",
      color: "#0EA5E9",
    },
    {
      label: "Result",
      subtitle: "Review outcomes",
      icon: Assessment,
      path: "/admin/results",
      color: "#10B981",
    },
    {
      label: "Import-Questions",
      subtitle: "Upload question sets",
      icon: UploadFile,
      path: "/admin/import-questions",
      color: "#64748B",
    },
  ];

  const stats = [
    {
      label: t("adminDashboard.insights.activeExams"),
      value: statsData.activeExams.toLocaleString(),
      icon: <Bolt sx={{ fontSize: 18 }} />,
      tone: "#0EA5E9",
    },
    {
      label: t("adminDashboard.insights.totalStudents"),
      value: statsData.totalStudents.toLocaleString(),
      icon: <Group sx={{ fontSize: 18 }} />,
      tone: "#6366F1",
    },
    {
      label: t("adminDashboard.insights.submissionsToday"),
      value: statsData.submissionsToday.toLocaleString(),
      icon: <Timeline sx={{ fontSize: 18 }} />,
      tone: "#10B981",
    },
  ];

  const sidebarWidth = sidebarOpen ? 296 : 80;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 8% 10%, rgba(56, 189, 248, 0.14), transparent 28%), radial-gradient(circle at 92% 0%, rgba(99, 102, 241, 0.18), transparent 35%), linear-gradient(180deg, #F8FBFF 0%, #EEF4FF 44%, #F9FAFB 100%)",
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            left: 0,
            top: 72,
            width: sidebarWidth,
            height: "calc(100vh - 72px)",
            borderRadius: 0,
            bgcolor: "rgba(255,255,255,0.84)",
            backdropFilter: "blur(18px)",
            zIndex: 1199,
            transition: "width 220ms ease",
            overflow: "hidden",
            boxShadow: "8px 0 28px rgba(15, 23, 42, 0.06)",
          }}
        >
          <SidebarContent
            compact={!sidebarOpen}
            menuItems={menuItems}
            onItemClick={(path) => navigate(path)}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        </Paper>
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 300,
            boxSizing: "border-box",
            bgcolor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(18px)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={() => setMobileOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <SidebarContent
          menuItems={menuItems}
          onItemClick={(path) => navigate(path)}
          onNavigate={() => setMobileOpen(false)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      </Drawer>

      <Box
        sx={{
          ml: { md: `${sidebarWidth}px` },
          transition: "margin-left 220ms ease",
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            pt: { xs: 2.2, md: 3 },
            pb: { xs: 6, md: 10 },
          }}
        >
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              justifyContent: "flex-end",
              mb: 1.5,
            }}
          >
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
              }}
            >
              <Menu />
            </IconButton>
          </Box>

          <Paper
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: { xs: 4, md: 6 },
              p: { xs: 3, sm: 4, md: 5 },
              color: "#F8FAFC",
              background:
                "linear-gradient(140deg, #0B1228 0%, #162240 48%, #1D2D5A 100%)",
              border: "1px solid rgba(148, 163, 184, 0.22)",
              boxShadow: "0 28px 48px rgba(15, 23, 42, 0.28)",
              animation: "fadeUp 420ms ease-out",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.2), transparent 34%), radial-gradient(circle at 90% 8%, rgba(129, 140, 248, 0.24), transparent 36%)",
                pointerEvents: "none",
              }}
            />

            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              gap={3}
              sx={{ position: "relative" }}
            >
              <Box sx={{ maxWidth: 760 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.2}
                  sx={{ mb: 1.5 }}
                >
                  <Shield sx={{ fontSize: 20, color: "#7DD3FC" }} />
                  <Typography
                    variant="overline"
                    sx={{
                      color: "#BAE6FD",
                      fontWeight: 700,
                      letterSpacing: 1.8,
                      fontFamily: '"Inter", "Segoe UI", sans-serif',
                    }}
                  >
                    {t("adminDashboard.hero.overline")}
                  </Typography>
                </Stack>

                <Typography
                  component="h1"
                  sx={{
                    color: "#FFFFFF",
                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3.4rem" },
                    lineHeight: 1.05,
                    letterSpacing: "-0.04em",
                    mb: 1.4,
                    fontWeight: 900,
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                  }}
                >
                  {t("adminDashboard.hero.title")}
                </Typography>

                <Typography
                  sx={{
                    color: "#BFDBFE",
                    fontSize: { xs: "0.98rem", md: "1.12rem" },
                    lineHeight: 1.65,
                    maxWidth: 640,
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                  }}
                >
                  {t("adminDashboard.hero.subtitle")}
                </Typography>
              </Box>

              <Stack
                spacing={1.1}
                alignSelf={{ xs: "flex-start", md: "center" }}
              >
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 16 }} />}
                  label="Role: Administrator"
                  sx={{
                    bgcolor: "rgba(15, 23, 42, 0.45)",
                    color: "#E2E8F0",
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    "& .MuiChip-icon": { color: "#93C5FD" },
                  }}
                />
                <Chip
                  icon={<Assessment sx={{ fontSize: 16 }} />}
                  label="Live Monitoring Enabled"
                  sx={{
                    bgcolor: "rgba(8, 47, 73, 0.48)",
                    color: "#BAE6FD",
                    border: "1px solid rgba(56, 189, 248, 0.35)",
                    "& .MuiChip-icon": { color: "#7DD3FC" },
                  }}
                />
              </Stack>
            </Stack>
          </Paper>

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            sx={{ mt: { xs: 1, md: 2 } }}
          >
            {menuItems.map((item, index) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={item.path}>
                {(() => {
                  const Icon = item.icon;
                  return (
                    <Paper
                      elevation={0}
                      onClick={() => navigate(item.path)}
                      sx={{
                        p: { xs: 2.5, md: 3.2 },
                        height: "100%",
                        borderRadius: 4,
                        border: `1px solid ${alpha("#1E293B", 0.08)}`,
                        cursor: "pointer",
                        background:
                          "linear-gradient(170deg, #FFFFFF 0%, #F8FAFC 100%)",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        transition:
                          "transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                        animation: "fadeUp 420ms ease-out",
                        animationDelay: `${index * 70}ms`,
                        animationFillMode: "both",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          insetInline: 0,
                          top: 0,
                          height: 3,
                          background: `linear-gradient(90deg, ${item.color}, ${alpha(item.color, 0.22)})`,
                          opacity: 0,
                          transition: "opacity 240ms ease",
                        },
                        "&:hover": {
                          transform: "translateY(-6px)",
                          borderColor: alpha(item.color, 0.45),
                          boxShadow: `0 16px 36px ${alpha(item.color, 0.2)}`,
                        },
                        "&:hover::after": {
                          opacity: 1,
                        },
                        "&:hover .dashboard-icon-wrap": {
                          bgcolor: item.color,
                          color: "#FFFFFF",
                          transform: "scale(1.04)",
                        },
                      }}
                    >
                      <Box
                        className="dashboard-icon-wrap"
                        sx={{
                          width: 54,
                          height: 54,
                          borderRadius: 3,
                          bgcolor: alpha(item.color, 0.14),
                          color: item.color,
                          display: "grid",
                          placeItems: "center",
                          mb: 2.2,
                          transition: "all 240ms ease",
                        }}
                      >
                        <Icon sx={{ fontSize: 28 }} />
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          color: "#0F172A",
                          fontWeight: 800,
                          lineHeight: 1.25,
                          letterSpacing: "-0.02em",
                          mb: 0.6,
                          fontFamily: '"Inter", "Segoe UI", sans-serif',
                        }}
                      >
                        {item.label}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#475569",
                          lineHeight: 1.55,
                          fontSize: "0.92rem",
                          mb: 2.6,
                        }}
                      >
                        {item.subtitle}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.6}
                        sx={{ mt: "auto", color: item.color, fontWeight: 700 }}
                      >
                        <Typography
                          sx={{ fontSize: "0.83rem", letterSpacing: 0.2 }}
                        >
                          {t("adminDashboard.launchModule")}
                        </Typography>
                      </Stack>
                    </Paper>
                  );
                })()}
              </Grid>
            ))}
          </Grid>

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            sx={{ mt: { xs: 0.4, md: 1.4 } }}
          >
            {stats.map((stat, index) => (
              <Grid item xs={12} md={4} key={stat.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.4,
                    borderRadius: 4,
                    border: `1px solid ${alpha(stat.tone, 0.24)}`,
                    background: `linear-gradient(150deg, ${alpha(stat.tone, 0.12)} 0%, #FFFFFF 70%)`,
                    boxShadow: `0 8px 24px ${alpha(stat.tone, 0.12)}`,
                    animation: "fadeUp 420ms ease-out",
                    animationDelay: `${(index + 4) * 80}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      sx={{
                        color: "#334155",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(stat.tone, 0.15),
                        color: stat.tone,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.8,
                      color: "#0F172A",
                      fontSize: { xs: "1.7rem", md: "2rem" },
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;
