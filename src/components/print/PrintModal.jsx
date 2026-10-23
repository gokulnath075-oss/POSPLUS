import React, { useState, useEffect } from 'react';
import { Printer, X, Download, Share2, FileText, CheckCircle2 } from 'lucide-react';
import { ThermalReceipt } from './ThermalReceipt';
import { A4TaxInvoice } from './A4TaxInvoice';
import { generateUpiQrDataUrl } from '../../utils/upi';
import { formatCurrency } from '../../utils/formatters';

export function PrintModal({ sale, settings, onClose }) {
  const [printFormat, setPrintFormat] = useState(settings?.thermalSize || '80mm');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadQR() {
      if (sale && settings?.upiId) {
        const url = await generateUpiQrDataUrl({
          upiId: settings.upiId,
          payeeName: settings.storeName,
          amount: sale.netTotal,
          note: `Bill ${sale.invoiceNo}`,
        });
        setQrDataUrl(url);
      }
    }
    loadQR();
  }, [sale, settings]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!sale?.customerPhone) {
      alert('Please enter a customer mobile number to send via WhatsApp');
      return;
    }
    const cleanPhone = sale.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const itemsList = sale.items
      ?.map(i => `• ${i.name} (${i.size || ''}) x${i.qty} - ₹${i.totalAmount}`)
      .join('\n');

    const msg = `🧾 *${settings?.storeName || 'POS PLUS APPARELS'}*\n*Tax Invoice: ${sale.invoiceNo}*\nDate: ${new Date(sale.date).toLocaleDateString()}\n\nItems:\n${itemsList}\n\n*Total Amount: ₹${sale.netTotal}*\nPayment Mode: ${sale.paymentMethod.toUpperCase()}\n\nThank you for shopping with us! Please visit again.`;

    const waUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] no-print">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sale Completed Successfully
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {sale?.invoiceNo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Total: {formatCurrency(sale?.netTotal)} | {sale?.items?.length} Items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Selector */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  printFormat === '80mm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('58mm')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  printFormat === '58mm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm Thermal
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  printFormat === 'A4' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 GST Invoice
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Print Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center items-start">
          <div className="print-area">
            {printFormat === 'A4' ? (
              <A4TaxInvoice sale={sale} settings={settings} qrDataUrl={qrDataUrl} />
            ) : (
              <ThermalReceipt
                sale={sale}
                settings={{ ...settings, thermalSize: printFormat }}
                qrDataUrl={qrDataUrl}
              />
            )}
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sale?.customerPhone && (
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
              >
                <Share2 className="w-4 h-4" />
                Send via WhatsApp
              </button>
            )}
            <span className="text-xs text-slate-400">
              Hotkeys: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Enter</kbd> to Print, <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Esc</kbd> to Close
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Close / New Bill
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
              autoFocus
            >
              <Printer className="w-4 h-4" />
              Print Receipt (Ctrl + P)
            </button>
          </div>
        </div>
      </div>

      {/* Actual Print Wrapper (Visible only during window.print()) */}
      <div className="print-only">
        {printFormat === 'A4' ? (
          <A4TaxInvoice sale={sale} settings={settings} qrDataUrl={qrDataUrl} />
        ) : (
          <ThermalReceipt
            sale={sale}
            settings={{ ...settings, thermalSize: printFormat }}
            qrDataUrl={qrDataUrl}
          />
        )}
      </div>
    </div>
  );
}
