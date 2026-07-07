'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Link as MuiLink
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LaunchIcon from '@mui/icons-material/Launch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface Material {
  id: string;
  title: string;
  description: string | null;
  pdfUrl: string;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    name: string;
  };
  _count: {
    courseSessions: number;
  };
}

import { getFileUrl } from '@/lib/getFileUrl';

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formActive, setFormActive] = useState(true);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/materials');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat materi.');
      setMaterials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat materi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPdfUrl('');
    setFormFile(null);
    setFormActive(true);
    setSelectedMaterial(null);
    setError('');
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = async () => {
    setFormLoading(true);
    setError('');
    try {
      let finalPdfUrl = formPdfUrl;
      
      if (formFile) {
        const uploadData = new FormData();
        uploadData.append('file', formFile);
        const uploadRes = await fetch('/api/uploads/materials', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.message || 'Gagal upload file.');
        finalPdfUrl = uploadResult.path;
      }

      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          pdfUrl: finalPdfUrl
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat materi.');
      setCreateOpen(false);
      resetForm();
      showSuccess('Master materi berhasil dibuat.');
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat materi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedMaterial) return;
    setFormLoading(true);
    setError('');
    try {
      let finalPdfUrl = formPdfUrl;
      
      if (formFile) {
        const uploadData = new FormData();
        uploadData.append('file', formFile);
        const uploadRes = await fetch('/api/uploads/materials', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.message || 'Gagal upload file.');
        finalPdfUrl = uploadResult.path;
      }

      const res = await fetch(`/api/admin/materials/${selectedMaterial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          pdfUrl: finalPdfUrl,
          isActive: formActive
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengupdate materi.');
      setEditOpen(false);
      resetForm();
      showSuccess('Master materi berhasil diupdate.');
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupdate materi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/materials/${selectedMaterial.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus materi.');
      setDeleteOpen(false);
      resetForm();
      showSuccess('Master materi berhasil dihapus.');
      fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus materi.');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (mat: Material) => {
    setSelectedMaterial(mat);
    setFormTitle(mat.title);
    setFormDescription(mat.description || '');
    setFormPdfUrl(mat.pdfUrl);
    setFormFile(null);
    setFormActive(mat.isActive);
    setEditOpen(true);
  };

  const openDeleteDialog = (mat: Material) => {
    setSelectedMaterial(mat);
    setDeleteOpen(true);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', mb: 0.5 }}>
            Master Materi Reusable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kumpulan modul pembelajaran PDF global yang bisa digunakan di banyak Course secara dinamis.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { resetForm(); setCreateOpen(true); }}
          sx={{ borderRadius: '12px', px: 3, py: 1.2, fontWeight: 700 }}
        >
          Buat Master Materi
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}
      {error && !createOpen && !editOpen && !deleteOpen && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : materials.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', bgcolor: '#faf9f6', color: '#78867a', border: '1px solid #e8e6df' }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Belum ada master materi.</Typography>
          <Typography variant="body2">Klik tombol "Buat Master Materi" untuk mendaftarkan materi PDF baru.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#faf9f6' }}>
                <TableCell sx={{ fontWeight: 700 }}>Judul Materi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PDF URL</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Terpakai di</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dibuat Oleh</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((mat) => (
                <TableRow key={mat.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#2c352d' }}>{mat.title}</Typography>
                    {mat.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mat.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <MuiLink href={getFileUrl(mat.pdfUrl)} target="_blank" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                      Lihat PDF <LaunchIcon fontSize="small" />
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${mat._count.courseSessions} Course`} color="secondary" size="small" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>{mat.createdBy.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={mat.isActive ? 'Aktif' : 'Nonaktif'}
                      color={mat.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => openEditDialog(mat)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => openDeleteDialog(mat)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Master Materi Reusable</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="Judul Materi"
            fullWidth
            required
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Deskripsi Singkat"
            fullWidth
            multiline
            minRows={2}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value.slice(0, 200))}
            helperText={`${formDescription.length}/200 karakter maksimal`}
            sx={{ mb: 2 }}
          />
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mb: 2, height: 56, justifyContent: 'flex-start', color: formFile ? 'primary.main' : 'text.secondary', borderColor: formFile ? 'primary.main' : 'divider', textTransform: 'none' }}
          >
            {formFile ? formFile.name : 'Upload PDF Materi *'}
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormFile(e.target.files[0]);
                }
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={formLoading || !formTitle.trim() || (!formPdfUrl.trim() && !formFile)}>
            Buat Materi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Master Materi</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="Judul Materi"
            fullWidth
            required
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Deskripsi Singkat"
            fullWidth
            multiline
            minRows={2}
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value.slice(0, 200))}
            helperText={`${formDescription.length}/200 karakter maksimal`}
            sx={{ mb: 2 }}
          />
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mb: 3, height: 56, justifyContent: 'flex-start', color: formFile ? 'primary.main' : 'text.secondary', borderColor: formFile ? 'primary.main' : 'divider', textTransform: 'none' }}
          >
            {formFile ? formFile.name : (formPdfUrl ? formPdfUrl.split('/').pop() : 'Upload PDF Materi *')}
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setFormFile(e.target.files[0]);
                }
              }}
            />
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>Status Aktif</Typography>
            <Switch checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit} disabled={formLoading || !formTitle.trim() || (!formPdfUrl.trim() && !formFile)}>
            Simpan Perubahan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Hapus Master Materi?</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            Apakah Anda yakin ingin menghapus materi <strong>{selectedMaterial?.title}</strong>?
          </Typography>
          {selectedMaterial && selectedMaterial._count.courseSessions > 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 600 }}>
              Peringatan: Materi ini terpakai di {selectedMaterial._count.courseSessions} kelas. Menghapus materi ini juga akan menghapus sesi terkait dari kelas-kelas tersebut secara permanen!
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={formLoading}>
            Hapus Permanen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
