'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface AdminChartsProps {
  courseStats: Array<{
    name: string;
    total: number;
    passed: number;
    failed: number;
  }>;
  userStats: Array<{
    name: string;
    value: number;
  }>;
}

const PIE_COLORS = ['#10b981', '#f43f5e']; // Emerald for Active, Rose for Inactive

export default function AdminCharts({ courseStats, userStats }: AdminChartsProps) {
  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {/* Course Enrollment & Pass Rate Chart */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
          <CardContent sx={{ p: 3, pb: '24px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Statistik Kelulusan per Course
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="total" name="Total Peserta" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passed" name="Lulus" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Tidak Lulus" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Active vs Inactive Users Chart */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
          <CardContent sx={{ p: 3, pb: '24px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Status Peserta
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 300, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
