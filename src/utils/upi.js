import QRCode from 'qrcode';

/**
 * Builds standard NPCI UPI URI
 * @param {Object} options
 * @param {string} options.upiId e.g. "9876543210@upi" or "posplus@okhdfcbank"
 * @param {string} options.payeeName e.g. "POS PLUS APPARELS"
 * @param {number} options.amount e.g. 1499.00
 * @param {string} options.note e.g. "Bill POS-2026-0001"
 */
export function buildUpiUri({ upiId, payeeName, amount, note = 'Clothing Purchase' }) {
  if (!upiId) return '';
  const cleanId = upiId.trim();
  const cleanName = encodeURIComponent(payeeName?.trim() || 'Store');
  const cleanNote = encodeURIComponent(note.trim().slice(0, 30));
  const cleanAmount = Number(amount || 0).toFixed(2);

  return `upi://pay?pa=${cleanId}&pn=${cleanName}&am=${cleanAmount}&tn=${cleanNote}&cu=INR`;
}

/**
 * Generates Base64 Data URL QR Code image
 */
export async function generateUpiQrDataUrl(options) {
  const uri = buildUpiUri(options);
  if (!uri) return '';
  try {
    const dataUrl = await QRCode.toDataURL(uri, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '';
  }
}
