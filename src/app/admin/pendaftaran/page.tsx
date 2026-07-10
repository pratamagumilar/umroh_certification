'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface PendaftaranItem {
  id: string;
  email: string;
  namaGelar: string;
  namaTanpaGelar: string;
  tempatLahir: string;
  nik: string;
  noHp: string;
  unitKerja: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: { id: string; name: string } | null;
  _count: { dokumen: number };
}

interface PendaftaranDetail extends PendaftaranItem {
  tanggalLahir: string;
  jenisKelamin: string;
  alamatTinggal: string;
  provinsi: string;
  jabatan: string;
  alamatKantor: string;
  pendidikanTerakhir: string;
  namaUniversitas: string;
  ukuranBaju: string;
  alasanReject: string | null;
  dokumen: Array<{
    id: string;
    tipeDokumen: string;
    fileUrl: string;
    namaAsli: string;
    mimeType: string;
  }>;
  user: { id: string; name: string; email: string } | null;
}

const statusColors: Record<string, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

const docLabels: Record<string, string> = {
  PHOTO_3X4: 'Photo 3x4',
  IJAZAH: 'Ijazah',
  KTP: 'KTP',
  KARTU_KELUARGA: 'Kartu Keluarga',
  PASPOR: 'Paspor',
  VISA: 'Visa',
  SURAT_SEHAT: 'Surat Sehat',
  SURAT_PERNYATAAN: 'Surat Pernyataan',
  BUKTI_TRANSFER: 'Bukti Transfer',
};

