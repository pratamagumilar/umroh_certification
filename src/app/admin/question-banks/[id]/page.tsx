'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, CircularProgress, Divider, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface Question {
  id: string;
  type: string;
  text: string;
  options: string | null;
  correctAnswer: string | null;
  createdAt: string;
}

interface QuestionBankDetail {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

export default function QuestionBankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = params.id as string;

  const [bank, setBank] = useState<QuestionBankDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Question dialog
  const [questionOpen, setQuestionOpen] = useState(false);
  const [editQuestionOpen, setEditQuestionOpen] = useState(false);
  const [deleteQuestionOpen, setDeleteQuestionOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Question form
  const [qType, setQType] = useState('PG');
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qAnswer, setQAnswer] = useState('A');

  const fetchBank = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/question-banks/${bankId}`);
      if (!res.ok) {
        setError('Bank soal tidak ditemukan.');
        return;
      }
      const data = await res.json();
      setBank(data);
    } catch {
      setError('Gagal memuat data bank soal.');
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    fetchBank();
  }, [fetchBank]);

  const resetQuestionForm = () => {
    setQType('PG');
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQAnswer('A');
    setError('');
  };

  const handleCreateQuestion = async () => {
    setFormLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = { type: qType, text: qText };
      if (qType === 'PG') {
        body.options = JSON.stringify({ A: qOptA, B: qOptB, C: qOptC, D: qOptD });
        body.correctAnswer = qAnswer;
      }

      const res = await fetch(`/api/admin/question-banks/${bankId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Soal berhasil ditambahkan!');
        setQuestionOpen(false);
        resetQuestionForm();
        fetchBank();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal menambah soal.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditQuestionOpen = (q: Question) => {
    setSelectedQuestion(q);
    setQType(q.type);
    setQText(q.text);
    if (q.type === 'PG' && q.options) {
      try {
        const opts = JSON.parse(q.options);
        setQOptA(opts.A || '');
        setQOptB(opts.B || '');
        setQOptC(opts.C || '');
        setQOptD(opts.D || '');
      } catch {
        setQOptA(''); setQOptB(''); setQOptC(''); setQOptD('');
      }
    } else {
      setQOptA(''); setQOptB(''); setQOptC(''); setQOptD('');
    }
    setQAnswer(q.correctAnswer || 'A');
    setError('');
    setEditQuestionOpen(true);
  };

  const handleEditQuestion = async () => {
    if (!selectedQuestion) return;
    setFormLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = { type: qType, text: qText };
      if (qType === 'PG') {
        body.options = JSON.stringify({ A: qOptA, B: qOptB, C: qOptC, D: qOptD });
        body.correctAnswer = qAnswer;
      }

      const res = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Soal berhasil diupdate!');
        setEditQuestionOpen(false);
        resetQuestionForm();
        fetchBank();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal mengupdate soal.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message);
      } else {
        setSuccess('Soal berhasil dihapus!');
        setDeleteQuestionOpen(false);
        setSelectedQuestion(null);
        fetchBank();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal menghapus soal.');
    } finally {
      setFormLoading(false);
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
      const res = await fetch(`/api/admin/question-banks/${bankId}/questions/import`, {
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
        fetchBank();
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderQuestionFormFields = () => (
    <>
      <TextField label="Tipe Soal" select fullWidth value={qType} onChange={(e) => setQType(e.target.value)} sx={{ mb: 2 }}>
        <MenuItem value="PG">Pilihan Ganda</MenuItem>
        <MenuItem value="ESSAY">Esai</MenuItem>
      </TextField>
      <TextField label="Teks Soal" fullWidth multiline rows={4} value={qText} onChange={(e) => setQText(e.target.value)} required sx={{ mb: 2 }} />

      {qType === 'PG' && (
        <Box sx={{ pl: 2, borderLeft: '3px solid #789276', mb: 2 }}>
          <TextField label="Opsi A" fullWidth value={qOptA} onChange={(e) => setQOptA(e.target.value)} required sx={{ mb: 2 }} />
          <TextField label="Opsi B" fullWidth value={qOptB} onChange={(e) => setQOptB(e.target.value)} required sx={{ mb: 2 }} />
          <TextField label="Opsi C" fullWidth value={qOptC} onChange={(e) => setQOptC(e.target.value)} required sx={{ mb: 2 }} />
          <TextField label="Opsi D" fullWidth value={qOptD} onChange={(e) => setQOptD(e.target.value)} required sx={{ mb: 2 }} />
          <TextField label="Kunci Jawaban" select fullWidth value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} required>
            <MenuItem value="A">A</MenuItem>
            <MenuItem value="B">B</MenuItem>
            <MenuItem value="C">C</MenuItem>
            <MenuItem value="D">D</MenuItem>
          </TextField>
        </Box>
      )}
    </>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!bank) {
    return <Alert severity="error">Data tidak ditemukan.</Alert>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/question-banks')} sx={{ mb: 3 }}>
        Kembali ke Daftar
      </Button>

      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1a201b' }}>
            {bank.title}
          </Typography>
          {bank.description && (
            <Typography variant="body1" sx={{ color: '#78867a', mb: 3 }}>
              {bank.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${bank.questions.length} Soal`} color="primary" />
          </Box>
        </CardContent>
      </Card>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
          Daftar Soal
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)} sx={{ borderRadius: '12px' }}>
            Import Excel
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetQuestionForm(); setQuestionOpen(true); }} sx={{ borderRadius: '12px' }}>
            Tambah Soal
          </Button>
        </Box>
      </Box>

      {bank.questions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#faf9f6', color: '#78867a' }}>
          <Typography>Belum ada soal dalam bank ini.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {bank.questions.map((q, index) => {
            let opts = null;
            if (q.type === 'PG' && q.options) {
              try { opts = JSON.parse(q.options); } catch { /* ignore */ }
            }
            return (
              <Card key={q.id} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
                <CardContent sx={{ position: 'relative', p: 3 }}>
                  <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" color="primary" onClick={() => handleEditQuestionOpen(q)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => { setSelectedQuestion(q); setDeleteQuestionOpen(true); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pr: 8 }}>
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

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Import Bank Soal dari Excel</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" sx={{ mb: 2, color: '#78867a' }}>
            Pastikan file Excel (.xlsx) memiliki kolom: <strong>Tipe, Soal, Opsi A, Opsi B, Opsi C, Opsi D, Jawaban</strong>.
          </Typography>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 3, borderStyle: 'dashed' }} startIcon={<UploadFileIcon />}>
            {importFile ? importFile.name : 'Pilih File Excel'}
            <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleImport} disabled={!importFile || formLoading}>
            {formLoading ? 'Mengimpor...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Question Dialogs & Delete */}
      <Dialog open={questionOpen} onClose={() => setQuestionOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Tambah Soal Baru</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderQuestionFormFields()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQuestionOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreateQuestion} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editQuestionOpen} onClose={() => setEditQuestionOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Soal</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderQuestionFormFields()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditQuestionOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEditQuestion} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteQuestionOpen} onClose={() => setDeleteQuestionOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Yakin ingin menghapus soal ini?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteQuestionOpen(false)}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDeleteQuestion} disabled={formLoading}>
            {formLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
