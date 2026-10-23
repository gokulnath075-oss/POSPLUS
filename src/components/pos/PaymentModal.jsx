import React, { useState, useEffect } from 'react';
import { QrCode, Banknote, CreditCard, Users, Split, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { generateUpiQrDataUrl } from '../../utils/upi';
import { formatCurrency } from '../../utils/formatters';
import { playSuccessSound } from '../../utils/sound';

export function PaymentModal({
  cartTotals,
  customer,
  settings,
  invoiceNo,
  onComplete,
  onClose,
}) {
  const [method, setMethod] = useState('cash'); // 'cash' | 'upi' | 'card' | 'credit' | 'split'
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [cardRef, setCardRef] = useState('');
  
  // Split payment state
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [splitCard, setSplitCard] = useState('');

  // Loyalty Redemption
  const [redeemLoyalty, setRedeemLoyalty] = useState(false);
  const availablePoints = customer?.loyaltyPoints || 0;
  const pointValue = settings?.pointValueInRupees || 1;
  const maxLoyaltyDiscount = Math.min(cartTotals.netPayable, availablePoints * pointValue);
  
  const finalPayable = redeemLoyalty
    ? Math.max(0, cartTotals.netPayable - maxLoyaltyDiscount)
    : cartTotals.netPayable;

  // Auto-generate Dynamic UPI QR
  useEffect(() => {
    async function loadQR() {
      if (settings?.upiId) {
        const qr = await generateUpiQrDataUrl({
          upiId: settings.upiId,
          payeeName: settings.storeName || 'POS PLUS',
          amount: finalPayable,
          note: `Bill ${invoiceNo}`,
        });
        setUpiQrUrl(qr);
      }
    }
    loadQR();
  }, [finalPayable, settings, invoiceNo]);

  // Cash change due
  const cashNum = Number(tenderedAmount) || 0;
  const changeDue = Math.max(0, cashNum - finalPayable);

  // Split sum
  const splitTotal = (Number(splitCash) || 0) + (Number(splitUpi) || 0) + (Number(splitCard) || 0);
  const splitRemaining = finalPayable - splitTotal;

  // Quick cash preset helper
  const handleCashPreset = (amount) => {
    setTenderedAmount(amount.toString());
  };

  const handleFinish = (e) => {
    e?.preventDefault();

    if (method === 'cash' && cashNum < finalPayable && cashNum > 0) {
      if (!confirm(`Tendered amount (₹${cashNum}) is less than total (₹${finalPayable}). Proceed as partial payment?`)) {
        return;
      }
    }

    if (method === 'split' && splitRemaining !== 0) {
      alert(`Split payment total (₹${splitTotal}) does not match net payable (₹${finalPayable}). Remaining: ₹${splitRemaining}`);
      return;
    }

    if (method === 'credit' && !customer) {
      alert('Please select or add a customer to bill to Khata / Store Credit.');
      return;
    }

    playSuccessSound();

    onComplete({
      paymentMethod: method,
      netTotal: finalPayable,
      tenderedAmount: method === 'cash' ? cashNum : finalPayable,
      changeAmount: method === 'cash' ? changeDue : 0,
      loyaltyPointsRedeemed: redeemLoyalty ? (maxLoyaltyDiscount / pointValue) : 0,
      paymentDetails: {
        cash: method === 'cash' ? (cashNum || finalPayable) : (Number(splitCash) || 0),
        upi: method === 'upi' ? finalPayable : (Number(splitUpi) || 0),
        card: method === 'card' ? finalPayable : (Number(splitCard) || 0),
        credit: method === 'credit' ? finalPayable : 0,
        upiRef: upiRef.trim(),
        cardRef: cardRef.trim(),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Collect Payment
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                {invoiceNo}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customer: {customer ? `${customer.name} (${customer.phone})` : 'Walk-in Cash Customer'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Display Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 text-center border-b border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Net Amount to Collect</p>
          <div className="text-4xl font-black text-white mt-1 tracking-tight">
            {formatCurrency(finalPayable)}
          </div>

          {/* Loyalty Discount Option */}
          {customer && availablePoints > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs text-indigo-300">
              <input
                type="checkbox"
                id="redeemPoints"
                checked={redeemLoyalty}
                onChange={(e) => setRedeemLoyalty(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <label htmlFor="redeemPoints" className="cursor-pointer">
                Redeem <strong>{availablePoints} points</strong> to save ₹{maxLoyaltyDiscount}
              </label>
            </div>
          )}
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-5 p-2 bg-slate-950/70 border-b border-slate-800 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMethod('cash')}
            className={`flex flex-col items-center py-2.5 rounded-xl transition ${
              method === 'cash' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-5 h-5 mb-1" />
            <span>Cash</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('upi')}
            className={`flex flex-col items-center py-2.5 rounded-xl transition ${
              method === 'upi' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-5 h-5 mb-1 text-teal-400" />
            <span>UPI QR</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`flex flex-col items-center py-2.5 rounded-xl transition ${
              method === 'card' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-1 text-sky-400" />
            <span>Card / POS</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('split')}
            className={`flex flex-col items-center py-2.5 rounded-xl transition ${
              method === 'split' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Split className="w-5 h-5 mb-1 text-purple-400" />
            <span>Split Pay</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('credit')}
            className={`flex flex-col items-center py-2.5 rounded-xl transition ${
              method === 'credit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-5 h-5 mb-1 text-amber-400" />
            <span>Khata Credit</span>
          </button>
        </div>

        {/* Method Specific Form Area */}
        <div className="p-6 space-y-4 flex-1">
          {/* CASH MODE */}
          {method === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Tendered Cash Amount (₹)</label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    autoFocus
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    placeholder={finalPayable.toString()}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-2xl font-black rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCashPreset(finalPayable)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
                >
                  Exact (₹{finalPayable})
                </button>
                {[500, 1000, 1500, 2000, 3000, 5000]
                  .filter(amt => amt >= finalPayable || amt === 500)
                  .map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleCashPreset(preset)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
                    >
                      ₹{preset}
                    </button>
                  ))}
              </div>

              {/* Change Calculator Display */}
              {cashNum > 0 && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  changeDue >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <span className="text-sm font-semibold text-slate-300">
                    {cashNum >= finalPayable ? 'Change to Return:' : 'Short Amount:'}
                  </span>
                  <span className={`text-2xl font-black ${cashNum >= finalPayable ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formatCurrency(Math.abs(cashNum - finalPayable))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* UPI DYNAMIC QR MODE */}
          {method === 'upi' && (
            <div className="flex flex-col items-center space-y-3 text-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-teal-500/40">
                {upiQrUrl ? (
                  <img src={upiQrUrl} alt="Dynamic UPI QR" className="w-48 h-48 object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">Generating QR...</div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Ask Customer to Scan with Any UPI App</p>
                <p className="text-[11px] text-slate-400">PhonePe • Google Pay • Paytm • BHIM • Cred • Any Banking UPI</p>
                <p className="text-xs font-mono text-slate-300 mt-1">UPI ID: {settings?.upiId || 'posplus@okhdfcbank'}</p>
              </div>

              <div className="w-full max-w-sm pt-2">
                <input
                  type="text"
                  placeholder="Optional UPI UTR / Transaction Ref (e.g. 429188...)"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 text-center"
                />
              </div>
            </div>
          )}

          {/* CARD MODE */}
          {method === 'card' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl text-center">
                <p className="text-sm font-bold text-sky-400">Swipe or Tap Customer Card on EDC Machine</p>
                <p className="text-2xl font-black text-white mt-1">{formatCurrency(finalPayable)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Card Last 4 Digits / Approval Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 8421 or AUTH-0982"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* SPLIT PAYMENT MODE */}
          {method === 'split' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Cash (₹)</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    placeholder="0"
                    className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">UPI (₹)</label>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    placeholder="0"
                    className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Card (₹)</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    placeholder="0"
                    className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span>Split Entered: <strong className="text-white">₹{splitTotal}</strong></span>
                <span className={splitRemaining === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {splitRemaining === 0 ? '✓ Balanced' : `Remaining: ₹${splitRemaining}`}
                </span>
              </div>
            </div>
          )}

          {/* KHATA CREDIT MODE */}
          {method === 'credit' && (
            <div className="space-y-3">
              {customer ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-bold text-white">{customer.name} ({customer.phone})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Current Outstanding:</span>
                    <span className="font-bold text-amber-400">{formatCurrency(customer.creditBalance || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-amber-500/20 pt-2">
                    <span className="text-slate-300 font-semibold">New Total Outstanding:</span>
                    <span className="font-black text-amber-400 text-sm">
                      {formatCurrency((customer.creditBalance || 0) + finalPayable)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-xs">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>No customer selected. Please attach a customer with phone number to record Store Credit / Khata.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Cancel / Back
          </button>

          <button
            type="button"
            onClick={handleFinish}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 transition cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            Complete Sale & Print (F8 / Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
