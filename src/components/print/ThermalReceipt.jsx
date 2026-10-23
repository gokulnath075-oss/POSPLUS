import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function ThermalReceipt({ sale, settings, qrDataUrl }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && sale?.invoiceNo) {
      try {
        JsBarcode(barcodeRef.current, sale.invoiceNo, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 11,
          margin: 0,
        });
      } catch (err) {
        console.error('Failed to render barcode on receipt:', err);
      }
    }
  }, [sale?.invoiceNo]);

  if (!sale) return null;

  const is80mm = settings?.thermalSize !== '58mm';

  return (
    <div
      className={`bg-white text-black font-mono text-[11px] leading-tight p-3 mx-auto shadow-sm select-text ${
        is80mm ? 'w-[78mm] max-w-[78mm]' : 'w-[56mm] max-w-[56mm]'
      }`}
      style={{ fontFamily: "'Courier New', Courier, monospace" }}
    >
      {/* Store Header */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        <h1 className="text-base font-bold uppercase tracking-wide">{settings?.storeName || 'CLOTHING STORE'}</h1>
        {settings?.tagline && <p className="text-[10px] italic text-gray-700">{settings?.tagline}</p>}
        <p className="text-[10px] mt-0.5">{settings?.address}</p>
        <p className="text-[10px]">{settings?.city}, {settings?.state} - {settings?.pincode}</p>
        <p className="text-[10px]">Ph: {settings?.phone}</p>
        {settings?.gstin && (
          <p className="text-[10px] font-bold mt-0.5">GSTIN: {settings?.gstin}</p>
        )}
      </div>

      {/* Bill Info */}
      <div className="py-2 border-b border-dashed border-gray-400 text-[10px]">
        <div className="flex justify-between">
          <span className="font-bold">INVOICE: {sale.invoiceNo}</span>
          <span>{formatDateTime(sale.date)}</span>
        </div>
        {sale.customerName && (
          <div className="flex justify-between mt-0.5">
            <span>Customer: {sale.customerName}</span>
            <span>{sale.customerPhone}</span>
          </div>
        )}
        <div className="flex justify-between mt-0.5 text-gray-600">
          <span>Mode: <strong className="uppercase text-black">{sale.paymentMethod}</strong></span>
          <span>Cashier: Admin</span>
        </div>
      </div>

      {/* Item Table */}
      <div className="py-2 border-b border-dashed border-gray-400">
        <div className="grid grid-cols-12 font-bold pb-1 text-[10px] border-b border-gray-300">
          <div className="col-span-6">ITEM (SIZE/COLOR)</div>
          <div className="col-span-2 text-right">QTY</div>
          <div className="col-span-2 text-right">RATE</div>
          <div className="col-span-2 text-right">TOTAL</div>
        </div>

        <div className="space-y-1.5 pt-1.5">
          {sale.items?.map((item, idx) => (
            <div key={idx} className="text-[10px]">
              <div className="font-medium truncate">{item.name}</div>
              <div className="flex justify-between text-gray-600 text-[9px]">
                <span>
                  {item.size ? `Size: ${item.size}` : ''}
                  {item.color ? ` | ${item.color}` : ''}
                  {item.hsn ? ` | HSN:${item.hsn}` : ''}
                </span>
                <span>{item.taxRate}% GST</span>
              </div>
              <div className="grid grid-cols-12 text-right">
                <div className="col-span-6"></div>
                <div className="col-span-2">{item.qty}</div>
                <div className="col-span-2">₹{item.unitPrice}</div>
                <div className="col-span-2 font-semibold">₹{item.totalAmount}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculations */}
      <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
        <div className="flex justify-between">
          <span>Total Items / Qty:</span>
          <span>{sale.items?.length} items ({sale.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0)} pcs)</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.billDiscount > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Bill Discount:</span>
            <span>- {formatCurrency(sale.billDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Taxable Amount:</span>
          <span>{formatCurrency(sale.taxableSubtotal)}</span>
        </div>
        {sale.totalCGST > 0 && (
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>CGST:</span>
            <span>{formatCurrency(sale.totalCGST)}</span>
          </div>
        )}
        {sale.totalSGST > 0 && (
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>SGST:</span>
            <span>{formatCurrency(sale.totalSGST)}</span>
          </div>
        )}
        {sale.totalIGST > 0 && (
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>IGST:</span>
            <span>{formatCurrency(sale.totalIGST)}</span>
          </div>
        )}
        {sale.roundOff !== 0 && (
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Round Off:</span>
            <span>{sale.roundOff > 0 ? `+${sale.roundOff}` : sale.roundOff}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-bold pt-1 border-t border-black">
          <span>NET AMOUNT:</span>
          <span className="text-base">{formatCurrency(sale.netTotal)}</span>
        </div>

        {sale.paymentMethod === 'cash' && sale.tenderedAmount > 0 && (
          <div className="pt-1 text-[10px] space-y-0.5 border-t border-dotted border-gray-400">
            <div className="flex justify-between">
              <span>Cash Tendered:</span>
              <span>{formatCurrency(sale.tenderedAmount)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Change Returned:</span>
              <span>{formatCurrency(sale.changeAmount || 0)}</span>
            </div>
          </div>
        )}

        {sale.loyaltyPointsEarned > 0 && (
          <div className="text-[10px] bg-gray-100 p-1 rounded text-center font-medium mt-1">
            ⭐ Earned {sale.loyaltyPointsEarned} Loyalty Points on this purchase!
          </div>
        )}
      </div>

      {/* Dynamic UPI QR Code on Bill (Customer can scan & pay directly or verify) */}
      {qrDataUrl && (
        <div className="py-2 text-center flex flex-col items-center border-b border-dashed border-gray-400">
          <p className="text-[9px] font-bold mb-1">SCAN QR CODE TO PAY / VERIFY</p>
          <img src={qrDataUrl} alt="UPI QR" className="w-24 h-24 object-contain" />
          <p className="text-[8px] text-gray-500 mt-0.5">UPI ID: {settings?.upiId}</p>
        </div>
      )}

      {/* Barcode of Invoice */}
      <div className="py-2 text-center flex flex-col items-center border-b border-dashed border-gray-400">
        <svg ref={barcodeRef} className="max-w-full"></svg>
      </div>

      {/* Footer & Exchange Policy */}
      <div className="pt-2 text-center text-[9px] space-y-1">
        <p className="font-semibold">{settings?.defaultTerms || 'Thank you! Visit again.'}</p>
        <p className="text-[8px] text-gray-600 leading-tight">
          {settings?.exchangePolicy || 'Exchange within 7 days with original tag and invoice.'}
        </p>
        <p className="text-[8px] text-gray-400">Powered by POS PLUS</p>
      </div>
    </div>
  );
}
