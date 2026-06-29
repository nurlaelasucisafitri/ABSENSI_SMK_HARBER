/**
 * Mengirim notifikasi WhatsApp via Fonnte API.
 * Mengikuti logic asli App\Libraries\Whatsapp\Fonnte\Fonnte.php
 * Lihat https://md.fonnte.com/ untuk dokumentasi API & cara mendapatkan token.
 */
export async function sendWhatsAppNotification(destination, message) {
  const enabled = process.env.WA_NOTIFICATION === 'true';
  const provider = process.env.WHATSAPP_PROVIDER;
  const token = process.env.WHATSAPP_TOKEN;

  if (!enabled || !provider || !token) {
    console.log('[WA] Pengiriman dilewati. enabled:', enabled, 'provider:', provider, 'token ada:', !!token);
    return { skipped: true };
  }

  if (provider !== 'Fonnte') {
    return { skipped: true, reason: 'Provider tidak didukung' };
  }

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ target: destination, message }),
  });

  const result = await response.json().catch(() => ({}));
  console.log('[WA] Respons Fonnte:', JSON.stringify(result));
  return result;
}