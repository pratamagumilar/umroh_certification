'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Alert,
  CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface Submission {
  id: string;
  answer: string;
  submittedAt: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignment: {
    id: string;
    title: string;
    prompt: string;
    session: {
      material: {
        title: string;
      };
      course: {
        title: string;
      };
    };
  };
}

export default function PengawasMaterialGradingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog States
  const [gradeOpen, setGradeOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [formScore, setFormScore] = useState('');
  const [formFeedback, setFormFeedback] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pengawas/material-grading');
      if (!res.ok) throw new Error('Gagal memuat antrean penilaian.');
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleOpenGrade = (sub: Submission) => {
    setSelectedSubmission(sub);
    setFormScore('');
    setFormFeedback('');
    setError('');
    setGradeOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !formScore) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pengawas/material-grading/${selectedSubmission.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: formScore, feedback: formFeedback })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setSuccess('Penilaian berhasil disimpan!');
      setGradeOpen(false);
      fetchSubmissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan nilai.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', mb: 1 }}>
          Penilaian Tugas Pembelajaran
        </Typography>
        <Typography variant="body1" sx={{ color: '#78867a' }}>
          Daftar pengumpulan tugas esai peserta materi course yang perlu Anda nilai.
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
      {error && !gradeOpen && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#faf9f6' }}>
                <TableCell sx={{ fontWeight: 700 }}>Peserta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Course & Sesi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tugas</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tanggal Pengumpulan</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#a3aca4' }}>
                    Semua tugas materi telah dinilai. Antrean kosong!
                  </TableCell>
                </TableRow>
              ) : submissions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{sub.user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{sub.user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{sub.assignment.session.course.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{sub.assignment.session.material?.title || sub.assignment.session.masterAssignment?.title || 'Sesi Tanpa Judul'}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{sub.assignment.title}</TableCell>
                  <TableCell>
                    {new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenGrade(sub)}
                      sx={{ borderRadius: '8px', textTransform: 'none' }}
                    >
                      Beri Nilai
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Grade Dialog */}
      <Dialog open={gradeOpen} onClose={() => setGradeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Beri Nilai Tugas Pembelajaran</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {selectedSubmission && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">TUGAS:</Typography>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{selectedSubmission.assignment.title}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>PROMPT TUGAS:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#fbfbfb', mb: 2, border: '1px solid #f1f0ea' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedSubmission.assignment.prompt}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>JAWABAN PESERTA ({selectedSubmission.user.name}):</Typography>
              <Paper sx={{ p: 3, bgcolor: '#faf9f6', border: '1px solid #e8e6df', mb: 3 }}>
                <Typography sx={{ whiteSpace: 'pre-wrap', fontWeight: 600 }}>
                  {selectedSubmission.answer}
                </Typography>
              </Paper>

              <TextField
                label="Nilai (0 - 100)"
                type="number"
                fullWidth
                required
                value={formScore}
                onChange={(e) => setFormScore(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Feedback / Catatan (opsional)"
                fullWidth
                multiline
                minRows={3}
                value={formFeedback}
                onChange={(e) => setFormFeedback(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGradeOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleSaveGrade}
            disabled={formLoading || !formScore}
          >
            {formLoading ? 'Menyimpan...' : 'Simpan Nilai'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
