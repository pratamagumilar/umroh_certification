import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, Paper
} from '@mui/material';
import toast from 'react-hot-toast';

interface GradeModerationModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  selectedSubForAdjust: any | null;
  onSuccess: () => void;
}

export default function GradeModerationModal({ open, onClose, courseId, selectedSubForAdjust, onSuccess }: GradeModerationModalProps) {
  const [adjustScore, setAdjustScore] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setAdjustScore('');
      setAdjustReason('');
    }
  }, [open]);

  const handleAdjustGrade = async () => {
    if (!selectedSubForAdjust || !adjustScore || !adjustReason.trim()) return;
    setLoading(true);
    try {
      const origScore = selectedSubForAdjust.grades[0]?.score || 0;
      const res = await fetch('/api/admin/grade-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedSubForAdjust.userId,
          courseId,
          originalScore: origScore,
          adjustedScore: parseFloat(adjustScore),
          reason: adjustReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Penyesuaian nilai berhasil disimpan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan penyesuaian nilai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Moderasi Nilai Tugas</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {selectedSubForAdjust && (
          <Box>
            <Typography sx={{ mb: 2 }}>
              Lakukan penyesuaian nilai tugas untuk <strong>{selectedSubForAdjust.user?.name || 'Peserta'}</strong> pada sesi{' '}
              <strong>{selectedSubForAdjust.sessionTitle || 'Tugas'}</strong>.
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#fafafa', mb: 3 }}>
              <Typography variant="caption" color="text.secondary">Jawaban Peserta:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{selectedSubForAdjust.answer}</Typography>
            </Paper>
            <TextField
              label="Nilai Penyesuaian (Adjusted Score)"
              type="number"
              fullWidth
              required
              value={adjustScore}
              onChange={(e) => setAdjustScore(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Alasan Moderasi"
              fullWidth
              required
              multiline
              minRows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button
          variant="contained"
          onClick={handleAdjustGrade}
          disabled={loading || !adjustScore || !adjustReason.trim()}
        >
          Simpan Penyesuaian
        </Button>
      </DialogActions>
    </Dialog>
  );
}
