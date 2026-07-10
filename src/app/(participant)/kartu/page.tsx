'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Divider,
  Chip,
  Button,
  Skeleton,
  Alert,
  Stack,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface KartuData {
  id: string;
  name: string;
  email: string;
  phone: string;
  kodePeserta: string;
  photoUrl: string | null;
  namaGelar: string;
  tempatLahir: string;
  tanggalLahir: string;
  unitKerja: string;
  jabatan: string;
}

const formatTanggal = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Box
        sx={{
          color: 'text.secondary',
          minWidth: 24,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function KartuPesertaPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<KartuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchKartu() {
    try {
      const res = await fetch('/api/profile/kartu');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memuat data');
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data kartu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKartu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    // Fallback: open print dialog which the user can save as PDF
    window.print();
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
        <Skeleton
          variant="rectangular"
          height={400}
          sx={{ borderRadius: 4 }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
      {/* Action Buttons */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3, '@media print': { display: 'none' } }}
      >
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Unduh Kartu
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Cetak Kartu
        </Button>
      </Stack>

      {/* Kartu Peserta */}
      <Card
        ref={printRef}
        id="kartu-peserta"
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'primary.main',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          '@media print': {
            boxShadow: 'none',
            border: '2px solid #000',
            pageBreakInside: 'avoid',
            maxWidth: '85mm',
            margin: '0 auto',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            px: 3,
            py: 2.5,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 800, letterSpacing: '0.02em' }}
          >
            KARTU PESERTA
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            Sertifikasi Umroh
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Top section: Photo + QR */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {/* Photo */}
            <Avatar
              src={data.photoUrl || undefined}
              sx={{
                width: 80,
                height: 100,
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'grey.300',
              }}
            >
              {!data.photoUrl && <PersonIcon sx={{ fontSize: 40 }} />}
            </Avatar>

            {/* QR Code */}
            <Box
              sx={{
                ml: 'auto',
                p: 1.5,
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <QRCodeSVG
                value={data.kodePeserta || data.id}
                size={90}
                level="M"
                includeMargin
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  fontWeight: 600,
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                {data.kodePeserta}
              </Typography>
            </Box>
          </Box>

          {/* Nama */}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {data.namaGelar || data.name}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Detail Info */}
          <Stack spacing={1.5}>
            <InfoRow
              icon={<BadgeIcon fontSize="small" />}
              label="Kode Peserta"
              value={data.kodePeserta || '-'}
            />
            <InfoRow
              icon={<CalendarMonthIcon fontSize="small" />}
              label="Tempat, Tgl Lahir"
              value={`${data.tempatLahir}, ${formatTanggal(data.tanggalLahir)}`}
            />
            <InfoRow
              icon={<WorkIcon fontSize="small" />}
              label="Unit Kerja"
              value={data.unitKerja || '-'}
            />
            <InfoRow
              icon={<PersonIcon fontSize="small" />}
              label="Jabatan"
              value={data.jabatan || '-'}
            />
          </Stack>
        </CardContent>

        {/* Footer */}
        <Box
          sx={{
            bgcolor: 'grey.50',
            px: 3,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Kartu ini wajib dibawa saat ujian & kegiatan
          </Typography>
          <Chip
            icon={<QrCodeIcon />}
            label="SCAN ME"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Card>
    </Box>
  );
}
