import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import api from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const KEHADIRAN_BADGE = {
  1: { color: 'success', text: 'Hadir' },
  2: { color: 'warning', text: 'Sakit' },
  3: { color: 'info', text: 'Izin' },
  4: { color: 'danger', text: 'Tanpa keterangan' },
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AbsenSiswa() {
  const [kelasList, setKelasList] = useState([]);
  const [idKelas, setIdKelas] = useState('');
  const [tanggal, setTanggal] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [lewat, setLewat] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ id_kehadiran: 1, jam_masuk: '', jam_keluar: '', keterangan: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/kelas').then((res) => {
      setKelasList(res.data.data);
      if (res.data.data.length > 0) setIdKelas(res.data.data[0].id_kelas);
    });
  }, []);

  const loadAbsen = useCallback(() => {
    if (!idKelas || !tanggal) return;
    setLoading(true);
    api.get('/admin/absen-siswa', { params: { id_kelas: idKelas, tanggal } })
      .then((res) => { setRows(res.data.data); setLewat(res.data.lewat); })
      .catch(() => toast.error('Gagal memuat data absensi.'))
      .finally(() => setLoading(false));
  }, [idKelas, tanggal]);

  useEffect(() => { loadAbsen(); }, [loadAbsen]);

  function openEdit(row) {
    setEditTarget(row);
    setEditForm({
      id_kehadiran: row.id_kehadiran || 1,
      jam_masuk: row.jam_masuk || '',
      jam_keluar: row.jam_keluar || '',
      keterangan: row.keterangan || '',
    });
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/absen-siswa/edit', {
        id_siswa: editTarget.id_siswa,
        id_kelas: idKelas,
        tanggal,
        ...editForm,
      });
      toast.success(`Kehadiran ${editTarget.nama_siswa} berhasil diubah.`);
      setEditTarget(null);
      loadAbsen();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah data.');
    } finally {
      setSaving(false);
    }
  }

  const selectedKelas = kelasList.find((k) => String(k.id_kelas) === String(idKelas));

  return (
    <div>
      <div className="page-header">
        <h2>Absensi Siswa</h2>
        <p>Lihat dan kelola kehadiran siswa berdasarkan kelas dan tanggal.</p>
      </div>

      <Card headerColor="purple" title="Filter Absensi">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Kelas</label>
            <select className="form-control" value={idKelas} onChange={(e) => setIdKelas(e.target.value)}>
              {kelasList.map((k) => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input type="date" className="form-control" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="primary" onClick={loadAbsen}><RefreshCw size={15} style={{ marginRight: 6 }} />Refresh</Button>
          </div>
        </div>
      </Card>

      <Card title={`Daftar Siswa — ${selectedKelas?.nama_kelas || ''}`} headerColor="purple">
        {loading ? (
          <div className="fullpage-loader" style={{ height: 200 }}><div className="spinner" /></div>
        ) : rows.length === 0 ? (
          <div className="table-empty">Data tidak ditemukan.</div>
        ) : (
          <div className="table-wrapper">
            <table className="ui-table">
              <thead>
                <tr><th>No.</th><th>NIS</th><th>Nama Siswa</th><th>Kehadiran</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Keterangan</th><th className="text-center">Aksi</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const idK = r.id_kehadiran || (lewat ? null : 4);
                  const badge = idK ? KEHADIRAN_BADGE[idK] : { color: 'disabled', text: 'Belum tersedia' };
                  return (
                    <tr key={r.id_siswa}>
                      <td>{i + 1}</td>
                      <td>{r.nis}</td>
                      <td><strong>{r.nama_siswa}</strong></td>
                      <td><span className={`badge badge-${badge.color === 'success' ? 'hadir' : badge.color === 'warning' ? 'sakit' : badge.color === 'info' ? 'izin' : 'alfa'}`}>{badge.text}</span></td>
                      <td>{r.jam_masuk || '-'}</td>
                      <td>{r.jam_keluar || '-'}</td>
                      <td>{r.keterangan || '-'}</td>
                      <td className="text-center">
                        {!lewat ? (
                          <Button variant="info" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>No Action</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Ubah Kehadiran — ${editTarget?.nama_siswa || ''}`}
        footer={<><Button variant="outline" onClick={() => setEditTarget(null)}>Batal</Button><Button variant="primary" loading={saving} onClick={submitEdit}>Simpan</Button></>}
      >
        <form onSubmit={submitEdit}>
          <div className="form-group">
            <label className="form-label">Status Kehadiran</label>
            <select className="form-control" value={editForm.id_kehadiran} onChange={(e) => setEditForm({ ...editForm, id_kehadiran: Number(e.target.value) })}>
              <option value={1}>Hadir</option>
              <option value={2}>Sakit</option>
              <option value={3}>Izin</option>
              <option value={4}>Tanpa keterangan</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jam Masuk</label>
              <input type="time" className="form-control" value={editForm.jam_masuk} onChange={(e) => setEditForm({ ...editForm, jam_masuk: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Pulang</label>
              <input type="time" className="form-control" value={editForm.jam_keluar} onChange={(e) => setEditForm({ ...editForm, jam_keluar: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <textarea className="form-control" rows={2} value={editForm.keterangan} onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
