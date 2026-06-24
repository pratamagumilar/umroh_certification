'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSearchParams, useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const roleColors: Record<string, 'primary' | 'secondary' | 'success'> = {
  ADMIN: 'primary',
  PENGAWAS: 'secondary',
  PESERTA: 'success',
};

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || '';
  const router = useRouter();

  useEffect(() => {
    if (!searchParams.get('role')) {
      router.replace('/admin/users?role=PESERTA');
    }
  }, [roleParam, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('PESERTA');
  const [formPhone, setFormPhone] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = roleParam ? `/api/admin/users?role=${roleParam}` : '/api/admin/users';
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
    } catch {
      setError('Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  }, [roleParam]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    if (['ADMIN', 'PENGAWAS', 'PESERTA'].includes(roleParam)) {
      setFormRole(roleParam);
    } else {
      setFormRole('PESERTA');
    }
    setFormPhone('');
    setError('');
  };

  const handleCreate = async () => {
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          phone: formPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('User berhasil dibuat!');
        setCreateOpen(false);
        resetForm();
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal membuat user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    setError('');
    try {
      const body: Record<string, string> = {
        name: formName,
        email: formEmail,
        role: formRole,
        phone: formPhone,
      };
      if (formPassword) body.password = formPassword;

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('User berhasil diupdate!');
        setEditOpen(false);
        resetForm();
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal mengupdate user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('User berhasil dihapus!');
        setDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal menghapus user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.message || 'Gagal mengubah status user.');
      }
    } catch {
      setError('Gagal mengubah status user.');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Pilih file Excel terlebih dahulu.');
      return;
    }
    setFormLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Gagal mengimpor data.');
      } else {
        if (data.errors && data.errors.length > 0) {
          setError(`Berhasil: ${data.message}, namun ada error:\n${data.errors.join('\n')}`);
        } else {
          setSuccess(data.message);
          setImportOpen(false);
          setImportFile(null);
          setTimeout(() => setSuccess(''), 5000);
        }
        fetchUsers();
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderUserFormFields = () => (
    <>
      <TextField label="Nama Lengkap" fullWidth value={formName} onChange={(e) => setFormName(e.target.value)} required sx={{ mb: 2 }} />
      <TextField label="Email" type="email" fullWidth value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required sx={{ mb: 2 }} />
      <TextField
        label={editOpen ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
        type="password"
        fullWidth
        value={formPassword}
        onChange={(e) => setFormPassword(e.target.value)}
        required={!editOpen}
        sx={{ mb: 2 }}
      />

      <TextField label="No. Telepon (opsional)" fullWidth value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {roleParam ? `Kelola User: ${roleParam}` : 'Kelola Semua User'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Kelola akun {roleParam || 'Peserta, Pengawas, dan Admin'}.
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => { setImportFile(null); setError(''); setImportOpen(true); }}
            sx={{ borderRadius: '12px', mr: 2, bgcolor: '#fff' }}
          >
            Import Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setCreateOpen(true); }}
            sx={{ borderRadius: '12px' }}
          >
            Tambah User
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error && !importOpen && !createOpen && !editOpen && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, whiteSpace: 'pre-wrap' }}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Nama</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tanggal Dibuat</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                  Belum ada user.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={roleColors[user.role] || 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Switch
                        checked={user.isActive}
                        onChange={() => handleToggleActive(user)}
                        size="small"
                        color="success"
                      />
                      <Typography variant="caption" sx={{ ml: 0.5, color: user.isActive ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleEditOpen(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => { setSelectedUser(user); setDeleteOpen(true); }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Tambah User Baru</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderUserFormFields()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Import User dari Excel</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{error}</Alert>}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Pastikan file Excel Anda memiliki kolom berikut di baris pertama (header):
            <br />
            <strong>Nama | Email | Password | Role | Phone</strong>
            <br /><br />
            Catatan: Role harus berupa PESERTA, PENGAWAS, atau ADMIN.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ borderRadius: '12px', py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
          >
            {importFile ? importFile.name : 'Pilih File .xlsx'}
            <input
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setImportFile(e.target.files[0]);
                  setError('');
                }
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleImport} disabled={!importFile || formLoading}>
            {formLoading ? 'Memproses...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderUserFormFields()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Yakin ingin menghapus user <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={formLoading}>
            {formLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
      <AdminUsersContent />
    </Suspense>
  );
}
