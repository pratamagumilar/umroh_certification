import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Switch, Divider, Button
} from '@mui/material';
import toast from 'react-hot-toast';

interface CourseSessionModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  initialLocked: boolean;
  onSuccess: () => void;
}

export default function CourseSessionModal({ open, onClose, sessionId, initialLocked, onSuccess }: CourseSessionModalProps) {
  const [sessionLocked, setSessionLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSessionLocked(initialLocked);
    }
  }, [open, initialLocked]);

  const handleSaveSession = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const payload = {
        isLocked: sessionLocked
      };
      const res = await fetch(`/api/panitia/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Pengaturan sesi berhasil disimpan.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan sesi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Pengaturan Sesi</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography sx={{ flex: 1, fontWeight: 600 }}>Kunci Sesi Ini</Typography>
          <Switch checked={sessionLocked} onChange={(e) => setSessionLocked(e.target.checked)} />
        </Box>
        <Divider sx={{ my: 2 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="contained" onClick={handleSaveSession} disabled={loading}>
          Simpan Pengaturan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
