import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const emptyForm = { nuptk: '', nama: '', jk: 'Laki-laki', alamat: '', no_hp: '', rfid: '' };

export default function DataGuru() {
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    api.get('/admin/guru')
      .then((res) => setGuruList(res.data.data))
      .catch(() => toast.error('Gagal memuat data guru.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEditModal(guru) {
    setEditingId(guru.id_guru);
    setForm({
      nuptk: guru.nuptk, nama: guru.nama_guru, jk: guru.jenis_kelamin,
      alamat: guru.alamat, no_hp: guru.no_hp, rfid: guru.rfid_code || '',
    });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editingId) {
        await api.put(`/admin/guru/${editingId}`, form);
        toast.success('Data guru berhasil diubah.');
      } else {
        await api.post('/admin/guru', form);
        toast.success('Guru baru berhasil ditambahkan.');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setErrors(res.errors);
      else toast.error(res?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/admin/guru/${deleteTarget.id_guru}`);
      toast.success('Data guru berhasil dihapus.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus data.');
    }
  }

  const filtered = guruList.filter((g) => g.nama_guru.toLowerCase().includes(search.toLowerCase()) || g.nuptk.includes(search));

  return (
    <div>
      <div className="page-header">
        <h2>Data Guru</h2>
        <p>Kelola data induk guru beserta kode unik QR/RFID untuk presensi.</p>
      </div>

      <Card
        title="Daftar Guru"
        headerColor="green"
        actions={<Button variant="success" onClick={openCreateModal}>+ Tambah Guru</Button>}
      >
        <div className="table-toolbar">
          <input className="form-control" style={{ maxWidth: 280 }} placeholder="Cari nama atau NUPTK..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="fullpage-loader" style={{ height: 200 }}><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="ui-table">
              <thead>
                <tr><th>NUPTK</th><th>Nama</th><th>Jenis Kelamin</th><th>No. HP</th><th>RFID</th><th className="text-center">Aksi</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="table-empty">Tidak ada data guru ditemukan.</td></tr>
                )}
                {filtered.map((g) => (
                  <tr key={g.id_guru}>
                    <td>{g.nuptk}</td>
                    <td>{g.nama_guru}</td>
                    <td>{g.jenis_kelamin}</td>
                    <td>{g.no_hp}</td>
                    <td>{g.rfid_code || <span className="text-muted">—</span>}</td>
                    <td className="text-center">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(g)}>Edit</Button>{' '}
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(g)}>Hapus</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="success" loading={saving} onClick={handleSubmit}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NUPTK</label>
              <input className="form-control" value={form.nuptk} onChange={(e) => setForm({ ...form, nuptk: e.target.value })} />
              {errors.nuptk && <div className="form-error">{errors.nuptk}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input className="form-control" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              {errors.nama && <div className="form-error">{errors.nama}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <select className="form-control" value={form.jk} onChange={(e) => setForm({ ...form, jk: e.target.value })}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">No. HP</label>
              <input className="form-control" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="6281234567890" />
              {errors.no_hp && <div className="form-error">{errors.no_hp}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alamat</label>
            <textarea className="form-control" rows={3} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
            {errors.alamat && <div className="form-error">{errors.alamat}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Kode RFID (opsional)</label>
            <input className="form-control" value={form.rfid} onChange={(e) => setForm({ ...form, rfid: e.target.value })} placeholder="Tap kartu untuk isi otomatis" />
            {errors.rfid && <div className="form-error">{errors.rfid}</div>}
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Data Guru"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Ya, Hapus</Button>
          </>
        }
      >
        <p>Yakin ingin menghapus data <strong>{deleteTarget?.nama_guru}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}
