'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface CertificateData {
  id: string; // id ExamResult
  userId: string;
  examId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  exam: {
    id: string;
    title: string;
  };
  hasCertificate: boolean;
  certificateUrl: string | null;
}

function AdminCertificatesContent() {
  const [data, setData] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/certificates');
      const json = await res.json();
      setData(json);
    } catch {
      setError('Gagal memuat data sertifikat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleGenerate = async (userId: string, examId: string) => {
    setGeneratingId(`${userId}_${examId}`);
    setError('');
    try {
      const res = await fetch('/api/admin/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, examId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || 'Gagal generate sertifikat.');
      } else {
        setSuccess('Sertifikat berhasil di-generate!');
        fetchCertificates();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Kelola Sertifikat
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Terbitkan sertifikat untuk peserta yang telah lulus ujian.
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Peserta</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ujian</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status Sertifikat</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                  Belum ada peserta yang lulus ujian.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isGenerating = generatingId === `${row.userId}_${row.examId}`;
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{row.user.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{row.exam.title}</Typography>
                    </TableCell>
                    <TableCell>
                      {row.hasCertificate ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Tersedia"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          label="Belum Diterbitkan"
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {row.hasCertificate ? (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            href={row.certificateUrl || '#'}
                            target="_blank"
                            sx={{ borderRadius: '8px' }}
                          >
                            Lihat PDF
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleGenerate(row.userId, row.examId)}
                            disabled={isGenerating}
                            sx={{ borderRadius: '8px' }}
                          >
                            {isGenerating ? 'Regenerating...' : 'Regenerate'}
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleGenerate(row.userId, row.examId)}
                          disabled={isGenerating}
                          startIcon={isGenerating ? <CircularProgress size={14} color="inherit" /> : <FileDownloadIcon />}
                          sx={{ borderRadius: '8px' }}
                        >
                          {isGenerating ? 'Memproses...' : 'Generate PDF'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function AdminCertificatesPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
      <AdminCertificatesContent />
    </Suspense>
  );
}
