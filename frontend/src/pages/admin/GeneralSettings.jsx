import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { UPLOADS_BASE_URL } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { invalidateGeneralSettingsCache } from '../../hooks/useGeneralSettings';

export default function GeneralSettings() {
  const [form, setForm] = useState({ school_name: '', school_year: '', copyright: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/admin/general-settings')
      .then((res) => {
        const data = res.data.data;
        setForm({ school_name: data.school_name || '', school_year: data.school_year || '', copyright: data.copyright || '' });
        setCurrentLogo(data.logo);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const fd = new FormData();
    fd.append('school_name', form.school_name);
    fd.append('school_year', form.school_year);
    fd.append('copyright', form.copyright);
    if (logoFile) fd.append('logo', logoFile);

    try {
      await api.post('/admin/general-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengaturan berhasil disimpan.');
      invalidateGeneralSettingsCache();
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setErrors(res.errors); else toast.error(res?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="fullpage-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Pengaturan Utama</h2>
        <p>Kelola identitas sekolah yang ditampilkan di seluruh sistem.</p>
      </div>

      <Card title="Identitas Sekolah" headerColor="azure">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nama Sekolah</label>
              <input className="form-control" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} />
              {errors.school_name && <div className="form-error">{errors.school_name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Tahun Ajaran</label>
              <input className="form-control" value={form.school_year} onChange={(e) => setForm({ ...form, school_year: e.target.value })} placeholder="2024/2025" />
              {errors.school_year && <div className="form-error">{errors.school_year}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Teks Copyright (footer)</label>
            <input className="form-control" value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} />
            {errors.copyright && <div className="form-error">{errors.copyright}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Logo Sekolah</label>
            {currentLogo && <img src={`${UPLOADS_BASE_URL}/${currentLogo}`} alt="Logo sekolah" style={{ height: 60, display: 'block', marginBottom: 10 }} />}
            <input type="file" accept="image/*" className="form-control" onChange={(e) => setLogoFile(e.target.files[0])} />
          </div>
          <Button type="submit" variant="info" loading={saving}>Simpan Pengaturan</Button>
        </form>
      </Card>
    </div>
  );
}
