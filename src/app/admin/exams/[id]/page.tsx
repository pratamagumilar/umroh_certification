'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Paper,
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

interface Question {
  id: string;
  type: string;
  text: string;
  options: string | null;
  correctAnswer: string | null;
  createdAt: string;
  mappingId?: string; // Dari ExamQuestion
}

interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  isActive: boolean;
  questions: Question[];
  _count: { questions: number; attendances: number };
}

interface QuestionBank {
  id: string;
  title: string;
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialogs
  const [selectBankOpen, setSelectBankOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Bank Soal Selection states
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);

  const fetchExam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (!res.ok) {
        setError('Ujian tidak ditemukan.');
        return;
      }
      const data = await res.json();
      setExam(data);
    } catch {
      setError('Gagal memuat data ujian.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  // Fetch Banks
  const fetchBanks = async () => {
    setBanksLoading(true);
    try {
      const res = await fetch('/api/admin/question-banks');
      const data = await res.json();
      if (!res.ok) {
        setBanks([]);
      } else {
        setBanks(data);
      }
    } catch {
      setBanks([]);
    } finally {
      setBanksLoading(false);
    }
  };

  const handleOpenSelectBank = () => {
    setSelectBankOpen(true);
    fetchBanks();
    setBankQuestions([]);
    setSelectedBankId('');
    setError('');
  };

  const handleBankChange = async (e: SelectChangeEvent<string>) => {
    const bankId = e.target.value;
    setSelectedBankId(bankId);
    setBanksLoading(true);
    try {
      const res = await fetch(`/api/admin/question-banks/${bankId}/questions`);
      const data = await res.json();
      if (!res.ok) {
        setBankQuestions([]);
      } else {
        setBankQuestions(data);
      }
    } catch {
      setBankQuestions([]);
    } finally {
      setBanksLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    const questionIds = bankQuestions.map((q) => q.id);
    if (!selectedBankId || questionIds.length === 0) {
      setError('Pilih bank soal yang berisi soal terlebih dahulu.');
      return;
    }

    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Soal berhasil dipetakan ke ujian!');
        setSelectBankOpen(false);
        fetchExam();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal menyimpan soal.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!exam) {
    return <Alert severity="error">Data tidak ditemukan.</Alert>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/exams')} sx={{ mb: 3 }}>
        Kembali ke Daftar
      </Button>

      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1a201b' }}>
            {exam.title}
          </Typography>
          {exam.description && (
            <Typography variant="body1" sx={{ color: '#78867a', mb: 3 }}>
              {exam.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3, alignItems: 'center' }}>
            <Chip label={`${exam.questions?.length || 0} Soal`} color="primary" />
            <Chip label={`${exam.durationMinutes} Menit`} color="secondary" />
            <Chip
              label={exam.isActive ? 'Aktif' : 'Nonaktif'}
              color={exam.isActive ? 'success' : 'default'}
              variant="outlined"
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push(`/admin/exams/${examId}/monitor`)}
              sx={{ fontWeight: 600, ml: 'auto' }}
            >
              Live Monitoring
            </Button>
          </Box>
        </CardContent>
      </Card>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
          Soal Ujian
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenSelectBank} sx={{ borderRadius: '12px' }}>
          Pilih dari Bank Soal
        </Button>
      </Box>

      {!exam.questions || exam.questions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#faf9f6', color: '#78867a' }}>
          <Typography>Belum ada soal. Silakan pilih soal dari Bank Soal.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {exam.questions.map((q, index) => {
            let opts = null;
            if (q.type === 'PG' && q.options) {
              try { opts = JSON.parse(q.options); } catch { /* ignore */ }
            }
            return (
              <Card key={q.id} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
                <CardContent sx={{ position: 'relative', p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#789276' }}>{index + 1}.</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Chip label={q.type === 'PG' ? 'Pilihan Ganda' : 'Esai'} size="small" sx={{ bgcolor: q.type === 'PG' ? '#e9eee8' : '#fef3c7', color: q.type === 'PG' ? '#596d58' : '#b45309', fontWeight: 600 }} />
                      </Box>
                      <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{q.text}</Typography>
                      {q.type === 'PG' && opts && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {['A', 'B', 'C', 'D'].map((optKey) => {
                            const isCorrect = q.correctAnswer === optKey;
                            return (
                              <Paper key={optKey} sx={{ p: 1.5, display: 'flex', gap: 2, alignItems: 'center', bgcolor: isCorrect ? '#ecfdf5' : '#faf9f6', border: `1px solid ${isCorrect ? '#10b981' : '#e8e6df'}`, borderRadius: '8px' }}>
                                <Typography sx={{ fontWeight: 700, color: isCorrect ? '#047857' : '#78867a' }}>{optKey}</Typography>
                                <Typography sx={{ color: isCorrect ? '#047857' : '#425045' }}>{opts[optKey]}</Typography>
                                {isCorrect && <Chip label="Kunci" size="small" color="success" sx={{ ml: 'auto', height: 20 }} />}
                              </Paper>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Select Bank Dialog */}
      <Dialog open={selectBankOpen} onClose={() => setSelectBankOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Pilih Soal dari Bank Soal</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', minHeight: 400 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Pilih Bank Soal</InputLabel>
            <Select
              value={selectedBankId}
              label="Pilih Bank Soal"
              onChange={handleBankChange}
            >
              {banks.map((bank) => (
                <MenuItem key={bank.id} value={bank.id}>{bank.title}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {banksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : selectedBankId && bankQuestions.length === 0 ? (
            <Typography align="center" color="text.secondary">Bank Soal ini kosong.</Typography>
          ) : selectedBankId && bankQuestions.length > 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Bank ini memiliki <strong>{bankQuestions.length} soal</strong>. Menyimpan pilihan ini akan secara otomatis memasukkan semua soal ke dalam jadwal ujian ini.
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Total dari bank: {bankQuestions.length}</Typography>
          <Box>
            <Button onClick={() => setSelectBankOpen(false)}>Batal</Button>
            <Button
              variant="contained"
              onClick={handleSaveMapping}
              disabled={formLoading || !selectedBankId || bankQuestions.length === 0}
            >
              {formLoading ? 'Menyimpan...' : 'Simpan Ke Ujian'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
