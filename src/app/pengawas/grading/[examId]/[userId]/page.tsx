'use client';

import React, { useEffect, useState, use } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Button, TextField, Divider } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

interface EssayAnswer {
  id: string;
  answer: string;
  score: number | null;
  question: {
    text: string;
  };
}

interface GradingData {
  exam: {
    title: string;
    passingGrade: number;
  };
  participant: {
    name: string;
    email: string;
  };
  essayAnswers: EssayAnswer[];
}

export default function PengawasGradingFormPage({ params }: { params: Promise<{ examId: string; userId: string }> }) {
  const router = useRouter();
  const { examId, userId } = use(params);
  
  const [data, setData] = useState<GradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State grades: { answerId: score }
  const [grades, setGrades] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        const res = await fetch(`/api/pengawas/grading/${examId}/${userId}`);
        const result = await res.json();
        if (res.ok) {
          setData(result);
          // Initialize grades state
          const initialGrades: Record<string, number | string> = {};
          result.essayAnswers.forEach((ans: EssayAnswer) => {
            initialGrades[ans.id] = ans.score !== null ? ans.score : '';
          });
          setGrades(initialGrades);
        } else {
          setError(result.message || 'Gagal memuat jawaban');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchAnswers();
  }, [examId, userId]);

  const handleGradeChange = (answerId: string, value: string) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validasi
    const finalGrades: Record<string, number> = {};
    for (const ansId of Object.keys(grades)) {
      const val = grades[ansId];
      if (val === '') {
        setError('Mohon isi semua nilai esai sebelum menyimpan.');
        return;
      }
      const numVal = Number(val);
      if (isNaN(numVal) || numVal < 0 || numVal > 100) {
        setError('Nilai harus berupa angka antara 0 - 100.');
        return;
      }
      finalGrades[ansId] = numVal;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/pengawas/grading/${examId}/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: finalGrades }),
      });
      if (res.ok) {
        // Redirect back to participants list
        router.push(`/pengawas/grading/${examId}`);
      } else {
        const resData = await res.json();
        setError(resData.message || 'Gagal menyimpan nilai');
        setSubmitting(false);
      }
    } catch {
      setError('Terjadi kesalahan saat menyimpan nilai');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !data) {
    return (
      <Box>
        <Button component={Link} href={`/pengawas/grading/${examId}`} startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
          Kembali
        </Button>
        <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button component={Link} href={`/pengawas/grading/${examId}`} startIcon={<ArrowBackIcon />} sx={{ width: 'fit-content', mb: 1, color: '#64748b' }}>
          Kembali
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Form Penilaian Esai
        </Typography>
        <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }}>
          {data?.exam.title}
        </Typography>
        <Typography variant="body1" sx={{ color: '#0ea5e9', fontWeight: 600 }}>
          Peserta: {data?.participant.name} ({data?.participant.email})
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data?.essayAnswers.map((ans, index) => (
            <Card key={ans.id} sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box sx={{ 
                    minWidth: 32, height: 32, borderRadius: '8px', bgcolor: '#f1f5f9', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontWeight: 800, color: '#0ea5e9'
                  }}>
                    {index + 1}
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500, color: '#1e293b', whiteSpace: 'pre-wrap', pt: 0.5 }}>
                    {ans.question.text}
                  </Typography>
                </Box>

                <Box sx={{ pl: { xs: 0, sm: 6 }, mb: 4 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Jawaban Peserta:
                  </Typography>
                  <Box sx={{ mt: 1, p: 3, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <Typography variant="body1" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
                      {ans.answer || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Kosong)</span>}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ pl: { xs: 0, sm: 6 }, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    Beri Nilai (0 - 100):
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={grades[ans.id] ?? ''}
                    onChange={(e) => handleGradeChange(ans.id, e.target.value)}
                    sx={{ width: 120 }}
                    slotProps={{ htmlInput: { min: 0, max: 100 } }}
                  />
                </Box>

              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 6, mb: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={submitting || data?.essayAnswers.length === 0}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ px: 6, py: 2, borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem' }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
