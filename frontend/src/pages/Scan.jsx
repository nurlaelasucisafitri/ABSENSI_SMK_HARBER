import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Home, Wifi, GraduationCap } from 'lucide-react';
import api, { UPLOADS_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const QR_REGION_ID = 'qr-reader-region';

export default function Scan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const waktu = searchParams.get('mode') === 'pulang' ? 'pulang' : 'masuk';

  const [useCamera, setUseCamera] = useState(true);
  const [useRfid, setUseRfid] = useState(false);
  const [rfidFocused, setRfidFocused] = useState(false);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const rfidInputRef = useRef(null);
  const html5QrRef = useRef(null);
  const audioRef = useRef(null);
  const lastScanRef = useRef(0);

  const dashboardUrl = user?.role === 'guru' && user?.is_wali_kelas ? '/teacher/dashboard'
    : user?.role === 'scanner' ? '/scan'
    : '/admin/dashboard';

  const cekData = useCallback(async (code) => {
    const now = Date.now();
    if (now - lastScanRef.current < 1500) return; // debounce, hindari multi-trigger
    lastScanRef.current = now;

    try {
      const res = await api.post('/scan/cek', { unique_code: code, waktu });
      audioRef.current?.play().catch(() => {});
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Terjadi kesalahan.', error: true });
    }
  }, [waktu]);

  // ── Kamera QR ──
  useEffect(() => {
    if (!useCamera) return;

    const html5Qr = new Html5Qrcode(QR_REGION_ID);
    html5QrRef.current = html5Qr;
    let isStarted = false;
    let isCancelled = false;

    setScanning(false);
    setCameraError('');

    const qrConfig = { fps: 10, qrbox: { width: 230, height: 230 } };
    const onScanSuccess = (decodedText) => cekData(decodedText);
    const onScanFailure = () => {};

    function attemptStart(cameraConfig) {
      return html5Qr.start(cameraConfig, qrConfig, onScanSuccess, onScanFailure);
    }

    // Coba kamera belakang dulu (umum di HP), kalau gagal/tidak ada coba kamera apa saja
    // yang tersedia (umum di laptop yang cuma punya satu kamera depan).
    attemptStart({ facingMode: 'environment' })
      .catch(() => attemptStart(true))
      .then(() => {
        if (isCancelled) {
          html5Qr.stop().catch(() => {});
          return;
        }
        isStarted = true;
        setScanning(true);
      })
      .catch((err) => {
        if (isCancelled) return;
        setScanning(false);
        setCameraError('Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses kamera di browser, atau gunakan opsi RFID.');
        console.error('Gagal memulai kamera QR:', err);
      });

    return () => {
      isCancelled = true;
      if (isStarted) {
        html5Qr.stop().catch(() => {});
      }
    };
  }, [useCamera, cekData]);

  // ── RFID focus management ──
  useEffect(() => {
    if (!useRfid) return;
    rfidInputRef.current?.focus();

    function handleClick(e) {
      if (!e.target.closest('.camera-toggle-area')) {
        rfidInputRef.current?.focus();
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [useRfid]);

  function handleRfidKeyPress(e) {
    if (e.key === 'Enter') {
      const code = e.target.value.trim();
      if (code.length > 0) cekData(code);
      e.target.value = '';
    }
  }

  const oppMode = waktu === 'masuk' ? 'pulang' : 'masuk';

  return (
    <div className="scan-page">
      <div className="scan-page-topbar">
        <Button variant="primary" onClick={() => navigate(dashboardUrl)}><Home size={15} style={{ marginRight: 6 }} />Dashboard</Button>
      </div>

      <div className="scan-page-grid">
        <div className="scan-main-col">
          <div className="ui-card">
            <div className="ui-card-header" style={{ background: 'linear-gradient(60deg, #42a5f5, #1e88e5)', color: '#fff', border: 'none' }}>
              <div>
                <h4 className="ui-card-title">Absen {waktu === 'masuk' ? 'Masuk' : 'Pulang'}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.85 }}>Silahkan tunjukkan QR Code atau tap kartu RFID anda</p>
              </div>
              <Button variant={oppMode === 'masuk' ? 'success' : 'warning'} onClick={() => navigate(`/scan?mode=${oppMode}`)}>
                Absen {oppMode}
              </Button>
            </div>

            <div className="ui-card-body">
              <div className="camera-toggle-area" style={{ textAlign: 'center', marginBottom: 18 }}>
                <label className="toggle-label">
                  <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} />
                  <span>Gunakan Kamera (Scan QR)</span>
                </label>
                <label className="toggle-label" style={{ marginLeft: 16 }}>
                  <input type="checkbox" checked={useRfid} onChange={(e) => setUseRfid(e.target.checked)} />
                  <span>RFID</span>
                </label>
              </div>

              {useCamera && (
                <div className="qr-camera-section">
                  <div id={QR_REGION_ID} className="qr-reader-region" />
                  {!scanning && !cameraError && <p className="text-muted text-center">Mengaktifkan kamera...</p>}
                  {cameraError && <p className="text-danger text-center">{cameraError}</p>}
                </div>
              )}

              {useRfid && (
                <div className="rfid-section">
                  <div className={`rfid-status ${rfidFocused ? 'ready' : 'not-ready'}`}>
                    <Wifi size={14} /> RFID Reader: {rfidFocused ? 'Siap' : 'Tidak Fokus (Klik Disini)'}
                  </div>
                  <input
                    ref={rfidInputRef}
                    type="text"
                    className="rfid-input"
                    placeholder="Siap Scan Kartu RFID"
                    autoComplete="off"
                    onFocus={() => setRfidFocused(true)}
                    onBlur={() => { setRfidFocused(false); setTimeout(() => useRfid && rfidInputRef.current?.focus(), 1500); }}
                    onKeyPress={handleRfidKeyPress}
                  />
                  <small className="text-muted">Pastikan kotak di atas tetap berwarna ungu saat scan.</small>
                </div>
              )}

              {result && <ScanResultCard result={result} waktu={waktu} />}
            </div>
          </div>
        </div>

        <div className="scan-side-col">
          <div className="ui-card">
            <div className="ui-card-body">
              <h3>Tips</h3>
              <ul>
                <li>Tunjukkan QR Code sampai terlihat jelas di kamera</li>
                <li>Posisikan QR Code tidak terlalu jauh maupun terlalu dekat</li>
              </ul>
            </div>
          </div>
          <div className="ui-card">
            <div className="ui-card-body">
              <h3>Penggunaan</h3>
              <ul>
                <li>Jika berhasil scan, data siswa/guru akan muncul di bawah preview kamera</li>
                <li>Klik tombol <strong className="text-success">Absen masuk</strong> / <strong className="text-warning">Absen pulang</strong> untuk mengubah waktu absensi</li>
                <li>Untuk melihat data absensi, klik tombol <strong>Dashboard</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src="/beep.mp3" preload="auto" />
    </div>
  );
}

