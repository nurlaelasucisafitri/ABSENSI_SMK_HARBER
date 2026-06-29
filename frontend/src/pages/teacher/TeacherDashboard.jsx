import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import { GraduationCap, CheckCircle2, Thermometer, XCircle } from 'lucide-react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard').then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="fullpage-loader"><div className="spinner" /></div>;

  if (data?.noClass) {
    return (
      <div className="page-header">
        <h2>Dashboard Wali Kelas</h2>
        <div className="alert alert-danger" style={{ marginTop: 16 }}>
          Anda belum ditugaskan sebagai wali kelas manapun. Silahkan hubungi administrator.
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.dateRange,
    datasets: [
      { label: 'Hadir', data: data.grafikKehadiran.hadir, borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.1)', tension: 0.4, fill: true },
      { label: 'Sakit', data: data.grafikKehadiran.sakit, borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.1)', tension: 0.4, fill: true },
      { label: 'Izin', data: data.grafikKehadiran.izin, borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.1)', tension: 0.4, fill: true },
      { label: 'Alfa', data: data.grafikKehadiran.alfa, borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.1)', tension: 0.4, fill: true },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Wali Kelas</h2>
        <p>Kelas {data.kelas.nama_kelas} — Ringkasan kehadiran hari ini</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={<GraduationCap size={26} />} label="Total Siswa" value={data.summary.total_siswa} color="info" />
        <StatCard icon={<CheckCircle2 size={26} />} label="Hadir Hari Ini" value={data.summary.hadir_hari_ini} color="success" />
        <StatCard icon={<Thermometer size={26} />} label="Sakit / Izin" value={data.summary.sakit_hari_ini + data.summary.izin_hari_ini} color="warning" />
        <StatCard icon={<XCircle size={26} />} label="Tanpa Keterangan" value={data.summary.alfa_hari_ini} color="danger" />
      </div>

      <Card title="Grafik Kehadiran (7 Hari Terakhir)" headerColor="azure">
        <div style={{ height: 320 }}>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
        </div>
      </Card>
    </div>
  );
}
