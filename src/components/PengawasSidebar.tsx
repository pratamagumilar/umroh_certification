'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GradingIcon from '@mui/icons-material/Grading';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Dashboard', href: '/pengawas/dashboard', icon: <DashboardIcon /> },
  { label: 'Pengawasan Ujian', href: '/pengawas/exams', icon: <VisibilityIcon /> },
  { label: 'Penilaian Esai', href: '/pengawas/grading', icon: <GradingIcon /> },
];

export default function PengawasSidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: '#e2e8f0',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar sx={{ px: 3, py: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            ☪ Sertifikasi
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
            Panel Pengawas
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.15)' }} />

      <List sx={{ px: 1.5, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  backgroundColor: isActive ? 'rgba(244, 63, 94, 0.15)' : 'transparent', // Menggunakan warna sekunder (rose)
                  color: isActive ? '#fb7185' : '#94a3b8',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(244, 63, 94, 0.2)'
                      : 'rgba(148, 163, 184, 0.08)',
                    color: '#fff',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
