import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function DataKelas() {
  const [tab, setTab] = useState('kelas');
  const [kelasList, setKelasList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [kelasModal, setKelasModal] = useState(false);
  const [kelasForm, setKelasForm] = useState({ tingkat: '', id_jurusan: '', index_kelas: '', id_wali_kelas: '' });
  const [kelasEditId, setKelasEditId] = useState(null);
  const [kelasErrors, setKelasErrors] = useState({});

  const [jurusanModal, setJurusanModal] = useState(false);
  const [jurusanForm, setJurusanForm] = useState({ jurusan: '' });
  const [jurusanEditId, setJurusanEditId] = useState(null);
  const [jurusanErrors, setJurusanErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'kelas'|'jurusan', data }
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/admin/kelas'), api.get('/admin/jurusan'), api.get('/admin/guru')])
      .then(([k, j, g]) => { setKelasList(k.data.data); setJurusanList(j.data.data); setGuruList(g.data.data); })
      .catch(() => toast.error('Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Kelas ──
  function openKelasCreate() {
    setKelasEditId(null);
    setKelasForm({ tingkat: '', id_jurusan: '', index_kelas: '', id_wali_kelas: '' });
    setKelasErrors({});
    setKelasModal(true);
  }
  function openKelasEdit(k) {
    setKelasEditId(k.id_kelas);
    setKelasForm({ tingkat: k.tingkat, id_jurusan: k.id_jurusan, index_kelas: k.index_kelas, id_wali_kelas: k.id_wali_kelas || '' });
    setKelasErrors({});
    setKelasModal(true);
  }
  async function submitKelas(e) {
    e.preventDefault();
    setSaving(true);
    setKelasErrors({});
    try {
      if (kelasEditId) {
        await api.put(`/admin/kelas/${kelasEditId}`, kelasForm);
        toast.success('Kelas berhasil diubah.');
      } else {
        await api.post('/admin/kelas', kelasForm);
        toast.success('Kelas berhasil ditambahkan.');
      }
      setKelasModal(false);
      loadData();
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setKelasErrors(res.errors); else toast.error(res?.message || 'Gagal menyimpan.');
    } finally { setSaving(false); }
  }

  // ── Jurusan ──
  function openJurusanCreate() {
    setJurusanEditId(null);
    setJurusanForm({ jurusan: '' });
    setJurusanErrors({});
    setJurusanModal(true);
  }
  function openJurusanEdit(j) {
    setJurusanEditId(j.id);
    setJurusanForm({ jurusan: j.jurusan });
    setJurusanErrors({});
    setJurusanModal(true);
  }
  async function submitJurusan(e) {
    e.preventDefault();
    setSaving(true);
    setJurusanErrors({});
    try {
      if (jurusanEditId) {
        await api.put(`/admin/jurusan/${jurusanEditId}`, jurusanForm);
        toast.success('Jurusan berhasil diubah.');
      } else {
        await api.post('/admin/jurusan', jurusanForm);
        toast.success('Jurusan berhasil ditambahkan.');
      }
      setJurusanModal(false);
      loadData();
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setJurusanErrors(res.errors); else toast.error(res?.message || 'Gagal menyimpan.');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    try {
      if (deleteTarget.type === 'kelas') {
        await api.delete(`/admin/kelas/${deleteTarget.data.id_kelas}`);
        toast.success('Kelas berhasil dihapus.');
      } else {
        await api.delete(`/admin/jurusan/${deleteTarget.data.id}`);
        toast.success('Jurusan berhasil dihapus.');
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus data.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Data Kelas & Jurusan</h2>
        <p>Kelola struktur kelas, jurusan, dan penugasan wali kelas.</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'kelas' ? 'active' : ''}`} onClick={() => setTab('kelas')}>Kelas</button>
        <button className={`tab-btn ${tab === 'jurusan' ? 'active' : ''}`} onClick={() => setTab('jurusan')}>Jurusan</button>
      </div>

      {tab === 'kelas' && (
        <Card title="Daftar Kelas" headerColor="purple" actions={<Button variant="primary" onClick={openKelasCreate}>+ Tambah Kelas</Button>}>
          {loading ? <div className="fullpage-loader" style={{ height: 160 }}><div className="spinner" /></div> : (
            <div className="table-wrapper">
              <table className="ui-table">
                <thead><tr><th>Kelas</th><th>Jurusan</th><th>Wali Kelas</th><th className="text-center">Jumlah Siswa</th><th className="text-center">Aksi</th></tr></thead>
                <tbody>
                  {kelasList.length === 0 && <tr><td colSpan={5} className="table-empty">Belum ada data kelas.</td></tr>}
                  {kelasList.map((k) => (
                    <tr key={k.id_kelas}>
                      <td>{k.tingkat} {k.index_kelas}</td>
                      <td>{k.jurusan}</td>
                      <td>{k.nama_wali_kelas || <span className="text-muted">Belum ditugaskan</span>}</td>
                      <td className="text-center">{k.jumlah_siswa}</td>
                      <td className="text-center">
                        <Button variant="outline" size="sm" onClick={() => openKelasEdit(k)}>Edit</Button>{' '}
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'kelas', data: k })}>Hapus</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'jurusan' && (
        <Card title="Daftar Jurusan" headerColor="purple" actions={<Button variant="primary" onClick={openJurusanCreate}>+ Tambah Jurusan</Button>}>
          {loading ? <div className="fullpage-loader" style={{ height: 160 }}><div className="spinner" /></div> : (
            <div className="table-wrapper">
              <table className="ui-table">
                <thead><tr><th>Nama Jurusan</th><th className="text-center">Aksi</th></tr></thead>
                <tbody>
                  {jurusanList.length === 0 && <tr><td colSpan={2} className="table-empty">Belum ada data jurusan.</td></tr>}
                  {jurusanList.map((j) => (
                    <tr key={j.id}>
                      <td>{j.jurusan}</td>
                      <td className="text-center">
                        <Button variant="outline" size="sm" onClick={() => openJurusanEdit(j)}>Edit</Button>{' '}
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget({ type: 'jurusan', data: j })}>Hapus</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal Kelas */}
      <Modal
        open={kelasModal} onClose={() => setKelasModal(false)}
        title={kelasEditId ? 'Edit Kelas' : 'Tambah Kelas'}
        footer={<><Button variant="outline" onClick={() => setKelasModal(false)}>Batal</Button><Button variant="primary" loading={saving} onClick={submitKelas}>Simpan</Button></>}
      >
        <form onSubmit={submitKelas}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tingkat</label>
              <input className="form-control" placeholder="X, XI, XII" value={kelasForm.tingkat} onChange={(e) => setKelasForm({ ...kelasForm, tingkat: e.target.value })} />
              {kelasErrors.tingkat && <div className="form-error">{kelasErrors.tingkat}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Index Kelas</label>
              <input className="form-control" placeholder="A, B, 1, 2" value={kelasForm.index_kelas} onChange={(e) => setKelasForm({ ...kelasForm, index_kelas: e.target.value })} />
              {kelasErrors.index_kelas && <div className="form-error">{kelasErrors.index_kelas}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Jurusan</label>
            <select className="form-control" value={kelasForm.id_jurusan} onChange={(e) => setKelasForm({ ...kelasForm, id_jurusan: e.target.value })}>
              <option value="">Pilih jurusan</option>
              {jurusanList.map((j) => <option key={j.id} value={j.id}>{j.jurusan}</option>)}
            </select>
            {kelasErrors.id_jurusan && <div className="form-error">{kelasErrors.id_jurusan}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Wali Kelas (opsional)</label>
            <select className="form-control" value={kelasForm.id_wali_kelas} onChange={(e) => setKelasForm({ ...kelasForm, id_wali_kelas: e.target.value })}>
              <option value="">Belum ditugaskan</option>
              {guruList.map((g) => <option key={g.id_guru} value={g.id_guru}>{g.nama_guru}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal Jurusan */}
      <Modal
        open={jurusanModal} onClose={() => setJurusanModal(false)}
        title={jurusanEditId ? 'Edit Jurusan' : 'Tambah Jurusan'}
        footer={<><Button variant="outline" onClick={() => setJurusanModal(false)}>Batal</Button><Button variant="primary" loading={saving} onClick={submitJurusan}>Simpan</Button></>}
      >
        <form onSubmit={submitJurusan}>
          <div className="form-group">
            <label className="form-label">Nama Jurusan</label>
            <input className="form-control" placeholder="RPL, TKJ, dll" value={jurusanForm.jurusan} onChange={(e) => setJurusanForm({ jurusan: e.target.value })} />
            {jurusanErrors.jurusan && <div className="form-error">{jurusanErrors.jurusan}</div>}
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button><Button variant="danger" onClick={handleDelete}>Ya, Hapus</Button></>}
      >
        <p>Yakin ingin menghapus <strong>{deleteTarget?.type === 'kelas' ? `${deleteTarget.data.tingkat} ${deleteTarget.data.index_kelas}` : deleteTarget?.data.jurusan}</strong>?</p>
      </Modal>
    </div>
  );
}
