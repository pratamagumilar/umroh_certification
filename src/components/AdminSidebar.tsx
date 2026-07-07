'use client';

import React, { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Collapse,
  Avatar,
  IconButton
} from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import BookRoundedIcon from '@mui/icons-material/BookRounded';

const DRAWER_WIDTH = 280;

const menuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <DashboardRoundedIcon /> },
  {
    label: 'Kelola User',
    icon: <PeopleRoundedIcon />,
    basePath: '/admin/users',
    subItems: [
      { label: 'Admin', href: '/admin/users?role=ADMIN' },
      { label: 'Panitia', href: '/admin/users?role=PANITIA' },
      { label: 'Pengawas', href: '/admin/users?role=PENGAWAS' },
      { label: 'Peserta', href: '/admin/users?role=PESERTA' },
    ],
  },
  { label: 'Course', href: '/admin/courses', icon: <ClassRoundedIcon /> },
  { label: 'Master Materi', href: '/admin/materials', icon: <BookRoundedIcon /> },
  { label: 'Kelola Ujian', href: '/admin/exams', icon: <QuizRoundedIcon /> },
  { label: 'Bank Soal', href: '/admin/question-banks', icon: <LibraryBooksRoundedIcon /> },
  { label: 'Monitoring Hasil', href: '/admin/results', icon: <AssessmentRoundedIcon /> },
  { label: 'Kelola Sertifikat', href: '/admin/certificates', icon: <CardMembershipRoundedIcon /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get('role');
  const { data: session } = useSession();

  const [openUsers, setOpenUsers] = useState(true);

  const handleToggleUsers = () => {
    setOpenUsers(!openUsers);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          width: 40, height: 40, borderRadius: '12px', 
          bgcolor: 'primary.main', color: 'white', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <SchoolRoundedIcon />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Umroh Cert
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Panel Admin
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'divider', mb: 2, mx: 2 }} />

      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          if (item.subItems) {
            const isBaseActive = pathname === item.basePath || pathname.startsWith(item.basePath + '/');
            return (
              <React.Fragment key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={handleToggleUsers}
                    sx={{
                      borderRadius: '12px',
                      py: 1.2,
                      px: 2,
                      backgroundColor: isBaseActive ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                      color: isBaseActive ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: isBaseActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(15, 23, 42, 0.04)',
                        color: isBaseActive ? 'primary.main' : 'text.primary',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.875rem',
                            fontWeight: isBaseActive ? 700 : 500,
                          },
                        },
                      }}
                    />
                    {openUsers ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemButton>
                </ListItem>

                <Collapse in={openUsers} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => {
                      let isActive = false;
                      if (subItem.href === '/admin/users' && !currentRole) isActive = true;
                      if (subItem.href.includes('role=') && currentRole && subItem.href.includes(`role=${currentRole}`)) {
                        isActive = true;
                      }

                      return (
                        <ListItemButton
                          key={subItem.href}
                          component={Link}
                          href={subItem.href}
                          sx={{
                            borderRadius: '12px',
                            py: 1,
                            pl: 7,
                            mb: 0.5,
                            backgroundColor: isActive ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                            color: isActive ? 'primary.main' : 'text.secondary',
                            '&:hover': {
                              backgroundColor: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(15, 23, 42, 0.04)',
                              color: isActive ? 'primary.main' : 'text.primary',
                            },
                            transition: 'all 0.2s',
                          }}
                        >
                          <ListItemText
                            primary={subItem.label}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontSize: '0.85rem',
                                  fontWeight: isActive ? 600 : 500,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href!}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  backgroundColor: isActive ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(15, 23, 42, 0.04)',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                  transition: 'all 0.2s',
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

      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          p: 2, borderRadius: '16px', bgcolor: 'background.default', 
          display: 'flex', alignItems: 'center', gap: 1.5,
          border: '1px solid', borderColor: 'divider'
        }}>
           <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 700 }}>
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {session?.user?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                Admin
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => signOut({ callbackUrl: '/login' })} color="error">
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
