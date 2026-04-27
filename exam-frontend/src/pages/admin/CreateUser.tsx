import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, Paper, Grid, Avatar, Chip, MenuItem, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import { PersonAdd, Group, UploadFile, ArrowBack, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material';
import { adminApi } from '../../api/endpoints';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

type CandidateUser = {
    id: number;
    name: string;
    username: string;
    email?: string;
    mobileNumber?: string;
    rollNumber?: string;
    pincode?: string;
    address?: string;
    classId?: number | null;
};

type UserImportHeader = {
    index: number;
    header: string;
};

type UserImportMapping = {
    fullName: number | '';
    email: number | '';
    mobileNumber: number | '';
    pincode: number | '';
    address: number | '';
    class: number | '';
};

type UserImportPreviewRow = {
    rowNumber: number;
    values: Record<string, string>;
    isValid: boolean;
    errors: string[];
};

type UserImportPreview = {
    sessionId: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rows: UserImportPreviewRow[];
    errors: string[];
};

type UserImportSummary = {
    totalRows: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    errors: string[];
};

const importFields: Array<{ key: keyof UserImportMapping; label: string; required: boolean }> = [
    { key: 'fullName', label: 'Full Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'mobileNumber', label: 'Mobile Number', required: true },
    { key: 'pincode', label: 'Pincode', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'class', label: 'Class', required: false },
];

const initialImportMapping: UserImportMapping = {
    fullName: '',
    email: '',
    mobileNumber: '',
    pincode: '',
    address: '',
    class: '',
};

const CreateUser = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const themeMode = useSelector((state: any) => state.theme?.mode || 'light');
    const isDark = themeMode === 'dark';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [pincode, setPincode] = useState('');
    const [address, setAddress] = useState('');
    const [classId, setClassId] = useState<number | ''>('');
    const [classes, setClasses] = useState<any[]>([]);
    const [users, setUsers] = useState<CandidateUser[]>([]);
    const [usersPage, setUsersPage] = useState(1);
    const [usersPageSize] = useState(10);
    const [usersTotalCount, setUsersTotalCount] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importSessionId, setImportSessionId] = useState('');
    const [importHeaders, setImportHeaders] = useState<UserImportHeader[]>([]);
    const [importMapping, setImportMapping] = useState<UserImportMapping>(initialImportMapping);
    const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
    const [importPreview, setImportPreview] = useState<UserImportPreview | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importSummary, setImportSummary] = useState<UserImportSummary | null>(null);
    const [importSkipInvalidRows, setImportSkipInvalidRows] = useState(false);
    const [importError, setImportError] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
    const [editingUser, setEditingUser] = useState<CandidateUser | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editMobileNumber, setEditMobileNumber] = useState('');
    const [editPincode, setEditPincode] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editClassId, setEditClassId] = useState<number | ''>('');

    const fetchUsers = async (page = usersPage) => {
        try {
            const res = await adminApi.getUsersPaged(page, usersPageSize);
            const items = Array.isArray(res.data?.items) ? res.data.items : [];
            const normalized: CandidateUser[] = items.map((u: any) => ({
                id: u.id ?? u.Id,
                name: u.name ?? u.Name ?? '',
                username: u.username ?? u.Username ?? '',
                email: u.email ?? u.Email,
                mobileNumber: u.mobileNumber ?? u.MobileNumber ?? u.mobile ?? u.phoneNumber,
                rollNumber: u.rollNumber ?? u.RollNumber,
                pincode: u.pincode ?? u.Pincode,
                address: u.address ?? u.Address,
                classId: u.classId ?? u.ClassId ?? null,
            }));
            setUsers(normalized);
            setUsersTotalCount(typeof res.data?.totalCount === 'number' ? res.data.totalCount : normalized.length);

            if (page > 1 && normalized.length === 0 && (res.data?.totalCount ?? 0) > 0) {
                setUsersPage(page - 1);
            }
        } catch (err) { }
    };

    useEffect(() => { fetchUsers(usersPage); }, [usersPage]);

    const fetchClasses = async () => {
        try {
            const res = await adminApi.getClasses();
            setClasses(res.data);
        } catch (err) { }
    };

    useEffect(() => { fetchClasses(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const normalizedMobile = mobileNumber.replace(/\D/g, '').slice(-10);
            if (normalizedMobile.length !== 10) {
                setMessage({ type: 'error', text: t('api.MOBILE_REQUIRED') });
                setLoading(false);
                return;
            }

            const res = await adminApi.createUser({
                fullName: name,
                email,
                mobileNumber: normalizedMobile,
                pincode: pincode.trim() || null,
                address: address.trim() || null,
                classId: classId === '' ? null : classId
            });
            const createdUsername = res.data?.username;
            const createdRollNumber = res.data?.rollNumber;
            const successText = createdUsername
                ? `${t('invite.userCreatedForOtpSuccess')} ${t('invite.generatedUsername')}: ${createdUsername}${createdRollNumber ? ` | ${t('invite.rollNumber')}: ${createdRollNumber}` : ''}`
                : t('invite.userCreatedForOtpSuccess');
            setMessage({ type: 'success', text: successText });
            setName(''); setEmail(''); setMobileNumber(''); setPincode(''); setAddress(''); setClassId('');
            fetchUsers(usersPage);
        } catch (err: any) {
            const messageKey = err?.response?.data?.messageKey;
            const backendMessage = err?.response?.data?.message;
            if (messageKey && messageKey !== 'ERROR_UNKNOWN' && t(`api.${messageKey}`) !== `api.${messageKey}`) {
                setMessage({ type: 'error', text: t(`api.${messageKey}`) });
            } else {
                const fallback = err?.message ? `${t('invite.createUserFailed')} (${err.message})` : t('invite.createUserFailed');
                setMessage({ type: 'error', text: backendMessage || fallback });
            }
        } finally {
            setLoading(false);
        }
    };

    const validateImportMapping = () => {
        const requiredFields: Array<keyof UserImportMapping> = ['fullName', 'email', 'mobileNumber'];

        for (const field of requiredFields) {
            if (importMapping[field] === '') {
                const label = importFields.find((item) => item.key === field)?.label ?? field;
                return `Please map ${label}.`;
            }
        }

        const selectedColumns = Object.values(importMapping).filter((value) => value !== '') as number[];
        if (new Set(selectedColumns).size !== selectedColumns.length) {
            return 'Duplicate column mapping is not allowed.';
        }

        return null;
    };

    const buildImportMappingPayload = () => ({
        fullName: importMapping.fullName === '' ? null : importMapping.fullName,
        email: importMapping.email === '' ? null : importMapping.email,
        mobileNumber: importMapping.mobileNumber === '' ? null : importMapping.mobileNumber,
        pincode: importMapping.pincode === '' ? null : importMapping.pincode,
        address: importMapping.address === '' ? null : importMapping.address,
        class: importMapping.class === '' ? null : importMapping.class,
    });

    const resetImportFlow = () => {
        setImportFile(null);
        setImportSessionId('');
        setImportHeaders([]);
        setImportMapping(initialImportMapping);
        setImportStep('upload');
        setImportPreview(null);
        setImportSummary(null);
        setImportSkipInvalidRows(false);
        setImportError('');
    };

    const handleInspectUserColumns = async () => {
        if (!importFile) {
            setMessage({ type: 'error', text: 'Please choose a CSV/XLSX file first.' });
            return;
        }

        setImportLoading(true);
        setImportError('');
        setImportSummary(null);
        setImportPreview(null);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            const res = await adminApi.initializeUserImport(formData);
            setImportSessionId(res.data.sessionId);
            setImportHeaders(res.data.headers ?? []);
            setImportMapping(initialImportMapping);
            setImportStep('mapping');
        } catch (err: any) {
            setImportError(err.response?.data?.message || 'Failed to inspect columns.');
        } finally {
            setImportLoading(false);
        }
    };

    const handlePreviewUserImport = async () => {
        const validationError = validateImportMapping();
        if (validationError) {
            setImportError(validationError);
            return;
        }

        if (!importSessionId) {
            setImportError('Import session expired. Please upload the file again.');
            return;
        }

        setImportLoading(true);
        setImportError('');

        try {
            const res = await adminApi.previewUserImport({
                sessionId: importSessionId,
                mapping: buildImportMappingPayload(),
                skipInvalidRows: importSkipInvalidRows,
            });

            setImportPreview(res.data);
            setImportStep('preview');
        } catch (err: any) {
            setImportError(err.response?.data?.message || 'Failed to preview the import.');
        } finally {
            setImportLoading(false);
        }
    };

    const handleConfirmUserImport = async () => {
        const validationError = validateImportMapping();
        if (validationError) {
            setImportError(validationError);
            return;
        }

        if (!importSessionId) {
            setImportError('Import session expired. Please upload the file again.');
            return;
        }

        setImportLoading(true);
        setImportError('');

        try {
            const res = await adminApi.confirmUserImport({
                sessionId: importSessionId,
                mapping: buildImportMappingPayload(),
                skipInvalidRows: importSkipInvalidRows,
            });

            setImportSummary(res.data);
            setImportStep('result');
            setMessage({
                type: 'success',
                text: `Import complete: ${res.data.successCount} created, ${res.data.failedCount} failed.`
            });
            fetchUsers(usersPage);
        } catch (err: any) {
            setImportError(err.response?.data?.message || 'Failed to import users.');
        } finally {
            setImportLoading(false);
        }
    };

    const handleImportMappingChange = (field: keyof UserImportMapping, value: string) => {
        setImportMapping((current) => ({
            ...current,
            [field]: value === '' ? '' : Number(value),
        }));
    };

    const handleOpenEdit = (user: CandidateUser) => {
        setEditingUser(user);
        setEditName(user.name ?? '');
        setEditEmail(user.email ?? '');
        setEditMobileNumber((user.mobileNumber ?? '').replace(/\D/g, '').slice(-10));
        setEditPincode((user.pincode ?? '').toUpperCase());
        setEditAddress(user.address ?? '');
        setEditClassId(user.classId ?? '');
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
        setEditingUser(null);
        setEditName('');
        setEditEmail('');
        setEditMobileNumber('');
        setEditPincode('');
        setEditAddress('');
        setEditClassId('');
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        const normalizedMobile = editMobileNumber.replace(/\D/g, '').slice(-10);
        if (normalizedMobile.length !== 10) {
            setMessage({ type: 'error', text: t('api.MOBILE_REQUIRED') });
            return;
        }

        setEditLoading(true);
        try {
            await adminApi.updateUser(editingUser.id, {
                fullName: editName,
                email: editEmail,
                mobileNumber: normalizedMobile,
                pincode: editPincode.trim() || null,
                address: editAddress.trim() || null,
                classId: editClassId === '' ? null : editClassId
            });
            setMessage({ type: 'success', text: 'User updated successfully.' });
            handleCloseEdit();
            fetchUsers(usersPage);
        } catch (err: any) {
            const backendMessage = err?.response?.data?.message;
            setMessage({ type: 'error', text: backendMessage || 'Failed to update user.' });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteUser = async (user: CandidateUser) => {
        const ok = window.confirm(`Delete user "${user.name}"? This action cannot be undone.`);
        if (!ok) return;

        setDeleteLoadingId(user.id);
        try {
            await adminApi.deleteUser(user.id);
            setMessage({ type: 'success', text: 'User deleted successfully.' });
            fetchUsers();
        } catch (err: any) {
            const backendMessage = err?.response?.data?.message;
            setMessage({ type: 'error', text: backendMessage || 'Failed to delete user.' });
        } finally {
            setDeleteLoadingId(null);
        }
    };

    const handleDownloadUsersExcel = async () => {
        try {
            const res = await adminApi.downloadUsersExcel();
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const disposition = res.headers?.['content-disposition'] as string | undefined;
            const fileNameFromHeader = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
            link.href = url;
            link.download = fileNameFromHeader || `users-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setMessage({ type: 'error', text: 'Failed to download users Excel.' });
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: isDark ? '#000000' : '#F8FAFC',
                color: isDark ? '#FFFFFF' : 'inherit',
                pb: 10,
                '& .MuiPaper-root': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.28) !important' : undefined,
                },
                '& .MuiTypography-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiOutlinedInput-root, & .MuiInputBase-root, & .MuiSelect-select': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                },
                '& .MuiOutlinedInput-notchedOutline, & .MuiDivider-root, & .MuiTableCell-root': {
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.32) !important' : undefined,
                },
                '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableCell-root': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                },
                '& .MuiTableRow-root:hover': {
                    backgroundColor: isDark ? '#111111 !important' : undefined,
                },
                '& .MuiButton-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiButton-outlined, & .MuiButton-contained': {
                    backgroundColor: isDark ? '#000000' : undefined,
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.35)' : undefined,
                },
                '& .MuiChip-root, & .MuiAvatar-root, & .MuiCheckbox-root': {
                    color: isDark ? '#FFFFFF' : undefined,
                },
                '& .MuiDialog-paper': {
                    backgroundColor: isDark ? '#000000 !important' : undefined,
                    color: isDark ? '#FFFFFF !important' : undefined,
                },
            }}
        >
            {/* Page Header */}
            <Box sx={{ bgcolor: isDark ? '#000000' : '#FFFFFF', borderBottom: '1px solid #E2E8F0', py: 4, mb: 6 }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/admin')}
                        sx={{ mb: 1, color: isDark ? '#E2E8F0' : '#64748B', fontWeight: 700 }}
                    >
                        Back to Dashboard
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Group sx={{ color: '#6366F1', mr: 1 }} />
                        <Typography variant="overline" sx={{ fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5 }}>Administration</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: isDark ? '#FFFFFF' : '#0F172A' }}>Candidate Management</Typography>
                </Container>
            </Box>

            <Container maxWidth={false} sx={{ px: { xs: 3, md: 6, lg: 10 } }}>
                <Grid container spacing={5}>
                    {/* Form Section */}
                    <Grid item xs={12} lg={4}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #E2E8F0', boxShadow: isDark ? '0 10px 32px rgba(0,0,0,0.65)' : '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                                <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', mr: 2 }}>
                                    <PersonAdd />
                                </Avatar>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>Provision Account</Typography>
                            </Box>

                            {message.text && (
                                <Alert 
                                    severity={message.type as 'success'|'error'} 
                                    sx={{ mb: 4, borderRadius: 3, fontWeight: 700 }}
                                    onClose={() => setMessage({ type: '', text: '' })}
                                >
                                    {message.text}
                                </Alert>
                            )}
                            
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 3, flexDirection: 'column' }}>
                                <TextField 
                                    label={t('invite.fullName')} required variant="outlined" fullWidth
                                    value={name} onChange={e => setName(e.target.value)} 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField 
                                    label={t('invite.email')} required variant="outlined" fullWidth type="email"
                                    value={email} onChange={e => setEmail(e.target.value)} 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField
                                    label={t('invite.mobileNumber')}
                                    variant="outlined"
                                    fullWidth
                                    required
                                    value={mobileNumber}
                                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    inputProps={{ maxLength: 10 }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField
                                    label={t('invite.pincode')}
                                    variant="outlined"
                                    fullWidth
                                    value={pincode}
                                    onChange={e => setPincode(e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 10))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField
                                    label={t('invite.address')}
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField
                                    select
                                    label={t('invite.classOptional')}
                                    fullWidth
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value === '' ? '' : Number(e.target.value))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                >
                                    <MenuItem value="">{t('invite.defaultClass')}</MenuItem>
                                    {classes.map((c: any) => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </TextField>
                                <Button 
                                    variant="contained" 
                                    type="submit" 
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 2, py: 1.8, borderRadius: 3, fontWeight: 800, boxShadow: isDark ? '0 10px 18px rgba(0,0,0,0.7)' : '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
                                >
                                    {loading ? t('invite.creatingUser') : t('invite.createUser')}
                                </Button>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                                    {t('invite.rollNumberAuto')}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: '#0F172A' }}>
                                Bulk Import (CSV/XLSX)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mb: 2 }}>
                                Upload CSV or XLSX, inspect headers, then map Full Name, Email, Mobile Number, optional Pincode, Address, and Class.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<UploadFile />}
                                    sx={{ borderRadius: 2.5, fontWeight: 700 }}
                                >
                                    Choose CSV/XLSX
                                    <input
                                        type="file"
                                        accept=".csv,.xlsx"
                                        hidden
                                        onChange={(e) => {
                                            setImportFile(e.target.files?.[0] ?? null);
                                            setImportSessionId('');
                                            setImportHeaders([]);
                                            setImportMapping(initialImportMapping);
                                            setImportStep('upload');
                                            setImportPreview(null);
                                            setImportSummary(null);
                                            setImportError('');
                                        }}
                                    />
                                </Button>
                                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
                                    {importFile ? importFile.name : 'No file selected'}
                                </Typography>
                            </Box>

                            <Button
                                variant="contained"
                                onClick={handleInspectUserColumns}
                                disabled={importLoading || !importFile}
                                sx={{ mt: 2, py: 1.2, borderRadius: 2.5, fontWeight: 800 }}
                            >
                                {importLoading ? 'Inspecting...' : 'Inspect Headers'}
                            </Button>

                            {importError && (
                                <Alert severity="error" sx={{ mt: 2, borderRadius: 3, fontWeight: 700 }}>
                                    {importError}
                                </Alert>
                            )}

                            {importStep === 'mapping' && (
                                <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: isDark ? '#000000' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>Manual Column Mapping</Typography>
                                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mb: 2 }}>
                                        Match each system field to one file header.
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {importFields.map((field) => (
                                            <TextField
                                                key={field.key}
                                                select
                                                label={`${field.label}${field.required ? ' *' : ''}`}
                                                value={importMapping[field.key]}
                                                onChange={(e) => handleImportMappingChange(field.key, e.target.value)}
                                                fullWidth
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                            >
                                                <MenuItem value="">Select header</MenuItem>
                                                {importHeaders.map((header) => (
                                                    <MenuItem key={header.index} value={header.index}>
                                                        {header.header || '(Blank header)'}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        ))}
                                    </Box>

                                    <FormControlLabel
                                        sx={{ mt: 1 }}
                                        control={
                                            <Checkbox
                                                checked={importSkipInvalidRows}
                                                onChange={(e) => setImportSkipInvalidRows(e.target.checked)}
                                            />
                                        }
                                        label="Skip invalid rows on confirm"
                                    />

                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                                        <Button variant="outlined" onClick={resetImportFlow} sx={{ fontWeight: 700 }}>
                                            Start Over
                                        </Button>
                                        <Box sx={{ flex: 1 }} />
                                        <Button variant="contained" onClick={handlePreviewUserImport} disabled={importLoading} sx={{ fontWeight: 800 }}>
                                            {importLoading ? 'Previewing...' : 'Preview Rows'}
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            {importStep === 'preview' && importPreview && (
                                <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: isDark ? '#000000' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>
                                        Rows: {importPreview.totalRows} | Valid: {importPreview.validRows} | Invalid: {importPreview.invalidRows}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mt: 0.5, mb: 2 }}>
                                        Preview is based on the selected header mapping.
                                    </Typography>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 280, overflowY: 'auto' }}>
                                        {importPreview.rows.map((row) => (
                                            <Box key={row.rowNumber} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#000000' : '#FFFFFF', border: '1px solid #E2E8F0' }}>
                                                <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>
                                                    Row {row.rowNumber} - {row.isValid ? 'Valid' : 'Invalid'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontWeight: 600, mt: 0.5 }}>
                                                    {Object.entries(row.values).map(([key, value]) => `${key}: ${value || '-'}`).join(' | ')}
                                                </Typography>
                                                {row.errors.length > 0 && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: '#B91C1C', fontWeight: 700, mt: 0.5 }}>
                                                        {row.errors.join(' • ')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Box>

                                    {importPreview.errors.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C', mb: 0.5 }}>
                                                Issues
                                            </Typography>
                                            {importPreview.errors.map((err, idx) => (
                                                <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#991B1B', fontWeight: 600 }}>
                                                    {err}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                                        <Button variant="outlined" onClick={() => setImportStep('mapping')} sx={{ fontWeight: 700 }}>
                                            Edit Mapping
                                        </Button>
                                        <Box sx={{ flex: 1 }} />
                                        <Button variant="contained" onClick={handleConfirmUserImport} disabled={importLoading} sx={{ fontWeight: 800 }}>
                                            {importLoading ? 'Importing...' : 'Confirm Import'}
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            {importStep === 'result' && importSummary && (
                                <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: isDark ? '#000000' : '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>
                                        Rows: {importSummary.totalRows} | Created: {importSummary.successCount} | Failed: {importSummary.failedCount} | Skipped: {importSummary.skippedCount}
                                    </Typography>
                                    {importSummary.errors.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C', mb: 0.5 }}>
                                                Issues
                                            </Typography>
                                            {importSummary.errors.slice(0, 8).map((err, idx) => (
                                                <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#991B1B', fontWeight: 600 }}>
                                                    {err}
                                                </Typography>
                                            ))}
                                            {importSummary.errors.length > 8 && (
                                                <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontWeight: 700 }}>
                                                    +{importSummary.errors.length - 8} more issues
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    <Button variant="outlined" onClick={resetImportFlow} sx={{ mt: 2, fontWeight: 700 }}>
                                        Import Another File
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* List Section */}
                    <Grid item xs={12} lg={8}>
                        <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #E2E8F0', bgcolor: isDark ? '#000000' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Active Candidates</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownloadUsersExcel}
                                        sx={{ fontWeight: 700, borderRadius: 2 }}
                                    >
                                        Download Excel
                                    </Button>
                                    <Chip label={`${usersTotalCount} Total Users`} size="small" sx={{ fontWeight: 700, borderRadius: 2 }} />
                                </Box>
                            </Box>
                            <TableContainer
                                sx={{
                                    borderRadius: 0,
                                    borderTop: '0',
                                    boxShadow: 'none',
                                    overflowX: 'auto',
                                    overflowY: 'hidden'
                                }}
                            >
                                <Table sx={{ minWidth: 780 }}>
                                    <TableHead sx={{ bgcolor: isDark ? '#000000' : '#F8FAFC' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569', width: 90 }}>NO.</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>ROLL NO.</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>CANDIDATE</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>USERNAME</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>MOBILE</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>PINCODE</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>ROLE</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#475569' }}>ACTIONS</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((u, idx) => {
                                            const serial = (usersPage - 1) * usersPageSize + idx + 1;
                                            return (
                                                <TableRow
                                                    key={u.id || idx}
                                                    sx={{ '&:hover': { bgcolor: isDark ? '#111111' : '#F1F5F9' }, transition: 'background 0.2s' }}
                                                >
                                                    <TableCell sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#334155' }}>{serial}</TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#334155' }}>{u.rollNumber || '-'}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2.2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 34, height: 34, bgcolor: isDark ? '#111111' : '#6366F1', fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                                                                {(u.name || '?').charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A' }}>{u.name}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 700, color: isDark ? '#FFFFFF' : '#334155' }}>{u.username}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 600, color: isDark ? '#E2E8F0' : '#64748B' }}>{u.mobileNumber || '-'}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 600, color: isDark ? '#E2E8F0' : '#64748B' }}>{u.pincode || '-'}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip label="User" size="small" sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: isDark ? '#000000' : '#F1F5F9', color: isDark ? '#FFFFFF' : undefined }} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box
                                                            sx={{
                                                                display: 'inline-flex',
                                                                gap: 1,
                                                                flexWrap: 'nowrap',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            <Tooltip title="Edit">
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleOpenEdit(u)}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title={deleteLoadingId === u.id ? 'Deleting...' : 'Delete'}>
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteUser(u)}
                                                                        disabled={deleteLoadingId === u.id}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {users.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8}>
                                                    <Box sx={{ p: 8, textAlign: 'center' }}>
                                                        <Typography sx={{ color: isDark ? '#CBD5E1' : 'text.secondary' }}>No students provisioned in the system.</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {usersTotalCount > usersPageSize && (
                                <Box sx={{ px: 4, py: 2.5, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center' }}>
                                    <Pagination
                                        color="primary"
                                        shape="rounded"
                                        page={usersPage}
                                        count={Math.max(1, Math.ceil(usersTotalCount / usersPageSize))}
                                        onChange={(_, page) => setUsersPage(page)}
                                    />
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800, bgcolor: isDark ? '#000000' : undefined, color: isDark ? '#FFFFFF' : undefined }}>Edit User</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label={t('invite.fullName')}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label={t('invite.email')}
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            fullWidth
                            type="email"
                            required
                        />
                        <TextField
                            label={t('invite.mobileNumber')}
                            value={editMobileNumber}
                            onChange={(e) => setEditMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            inputProps={{ maxLength: 10 }}
                            fullWidth
                            required
                        />
                        <TextField
                            label={t('invite.pincode')}
                            value={editPincode}
                            onChange={(e) => setEditPincode(e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 10))}
                            fullWidth
                        />
                        <TextField
                            label={t('invite.address')}
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />
                        <TextField
                            select
                            label={t('invite.classOptional')}
                            fullWidth
                            value={editClassId}
                            onChange={(e) => setEditClassId(e.target.value === '' ? '' : Number(e.target.value))}
                        >
                            <MenuItem value="">{t('invite.defaultClass')}</MenuItem>
                            {classes.map((c: any) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseEdit} variant="text">Cancel</Button>
                    <Button onClick={handleUpdateUser} variant="contained" disabled={editLoading}>
                        {editLoading ? 'Saving...' : 'Save changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreateUser;
