'use client';

import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Box, IconButton, Drawer, 
  List, ListItem, ListItemText, ListItemIcon, Avatar, Menu, MenuItem, 
  useTheme, useMediaQuery, Divider, Tooltip
} from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import PageTransition from '@/components/PageTransition';

const drawerWidth = 280;

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/dashboard' },
    { text: 'Materi Kelas', icon: <SchoolRoundedIcon />, path: '/courses' },
    { text: 'Ujian Saya', icon: <QuizRoundedIcon />, path: '/exams' },
    { text: 'Kartu Peserta', icon: <CardMembershipRoundedIcon />, path: '/kartu' },
    { text: 'Profil', icon: <PersonRoundedIcon />, path: '/profile' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          width: 40, height: 40, borderRadius: '12px', 
          bgcolor: 'primary.main', color: 'white', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <SchoolRoundedIcon />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Umroh Cert
        </Typography>
      </Box>
      <Divider sx={{ mb: 2, mx: 2, borderColor: 'divider' }} />
      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <ListItem 
              key={item.text} 
              onClick={() => {
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ 
                bgcolor: isActive ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                borderRadius: '12px',
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(15, 23, 42, 0.04)' }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive ? 'primary.main' : 'text.secondary',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  color: isActive ? 'primary.main' : 'text.primary', 
                  '& .MuiTypography-root': { fontWeight: isActive ? 700 : 500 } 
                }} 
              />
            </ListItem>
          );
        })}
      </List>
      
      {/* Bottom Profile Area in Sidebar */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          p: 2, borderRadius: '16px', bgcolor: 'background.default', 
          display: 'flex', alignItems: 'center', gap: 2,
          border: '1px solid', borderColor: 'divider'
        }}>
           <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {session?.user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                Peserta
              </Typography>
            </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* App Bar (Header) */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
              {menuItems.find(item => pathname === item.path || pathname.startsWith(item.path + '/'))?.text || 'Portal'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {session?.user && (
              <>
                <Tooltip title="Akun Anda">
                  <IconButton onClick={handleMenu} size="small" sx={{ ml: 2 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 600 }}>
                      {session.user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: { sx: { mt: 1.5, borderRadius: '16px', minWidth: 220, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{session.user.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{session.user.email}</Typography>
                  </Box>
                  <MenuItem onClick={() => { handleClose(); router.push('/profile'); }} sx={{ py: 1.5, mt: 1 }}>
                    <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
                    Profil Saya
                  </MenuItem>
                  <MenuItem onClick={() => signOut({ callbackUrl: '/login' })} sx={{ py: 1.5, color: 'error.main' }}>
                    <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
                    Keluar
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3, md: 4 }, 
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // Space for AppBar
          maxWidth: 1400,
          mx: 'auto'
        }}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </Box>
    </Box>
  );
}
