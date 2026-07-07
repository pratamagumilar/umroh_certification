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
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Dashboard', href: '/pengawas/dashboard', icon: <DashboardIcon /> },
  { label: 'Pengawasan Ujian', href: '/pengawas/exams', icon: <VisibilityIcon /> },
  { label: 'Penilaian Esai', href: '/pengawas/grading', icon: <GradingIcon /> },
  { label: 'Penilaian Materi', href: '/pengawas/material-grading', icon: <AutoStoriesIcon /> },
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
          backgroundColor: '#ffffff', // Bright background
          color: '#425045', // Dark Sage gray text
          borderRight: '1px solid #e8e6df', // Subtle border
        },
      }}
    >
      <Toolbar sx={{ px: 3, py: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a201b', letterSpacing: '-0.02em' }}>
            ☪ Sertifikasi
          </Typography>
          <Typography variant="caption" sx={{ color: '#78867a', fontSize: '0.75rem', fontWeight: 600 }}>
            Panel Pengawas
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: '#e8e6df', mb: 2 }} />

      <List sx={{ px: 1.5 }}>
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
                  backgroundColor: isActive ? 'rgba(120, 146, 118, 0.15)' : 'transparent',
                  color: isActive ? '#596d58' : '#5c6b5e',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(120, 146, 118, 0.2)'
                      : 'rgba(120, 146, 118, 0.08)',
                    color: '#2c352d',
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
