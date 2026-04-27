import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, DeleteOutline, EditOutlined, PlaylistAddCheck } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';

type Instruction = {
  id: number;
  text: string;
  isActive: boolean;
  createdAt: string;
};

const ManageInstructions = () => {
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editActive, setEditActive] = useState(true);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInstructions();
      setInstructions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load instruction bank.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const handleCreate = async () => {
    const value = text.trim();
    if (!value) {
      setMessage({ type: 'error', text: 'Instruction text is required.' });
      return;
    }

    try {
      await adminApi.createInstruction({ text: value, isActive: true });
      setText('');
      setMessage({ type: 'success', text: 'Instruction created successfully.' });
      await fetchInstructions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create instruction.' });
    }
  };

  const openEdit = (item: Instruction) => {
    setEditId(item.id);
    setEditText(item.text);
    setEditActive(item.isActive);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;

    const value = editText.trim();
    if (!value) {
      setMessage({ type: 'error', text: 'Instruction text is required.' });
      return;
    }

    try {
      await adminApi.updateInstruction(editId, { text: value, isActive: editActive });
      setEditOpen(false);
      setMessage({ type: 'success', text: 'Instruction updated successfully.' });
      await fetchInstructions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update instruction.' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteInstruction(id);
      setMessage({ type: 'success', text: 'Instruction deleted successfully.' });
      await fetchInstructions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to delete instruction.' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
      <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 5 }}>
        <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin')} sx={{ mb: 1, fontWeight: 700 }}>
            Dashboard
          </Button>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PlaylistAddCheck sx={{ color: '#2563EB' }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>
              Instruction Bank
            </Typography>
          </Stack>
          <Typography sx={{ mt: 1, color: '#64748B' }}>
            Create reusable instruction lines and attach them to tests.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
        {message.text && (
          <Alert
            severity={message.type as 'success' | 'error'}
            sx={{ mb: 3 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Add Instruction
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Instruction text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: Read all questions carefully before submitting."
            />
            <Button variant="contained" sx={{ px: 4, fontWeight: 800 }} onClick={handleCreate}>
              Add
            </Button>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {instructions.map((item) => (
            <Grid item xs={12} key={item.id}>
              <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{item.text}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Status: {item.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button color="error" variant="outlined" startIcon={<DeleteOutline />} onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {!loading && instructions.length === 0 && (
          <Paper sx={{ p: 5, mt: 2, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1' }}>
            <Typography sx={{ color: '#64748B' }}>No instructions created yet.</Typography>
          </Paper>
        )}
      </Container>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Instruction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth label="Instruction text" value={editText} onChange={(e) => setEditText(e.target.value)} />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>Inactive</Typography>
              <Switch checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              <Typography>Active</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageInstructions;
