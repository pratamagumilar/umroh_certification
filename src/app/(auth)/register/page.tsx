'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

const STEPS = ['Akun', 'Data Diri', 'Data Kerja', 'Pendidikan', 'Perlengkapan', 'Dokumen'];

const DOCUMENT_TYPES = [
  { key: 'PHOTO_3X4', label: 'Photo 3x4 (latar merah)', accept: 'image/*' },
  { key: 'IJAZAH', label: 'Ijazah Terakhir (min S1)', accept: '.pdf,image/*' },
  { key: 'KTP', label: 'KTP', accept: '.pdf,image/*' },
  { key: 'KARTU_KELUARGA', label: 'Kartu Keluarga', accept: '.pdf,image/*' },
  { key: 'PASPOR', label: 'Paspor', accept: '.pdf,image/*' },
  { key: 'VISA', label: 'Visa', accept: '.pdf,image/*' },
  { key: 'SURAT_SEHAT', label: 'Surat Keterangan Sehat', accept: '.pdf,image/*' },
  { key: 'SURAT_PERNYATAAN', label: 'Surat Pernyataan', accept: '.pdf,image/*' },
  { key: 'BUKTI_TRANSFER', label: 'Bukti Transfer/Pembayaran', accept: '.pdf,image/*' },
];

const UKURAN_BAJU = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
const PENDIDIKAN_OPTIONS = ['S1', 'S2', 'S3'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface FormState {
  email: string; password: string; confirmPassword: string;
  namaGelar: string; namaTanpaGelar: string; tempatLahir: string; tanggalLahir: string;
  nik: string; jenisKelamin: string; noHp: string; alamatTinggal: string; provinsi: string;
  unitKerja: string; jabatan: string; alamatKantor: string;
  pendidikanTerakhir: string; pendidikanLainnya: string; namaUniversitas: string;
  ukuranBaju: string; ukuranBajuLainnya: string;
  dokumen: Record<string, File | null>;
}

type Errors = Record<string, string>;

const makeInitialForm = (): FormState => ({
  email: '', password: '', confirmPassword: '',
  namaGelar: '', namaTanpaGelar: '', tempatLahir: '', tanggalLahir: '',
  nik: '', jenisKelamin: '', noHp: '', alamatTinggal: '', provinsi: '',
  unitKerja: '', jabatan: '', alamatKantor: '',
  pendidikanTerakhir: '', pendidikanLainnya: '', namaUniversitas: '',
  ukuranBaju: '', ukuranBajuLainnya: '',
  dokumen: Object.fromEntries(DOCUMENT_TYPES.map(d => [d.key, null])),
});

// ---- validators ----

const v1 = (d: FormState): Errors => {
  const e: Errors = {};
  if (!d.email.trim()) e.email = 'Email wajib diisi';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Format email tidak valid';
  if (!d.password) e.password = 'Password wajib diisi';
  else if (d.password.length < 8) e.password = 'Minimal 8 karakter';
  if (!d.confirmPassword) e.confirmPassword = 'Konfirmasi password wajib diisi';
  else if (d.password !== d.confirmPassword) e.confirmPassword = 'Password tidak cocok';
  return e;
};

const v2 = (d: FormState): Errors => {
  const e: Errors = {};
  if (!d.namaGelar.trim()) e.namaGelar = 'Wajib diisi';
  if (!d.namaTanpaGelar.trim()) e.namaTanpaGelar = 'Wajib diisi';
  if (!d.tempatLahir.trim()) e.tempatLahir = 'Wajib diisi';
  if (!d.tanggalLahir) e.tanggalLahir = 'Wajib diisi';
  else if (new Date(d.tanggalLahir) > new Date()) e.tanggalLahir = 'Tidak boleh > hari ini';
  if (!d.nik.trim()) e.nik = 'Wajib diisi';
  else if (!/^\d{16}$/.test(d.nik)) e.nik = 'Harus 16 digit angka';
  if (!d.jenisKelamin) e.jenisKelamin = 'Wajib dipilih';
  if (!d.noHp.trim()) e.noHp = 'Wajib diisi';
  else if (!/^(\+62|62|08)\d{8,12}$/.test(d.noHp.replace(/[\s-]/g, ''))) e.noHp = 'Format tidak valid (08xx / +62)';
  if (!d.alamatTinggal.trim()) e.alamatTinggal = 'Wajib diisi';
  if (!d.provinsi.trim()) e.provinsi = 'Wajib diisi';
  return e;
};

const v3 = (d: FormState): Errors => {
  const e: Errors = {};
  if (!d.unitKerja.trim()) e.unitKerja = 'Wajib diisi';
  if (!d.jabatan.trim()) e.jabatan = 'Wajib diisi';
  if (!d.alamatKantor.trim()) e.alamatKantor = 'Wajib diisi';
  return e;
};

const v4 = (d: FormState): Errors => {
  const e: Errors = {};
  if (!d.pendidikanTerakhir) e.pendidikanTerakhir = 'Wajib dipilih';
  else if (d.pendidikanTerakhir === 'Lainnya' && !d.pendidikanLainnya.trim()) e.pendidikanLainnya = 'Sebutkan pendidikan';
  if (!d.namaUniversitas.trim()) e.namaUniversitas = 'Wajib diisi';
  return e;
};

const v5 = (d: FormState): Errors => {
  const e: Errors = {};
  if (!d.ukuranBaju) e.ukuranBaju = 'Wajib dipilih';
  else if (d.ukuranBaju === 'Lainnya' && !d.ukuranBajuLainnya.trim()) e.ukuranBajuLainnya = 'Sebutkan ukuran';
  return e;
};

const v6 = (d: FormState): Errors => {
  const e: Errors = {};
  for (const { key, label } of DOCUMENT_TYPES) {
    if (!d.dokumen[key]) e[key] = `${label} wajib diupload`;
  }
  return e;
};

const validators = [v1, v2, v3, v4, v5, v6];

// ---- end validators ----

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(makeInitialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const update = (field: keyof FormState, val: unknown) => {
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => { const n = { ...p }; delete n[field as string]; return n; });
  };

  const updateDoc = (key: string, file: File | null) => {
    setForm(p => ({ ...p, dokumen: { ...p.dokumen, [key]: file } }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    if (file && file.size > MAX_FILE_SIZE) {
      setErrors(p => ({ ...p, [key]: 'File maksimal 10 MB' }));
    }
  };

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmailChecking(true);
    setEmailAvailable(null);
    try {
      const res = await fetch(`/api/register/check-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailAvailable(data.available);
    } catch { setEmailAvailable(null); }
    finally { setEmailChecking(false); }
  }, []);

  const handleNext = () => {
    const errs = validators[step](form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const errs = validators[5](form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');

    const fd = new FormData();
    fd.append('email', form.email);
    fd.append('password', form.password);
    fd.append('namaGelar', form.namaGelar);
    fd.append('namaTanpaGelar', form.namaTanpaGelar);
    fd.append('tempatLahir', form.tempatLahir);
    fd.append('tanggalLahir', form.tanggalLahir);
    fd.append('nik', form.nik);
    fd.append('jenisKelamin', form.jenisKelamin);
    fd.append('noHp', form.noHp);
    fd.append('alamatTinggal', form.alamatTinggal);
    fd.append('provinsi', form.provinsi);
    fd.append('unitKerja', form.unitKerja);
    fd.append('jabatan', form.jabatan);
    fd.append('alamatKantor', form.alamatKantor);
    fd.append('pendidikanTerakhir',
      form.pendidikanTerakhir === 'Lainnya' && form.pendidikanLainnya
        ? form.pendidikanLainnya
        : form.pendidikanTerakhir);
    fd.append('namaUniversitas', form.namaUniversitas);
    fd.append('ukuranBaju',
      form.ukuranBaju === 'Lainnya' && form.ukuranBajuLainnya
        ? form.ukuranBajuLainnya
        : form.ukuranBaju);

    for (const { key } of DOCUMENT_TYPES) {
      const file = form.dokumen[key];
      if (file) fd.append(`dokumen_${key}`, file);
    }

    try {
      const res = await fetch('/api/register', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mendaftar');
      setSuccess(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Card sx={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Pendaftaran Berhasil!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Akun Anda sedang menunggu persetujuan admin. Anda akan dapat login setelah admin menyetujui pendaftaran Anda.
            </Typography>
            <Button variant="contained" component={Link} href="/login" size="large">
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card sx={{ maxWidth: 680, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h4" component="h1" align="center" sx={{ fontWeight: 700, mb: 1 }} color="primary">
            Pendaftaran Peserta
          </Typography>

          <Stepper activeStep={step} alternativeLabel sx={{ mb: 4, mt: 2 }}>
            {STEPS.map((label, idx) => (
              <Step key={label} completed={idx < step}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {serverError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setServerError('')}>{serverError}</Alert>}

          {/* STEP 1 — AKUN */}
          {step === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Email" type="email" fullWidth
                value={form.email}
                onChange={e => { update('email', e.target.value); if (e.target.value.length > 5) checkEmail(e.target.value); }}
                error={!!errors.email} helperText={errors.email}
                slotProps={{
                  input: {
                    endAdornment: emailChecking ? <CircularProgress size={20} /> :
                      emailAvailable === true ? <Chip label="Tersedia" color="success" size="small" /> :
                      emailAvailable === false ? <Chip label="Sudah terdaftar" color="error" size="small" /> : undefined,
                  },
                }}
              />
              <TextField label="Password" type={showPw ? 'text' : 'password'} fullWidth
                value={form.password} onChange={e => update('password', e.target.value)}
                error={!!errors.password} helperText={errors.password}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw(!showPw)} edge="end">{showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField label="Konfirmasi Password" type={showCpw ? 'text' : 'password'} fullWidth
                value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCpw(!showCpw)} edge="end">{showCpw ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          )}

          {/* STEP 2 — DATA DIRI */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Nama Lengkap dengan Gelar" fullWidth value={form.namaGelar} onChange={e => update('namaGelar', e.target.value)} error={!!errors.namaGelar} helperText={errors.namaGelar} />
              <TextField label="Nama Lengkap Tanpa Gelar" fullWidth value={form.namaTanpaGelar} onChange={e => update('namaTanpaGelar', e.target.value)} error={!!errors.namaTanpaGelar} helperText={errors.namaTanpaGelar} />
              <TextField label="Tempat Lahir" fullWidth value={form.tempatLahir} onChange={e => update('tempatLahir', e.target.value)} error={!!errors.tempatLahir} helperText={errors.tempatLahir} />
              <TextField label="Tanggal Lahir" type="date" fullWidth
                value={form.tanggalLahir} onChange={e => update('tanggalLahir', e.target.value)}
                error={!!errors.tanggalLahir} helperText={errors.tanggalLahir}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="NIK (KTP)" fullWidth value={form.nik}
                onChange={e => update('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                error={!!errors.nik} helperText={errors.nik}
                slotProps={{ htmlInput: { maxLength: 16 } }}
              />
              <FormControl error={!!errors.jenisKelamin}>
                <FormLabel>Jenis Kelamin</FormLabel>
                <RadioGroup row value={form.jenisKelamin} onChange={e => update('jenisKelamin', e.target.value)}>
                  <FormControlLabel value="L" control={<Radio />} label="Laki-laki" />
                  <FormControlLabel value="P" control={<Radio />} label="Perempuan" />
                </RadioGroup>
                {errors.jenisKelamin && <FormHelperText>{errors.jenisKelamin}</FormHelperText>}
              </FormControl>
              <TextField label="Nomor HP (WA)" fullWidth value={form.noHp} onChange={e => update('noHp', e.target.value)} error={!!errors.noHp} helperText={errors.noHp} placeholder="0812xxxxxxxx" />
              <TextField label="Alamat Lengkap" fullWidth multiline rows={2} value={form.alamatTinggal} onChange={e => update('alamatTinggal', e.target.value)} error={!!errors.alamatTinggal} helperText={errors.alamatTinggal} />
              <TextField label="Provinsi" fullWidth value={form.provinsi} onChange={e => update('provinsi', e.target.value)} error={!!errors.provinsi} helperText={errors.provinsi} />
            </Box>
          )}

          {/* STEP 3 — DATA KERJA */}
          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Unit Kerja / Utusan" fullWidth value={form.unitKerja} onChange={e => update('unitKerja', e.target.value)} error={!!errors.unitKerja} helperText={errors.unitKerja} />
              <TextField label="Jabatan pada Unit Kerja" fullWidth value={form.jabatan} onChange={e => update('jabatan', e.target.value)} error={!!errors.jabatan} helperText={errors.jabatan} />
              <TextField label="Alamat Kantor" fullWidth multiline rows={2} value={form.alamatKantor} onChange={e => update('alamatKantor', e.target.value)} error={!!errors.alamatKantor} helperText={errors.alamatKantor} />
            </Box>
          )}

          {/* STEP 4 — PENDIDIKAN */}
          {step === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl error={!!errors.pendidikanTerakhir}>
                <FormLabel>Pendidikan Terakhir</FormLabel>
                <RadioGroup value={form.pendidikanTerakhir} onChange={e => update('pendidikanTerakhir', e.target.value)}>
                  {PENDIDIKAN_OPTIONS.map(o => (
                    <FormControlLabel key={o} value={o} control={<Radio />} label={o} />
                  ))}
                  <FormControlLabel value="Lainnya" control={<Radio />} label="Lainnya" />
                </RadioGroup>
                {form.pendidikanTerakhir === 'Lainnya' && (
                  <TextField size="small" placeholder="Sebutkan..." value={form.pendidikanLainnya} onChange={e => update('pendidikanLainnya', e.target.value)} error={!!errors.pendidikanLainnya} helperText={errors.pendidikanLainnya} sx={{ mt: 1 }} />
                )}
                {errors.pendidikanTerakhir && <FormHelperText>{errors.pendidikanTerakhir}</FormHelperText>}
              </FormControl>
              <TextField label="Nama Universitas / Perguruan Tinggi" fullWidth value={form.namaUniversitas} onChange={e => update('namaUniversitas', e.target.value)} error={!!errors.namaUniversitas} helperText={errors.namaUniversitas} />
            </Box>
          )}

          {/* STEP 5 — PERLENGKAPAN */}
          {step === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl error={!!errors.ukuranBaju}>
                <FormLabel>Ukuran Baju</FormLabel>
                <RadioGroup value={form.ukuranBaju} onChange={e => update('ukuranBaju', e.target.value)}>
                  {UKURAN_BAJU.map(s => (
                    <FormControlLabel key={s} value={s} control={<Radio />} label={s} />
                  ))}
                  <FormControlLabel value="Lainnya" control={<Radio />} label="Lainnya" />
                </RadioGroup>
                {form.ukuranBaju === 'Lainnya' && (
                  <TextField size="small" placeholder="Sebutkan ukuran..." value={form.ukuranBajuLainnya} onChange={e => update('ukuranBajuLainnya', e.target.value)} error={!!errors.ukuranBajuLainnya} helperText={errors.ukuranBajuLainnya} sx={{ mt: 1 }} />
                )}
                {errors.ukuranBaju && <FormHelperText>{errors.ukuranBaju}</FormHelperText>}
              </FormControl>
            </Box>
          )}

          {/* STEP 6 — DOKUMEN */}
          {step === 5 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">Upload seluruh dokumen (max 10 MB per file, format JPG/PNG/PDF):</Typography>
              {DOCUMENT_TYPES.map(doc => {
                const file = form.dokumen[doc.key];
                return (
                  <Box key={doc.key} sx={{ border: '1px dashed', borderColor: errors[doc.key] ? 'error.main' : 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: errors[doc.key] ? 'error.main' : 'text.primary' }}>
                      {doc.label}
                      {errors[doc.key] && (
                        <Typography component="span" variant="caption" color="error" sx={{ ml: 0.5 }}>
                          — {errors[doc.key]}
                        </Typography>
                      )}
                    </Typography>
                    {file ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={file.name} onDelete={() => updateDoc(doc.key, null)} size="small" variant="outlined" />
                        <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(0)} KB</Typography>
                      </Box>
                    ) : (
                      <Button variant="outlined" size="small" component="label" startIcon={<CloudUploadIcon />}>
                        Upload
                        <input type="file" hidden accept={doc.accept} onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) updateDoc(doc.key, f);
                          e.target.value = '';
                        }} />
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* NAVIGATION BUTTONS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBack} disabled={step === 0 || loading}>
              Kembali
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Lanjut
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}>
                Submit Pendaftaran
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}