export default function AdminPendaftaranPage() {
  const [data, setData] = useState<PendaftaranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<PendaftaranDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Approve / Reject dialog
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: 'APPROVE' | 'REJECT'; id: string }>({ open: false, action: 'APPROVE', id: '' });
  const [alasanReject, setAlasanReject] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRef = useRef<() => void>(null);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (search) params.set('search', search);
        params.set('page', String(page + 1));
        params.set('limit', String(rowsPerPage));

        const res = await fetch(`/api/admin/pendaftaran?${params}`);
        if (cancelled) return;
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        setData(json.data);
        setTotal(json.pagination.total);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    fetchRef.current = doFetch;
    return () => { cancelled = true; };
  }, [page, rowsPerPage, statusFilter, search]);

  const refreshData = useCallback(() => {
    fetchRef.current?.();
  }, []);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  const openDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/pendaftaran/${id}`);
      if (!res.ok) throw new Error('Gagal memuat detail');
      const json = await res.json();
      setDetail(json);
    } catch {
      setError('Gagal memuat detail pendaftaran');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/admin/pendaftaran/${actionDialog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionDialog.action,
          ...(actionDialog.action === 'REJECT' ? { alasanReject } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memproses');
      setActionDialog({ open: false, action: 'APPROVE', id: '' });
      setAlasanReject('');
      refreshData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal memproses');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Pendaftaran Peserta
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Kelola pendaftaran peserta baru
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={e => handleStatusChange(e.target.value)}
          size="small"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">Semua</MenuItem>
          <MenuItem value="PENDING">Menunggu</MenuItem>
          <MenuItem value="APPROVED">Disetujui</MenuItem>
          <MenuItem value="REJECTED">Ditolak</MenuItem>
        </TextField>
        <TextField
          label="Cari (nama, email, NIK)"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
        />
        <Button variant="outlined" onClick={handleSearch} size="small">
          Cari
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Nama</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>NIK</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Unit Kerja</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Dokumen</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tanggal Daftar</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  Tidak ada data pendaftaran
                </TableCell>
              </TableRow>
            ) : (
              data.map(item => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.namaGelar}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.tempatLahir}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.noHp}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2">{item.nik}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{item.unitKerja}</Typography></TableCell>
                  <TableCell>
                    <Chip label={`${item._count.dokumen}/9`} size="small" color={item._count.dokumen === 9 ? 'success' : 'warning'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[item.status] || item.status}
                      color={statusColors[item.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => openDetail(item.id)} title="Detail">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Baris per halaman"
        />
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Detail Pendaftaran
          {detail && (
            <Chip
              label={statusLabels[detail.status]}
              color={statusColors[detail.status]}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : detail ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Data Diri */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Data Diri</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Nama (Gelar)</Typography><Typography variant="body2">{detail.namaGelar}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Nama (Tanpa Gelar)</Typography><Typography variant="body2">{detail.namaTanpaGelar}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Tempat, Tgl Lahir</Typography><Typography variant="body2">{detail.tempatLahir}, {new Date(detail.tanggalLahir).toLocaleDateString('id-ID')}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">NIK</Typography><Typography variant="body2">{detail.nik}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Jenis Kelamin</Typography><Typography variant="body2">{detail.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">No HP</Typography><Typography variant="body2">{detail.noHp}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body2">{detail.email}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Alamat</Typography><Typography variant="body2">{detail.alamatTinggal}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Provinsi</Typography><Typography variant="body2">{detail.provinsi}</Typography></Box>
              </Box>

              {/* Data Kerja */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Data Kerja</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Unit Kerja</Typography><Typography variant="body2">{detail.unitKerja}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Jabatan</Typography><Typography variant="body2">{detail.jabatan}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Alamat Kantor</Typography><Typography variant="body2">{detail.alamatKantor}</Typography></Box>
              </Box>

              {/* Pendidikan */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Pendidikan</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Pendidikan Terakhir</Typography><Typography variant="body2">{detail.pendidikanTerakhir}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Universitas</Typography><Typography variant="body2">{detail.namaUniversitas}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Ukuran Baju</Typography><Typography variant="body2">{detail.ukuranBaju}</Typography></Box>
              </Box>

              {/* Dokumen */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>Dokumen ({detail.dokumen?.length || 0}/9)</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {detail.dokumen?.map(doc => (
                  <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={docLabels[doc.tipeDokumen] || doc.tipeDokumen} size="small" variant="outlined" />
                    <Button size="small" href={doc.fileUrl} target="_blank" rel="noopener">
                      Lihat
                    </Button>
                  </Box>
                ))}
              </Box>

              {/* Alasan Reject */}
              {detail.status === 'REJECTED' && detail.alasanReject && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Alasan Penolakan:</Typography>
                  {detail.alasanReject}
                </Alert>
              )}

              {/* Approval Info */}
              {detail.approvedBy && (
                <Typography variant="caption" color="text.secondary">
                  Diproses oleh: {detail.approvedBy.name} pada {detail.approvedAt ? new Date(detail.approvedAt).toLocaleString('id-ID') : '-'}
                </Typography>
              )}

              {/* Linked User */}
              {detail.user && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  User peserta sudah dibuat: {detail.user.name} ({detail.user.email})
                </Alert>
              )}
            </Box>
          ) : (
            <Typography color="error">Gagal memuat detail</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {detail && detail.status === 'PENDING' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => { setActionDialog({ open: true, action: 'REJECT', id: detail.id }); setAlasanReject(''); setDetailOpen(false); }}
              >
                Tolak
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => { setActionDialog({ open: true, action: 'APPROVE', id: detail.id }); setDetailOpen(false); }}
              >
                Setujui
              </Button>
            </>
          )}
          <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Approve / Reject Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, action: 'APPROVE', id: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {actionDialog.action === 'APPROVE' ? 'Setujui Pendaftaran' : 'Tolak Pendaftaran'}
        </DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}
          {actionDialog.action === 'APPROVE' ? (
            <Typography>
              Setujui pendaftaran ini? User peserta akan dibuat otomatis dan pendaftar dapat login.
            </Typography>
          ) : (
            <Box>
              <Typography sx={{ mb: 2 }}>
                Tolak pendaftaran ini? Tindakan ini tidak dapat dibatalkan.
              </Typography>
              <TextField
                label="Alasan Penolakan"
                value={alasanReject}
                onChange={e => setAlasanReject(e.target.value)}
                multiline
                rows={3}
                fullWidth
                required
                error={actionDialog.action === 'REJECT' && !alasanReject.trim()}
                helperText="Alasan wajib diisi saat menolak"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionDialog({ open: false, action: 'APPROVE', id: '' })} disabled={actionLoading}>
            Batal
          </Button>
          <Button
            variant="contained"
            color={actionDialog.action === 'APPROVE' ? 'success' : 'error'}
            onClick={handleAction}
            disabled={actionLoading || (actionDialog.action === 'REJECT' && !alasanReject.trim())}
          >
            {actionLoading ? <CircularProgress size={20} /> : actionDialog.action === 'APPROVE' ? 'Setujui' : 'Tolak'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}