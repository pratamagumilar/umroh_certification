'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Avatar, Alert, CircularProgress, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useSession } from 'next-auth/react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  role: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
          setName(data.name);
          setPhone(data.phone || '');
          setPhotoUrl(data.photoUrl);
        } else {
          setError(data.message || 'Gagal memuat profil');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran file maksimal 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, photoUrl }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Profil berhasil diperbarui!');
        // Minta next-auth untuk update session data jika name/photoUrl berubah
        await updateSession({ name, image: photoUrl });
      }
    } catch {
      setError('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: '#0f172a' }}>
        Profil Saya
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Card sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <form onSubmit={handleSave}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={photoUrl || undefined}
                  sx={{ width: 120, height: 120, mb: 2, bgcolor: '#e2e8f0', color: '#94a3b8' }}
                >
                  {!photoUrl && <PersonIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderRadius: '12px', textTransform: 'none' }}
                >
                  Ubah Foto Profil
                </Button>
                <Typography variant="caption" sx={{ mt: 1, color: '#64748b', textAlign: 'center' }}>
                  Format JPG/PNG, maks 2MB.
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={profile?.email || ''}
                    disabled
                    helperText="Email tidak dapat diubah"
                  />
                  <TextField
                    label="Nama Lengkap"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <TextField
                    label="Nomor Telepon / WhatsApp"
                    fullWidth
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      disabled={saving}
                      sx={{ borderRadius: '12px', px: 4 }}
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