function ScanResultCard({ result, waktu }) {
  if (result.error || result.success === false) {
    return (
      <div className="scan-result">
        <h3 className="text-danger">{result.alreadyMarked ? 'Sudah Absen' : 'Gagal'}</h3>
        <p>{result.message}</p>
        {result.data && (
          <p>
            <strong>{result.data.nama_siswa || result.data.nama_guru}</strong>
            {result.presensi && (
              <span className="text-muted"> — Masuk: {result.presensi.jam_masuk || '-'} | Pulang: {result.presensi.jam_keluar || '-'}</span>
            )}
          </p>
        )}
      </div>
    );
  }

  const { type, data, presensi } = result;
  const isSiswa = type === 'siswa';

  return (
    <div className="scan-result">
      <h3 className="text-success">Absen {waktu} berhasil</h3>
      <div className="scan-result-grid">
        {isSiswa && (
          <div className="scan-result-photo">
            {data.foto ? (
              <img src={`${UPLOADS_BASE_URL}/uploads/siswa/${data.foto}`} alt={data.nama_siswa} />
            ) : (
              <div className="scan-result-photo-placeholder"><GraduationCap size={56} strokeWidth={1.5} /></div>
            )}
            <p className="text-danger">Cocokkan wajah siswa dengan foto</p>
          </div>
        )}
        <div className="scan-result-info">
          {isSiswa ? (
            <>
              <p>Nama: <strong>{data.nama_siswa}</strong></p>
              <p>NIS: <strong>{data.nis}</strong></p>
              <p>Kelas: <strong>{data.kelas}</strong></p>
            </>
          ) : (
            <>
              <p>Nama: <strong>{data.nama_guru}</strong></p>
              <p>NUPTK: <strong>{data.nuptk}</strong></p>
              <p>No HP: <strong>{data.no_hp}</strong></p>
            </>
          )}
          <hr />
          <p>Jam masuk: <strong className="text-info">{presensi?.jam_masuk || '-'}</strong></p>
          <p>Jam pulang: <strong className="text-info">{presensi?.jam_keluar || '-'}</strong></p>
        </div>
      </div>
    </div>
  );
}
