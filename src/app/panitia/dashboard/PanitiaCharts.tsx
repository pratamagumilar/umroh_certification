'use client';

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface PanitiaChartsProps {
  dailyProgress: Array<{
    date: string;
    count: number;
  }>;
}

export default function PanitiaCharts({ dailyProgress }: PanitiaChartsProps) {
  return (
    <Card sx={{ borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
      <CardContent sx={{ p: 3, pb: '24px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Tren Penyelesaian Materi (7 Hari Terakhir)
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                name="Selesai" 
                stroke="#059669" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#059669', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
