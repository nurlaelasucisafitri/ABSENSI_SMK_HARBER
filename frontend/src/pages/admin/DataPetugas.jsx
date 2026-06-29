import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Administrator' },
  { value: 'admin', label: 'Staf Petugas' },
  { value: 'kepsek', label: 'Kepala Sekolah' },
  { value: 'scanner', label: 'Petugas Scanner' },
  { value: 'guru', label: 'Guru / Wali Kelas' },
];

const ROLE_BADGE_COLOR = { superadmin: '#f44336', admin: '#4caf50', kepsek: '#ff9800', scanner: '#00bcd4', guru: '#9e9e9e' };

const emptyForm = { email: '', username: '', password: '', role: 'admin', id_guru: '' };

export default function DataPetugas() {
  const { user: currentUser } = useAuth();
  const [list, setList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/admin/petugas'), api.get('/admin/guru')])
      .then(([p, g]) => { setList(p.data.data); setGuruList(g.data.data); })
      .catch(() => toast.error('Gagal memuat data petugas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditingId(p.id);
    setForm({ email: p.email, username: p.username, password: '', role: p.role, id_guru: p.id_guru || '' });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editingId) {
        await api.put(`/admin/petugas/${editingId}`, form);
        toast.success('Data petugas berhasil diubah.');
      } else {
        await api.post('/admin/petugas/register', form);
        toast.success('Petugas baru berhasil didaftarkan.');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setErrors(res.errors); else toast.error(res?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(p) {
    try {
      await api.post(`/admin/petugas/${p.id}/toggle-activation`);
      toast.success(p.active ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status.');
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/admin/petugas/${deleteTarget.id}`);
      toast.success('Data petugas berhasil dihapus.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus data.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Data Petugas</h2>
        <p>Kelola akun login untuk admin, kepala sekolah, petugas scanner, dan guru.</p>
      </div>

      <Card title="Daftar Petugas" headerColor="azure" actions={<Button variant="info" onClick={openCreate}>+ Tambah Petugas</Button>}>
        {loading ? (
          <div className="fullpage-loader" style={{ height: 200 }}><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="ui-table">
              <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={5} className="table-empty">Belum ada data petugas.</td></tr>}
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>{p.username}</td>
                    <td>{p.email}</td>
                    <td><span className="role-badge" style={{ background: ROLE_BADGE_COLOR[p.role] }}>{ROLE_OPTIONS.find((r) => r.value === p.role)?.label}</span></td>
                    <td>{p.active ? <span className="badge badge-hadir">Aktif</span> : <span className="badge badge-alfa">Nonaktif</span>}</td>
                    <td className="text-center">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Edit</Button>{' '}
                      <Button variant={p.active ? 'warning' : 'success'} size="sm" disabled={p.id === currentUser.id} onClick={() => handleToggle(p)}>
                        {p.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>{' '}
                      <Button variant="danger" size="sm" disabled={p.id === currentUser.id} onClick={() => setDeleteTarget(p)}>Hapus</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Petugas' : 'Tambah Petugas Baru'}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button><Button variant="info" loading={saving} onClick={handleSubmit}>Simpan</Button></>}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              {errors.username && <div className="form-error">{errors.username}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {errors.role && <div className="form-error">{errors.role}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Password {editingId && <span className="text-muted">(kosongkan jika tidak diubah)</span>}</label>
              <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
          </div>
          {form.role === 'guru' && (
            <div className="form-group">
              <label className="form-label">Hubungkan dengan Data Guru</label>
              <select className="form-control" value={form.id_guru} onChange={(e) => setForm({ ...form, id_guru: e.target.value })}>
                <option value="">Pilih guru</option>
                {guruList.map((g) => <option key={g.id_guru} value={g.id_guru}>{g.nama_guru}</option>)}
              </select>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Petugas"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button><Button variant="danger" onClick={handleDelete}>Ya, Hapus</Button></>}
      >
        <p>Yakin ingin menghapus akun <strong>{deleteTarget?.username}</strong>?</p>
      </Modal>
    </div>
  );
}
