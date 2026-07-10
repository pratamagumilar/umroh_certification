'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Snackbar, Alert, Paper, InputAdornment, Stack, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

interface AbsensiEvent {
  id: string;
  title: string;
  description?: string;
  kodeAbsen: string;
  createdAt: string;
  _count: { attendances: number };
}

interface AttendanceRecord {
  id: string;
  participant: { name: string; kodePeserta: string; email: string };
  method: string;
  scanTime: string;
}

export default function PanitiaAbsensiPage() {
  const [events, setEvents] = useState<AbsensiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AbsensiEvent | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [kodeInput, setKodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info'}>({open: false, message: '', severity: 'info'});

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/panitia/absensi');
      if (!res.ok) throw new Error('Gagal');
      setEvents(await res.json());
    } catch {
      showSnackbar('Gagal memuat data absensi', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async (eventId: string) => {
    try {
      const res = await fetch('/api/panitia/absensi/record?eventId=' + eventId);
      if (!res.ok) throw new Error('Gagal');
      setRecords(await res.json());
    } catch {
      showSnackbar('Gagal memuat daftar hadir', 'error');
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreateEvent = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/panitia/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal'); }
      showSnackbar('Event absensi berhasil dibuat', 'success');
      setCreateOpen(false); setNewTitle(''); setNewDesc('');
      fetchEvents();
    } catch (err: unknown) {
      showSnackbar(err instanceof Error ? err.message : 'Gagal membuat event', 'error');
    } finally { setCreating(false); }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Hapus event absensi ini?')) return;
    try {
      await fetch('/api/panitia/absensi/' + eventId, { method: 'DELETE' });
      showSnackbar('Event absensi dihapus', 'success');
      fetchEvents();
    } catch { showSnackbar('Gagal menghapus event', 'error'); }
  };

  const handleOpenScan = (event: AbsensiEvent) => {
    setSelectedEvent(event); setScanOpen(true); setKodeInput(''); setRecords([]);
    fetchRecords(event.id);
  };

  const handleScan = async () => {
    if (!kodeInput.trim() || !selectedEvent) return;
    setScanning(true);
    try {
      const res = await fetch('/api/panitia/absensi/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent.id, kodePeserta: kodeInput.trim(), method: 'MANUAL' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) showSnackbar('Peserta ' + (data.participant?.name || '') + ' sudah hadir', 'info');
        else showSnackbar(data.error || 'Gagal', 'error');
      } else {
        showSnackbar('Absensi berhasil: ' + data.record.participant.name, 'success');
        setKodeInput(''); fetchRecords(selectedEvent.id); fetchEvents();
      }
    } catch { showSnackbar('Gagal mencatat absensi', 'error'); }
    finally { setScanning(false); }
  };

  const copyKode = (kode: string) => { navigator.clipboard.writeText(kode); showSnackbar('Kode absen disalin', 'success'); };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Absensi Peserta</Typography>
          <Typography variant="body1" color="text.secondary">Kelola event absensi dan catat kehadiran peserta</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Buat Event</Button>
      </Box>

      {events.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, borderRadius: 4 }}>
          <CardContent>
            <QrCodeScannerIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Belum ada event absensi</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ mt: 2 }}>Buat Event Pertama</Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {events.map((event) => (
            <Card key={event.id} sx={{ borderRadius: 4, '&:hover': { boxShadow: 4 } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{event.title}</Typography>
                    {event.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{event.description}</Typography>}
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleDeleteEvent(event.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Kode:</Typography>
                  <Chip label={event.kodeAbsen} size="small" onDelete={() => copyKode(event.kodeAbsen)} deleteIcon={<ContentCopyIcon fontSize="small" />} sx={{ fontWeight: 700, letterSpacing: '0.05em' }} />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip icon={<HowToRegIcon />} label={event._count.attendances + ' Hadir'} variant="outlined" size="small" color={event._count.attendances > 0 ? 'success' : 'default'} />
                  <Button variant="contained" size="small" startIcon={<QrCodeScannerIcon />} onClick={() => handleOpenScan(event)}>Scan / Catat</Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Event Absensi Baru</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Judul Event" placeholder="Contoh: Sesi Pagi Hari 1" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} fullWidth required />
            <TextField label="Deskripsi (opsional)" placeholder="Lokasi, waktu, dll." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreateEvent} disabled={!newTitle.trim() || creating}>{creating ? <CircularProgress size={20} /> : 'Buat'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scanOpen} onClose={() => setScanOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>Catat Kehadiran - {selectedEvent?.title}<Typography variant="body2" color="text.secondary">Kode Absen: {selectedEvent?.kodeAbsen}</Typography></Box>
          <IconButton onClick={() => setScanOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Masukkan Kode Peserta atau Scan QR</Typography>
              <TextField placeholder="Masukkan kode peserta (contoh: PSR-0001)" value={kodeInput} onChange={(e) => setKodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScan()} fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end"><Button variant="contained" size="small" onClick={handleScan} disabled={!kodeInput.trim() || scanning}>{scanning ? <CircularProgress size={20} /> : 'Catat Hadir'}</Button></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { pr: 1 } }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Daftar Hadir ({records.length})</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Peserta</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Kode</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Metode</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Waktu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Belum ada peserta hadir</TableCell></TableRow>
                    ) : records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.participant.name}</TableCell>
                        <TableCell><Chip label={r.participant.kodePeserta} size="small" variant="outlined" /></TableCell>
                        <TableCell><Chip label={r.method === 'QR_SCAN' ? 'QR' : 'Manual'} size="small" color={r.method === 'QR_SCAN' ? 'primary' : 'default'} /></TableCell>
                        <TableCell>{new Date(r.scanTime).toLocaleTimeString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
