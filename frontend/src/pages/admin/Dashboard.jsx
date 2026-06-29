import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { GraduationCap, UserRound, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filteredStats, setFilteredStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch(() => setError('Gagal memuat data dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!filterKelas) {
      setFilteredStats(null);
      return;
    }
    api.post('/admin/dashboard/filter-data', { id_kelas: filterKelas })
      .then((res) => setFilteredStats(res.data.data))
      .catch(() => {});
  }, [filterKelas]);

  if (loading) {
    return <div className="fullpage-loader"><div className="spinner" /></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const stats = filteredStats
    ? { hadir: filteredStats.hadir, sakit: filteredStats.sakit, izin: filteredStats.izin, alfa: filteredStats.alfa }
    : data.jumlahKehadiranSiswa;

  const chartSource = filteredStats ? filteredStats.chartData : data.grafikKehadiranSiswa;

  const chartData = {
    labels: data.dateRange,
    datasets: [
      { label: 'Hadir', data: chartSource.hadir, borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.1)', tension: 0.4, fill: true },
      { label: 'Sakit', data: chartSource.sakit, borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.1)', tension: 0.4, fill: true },
      { label: 'Izin', data: chartSource.izin, borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.1)', tension: 0.4, fill: true },
      { label: 'Alfa', data: chartSource.alfa, borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.1)', tension: 0.4, fill: true },
    ],
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>{data.dateNow} — Ringkasan kehadiran sekolah hari ini</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={<GraduationCap size={26} />} label="Total Siswa" value={data.totalSiswa} color="info" footer="Terdaftar di seluruh kelas" />
        <StatCard icon={<UserRound size={26} />} label="Total Guru" value={data.totalGuru} color="rose" footer="Tenaga pendidik aktif" />
        <StatCard icon={<CheckCircle2 size={26} />} label="Hadir Hari Ini" value={stats.hadir} color="success" footer="Siswa sudah tap absen" />
        <StatCard icon={<XCircle size={26} />} label="Tanpa Keterangan" value={stats.alfa} color="danger" footer="Belum melakukan absen" />
      </div>

      <Card
        title="Grafik Kehadiran Siswa (7 Hari Terakhir)"
        headerColor="azure"
        actions={
          <select className="form-control" style={{ width: 220 }} value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {data.kelas.map((k) => (
              <option key={k.id_kelas} value={k.id_kelas}>{k.tingkat} {k.jurusan} {k.index_kelas}</option>
            ))}
          </select>
        }
      >
        <div style={{ height: 320 }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        </div>
      </Card>

      <Card title="Daftar Kelas" headerColor="purple">
        <div className="table-wrapper">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Kelas</th>
                <th>Jurusan</th>
                <th className="text-center">Jumlah Siswa</th>
              </tr>
            </thead>
            <tbody>
              {data.kelas.length === 0 && (
                <tr><td colSpan={3} className="table-empty">Belum ada data kelas.</td></tr>
              )}
              {data.kelas.map((k) => (
                <tr key={k.id_kelas}>
                  <td>{k.tingkat} {k.index_kelas}</td>
                  <td>{k.jurusan}</td>
                  <td className="text-center">{k.jumlah_siswa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
