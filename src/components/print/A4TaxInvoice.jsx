import React from 'react';
import { formatCurrency, formatDate, numberToWordsIndian } from '../../utils/formatters';

export function A4TaxInvoice({ sale, settings, qrDataUrl }) {
  if (!sale) return null;

  return (
    <div className="bg-white text-black text-[12px] leading-snug p-8 max-w-[210mm] mx-auto border border-gray-300 shadow-md select-text">
      {/* Header */}
      <div className="text-center pb-3 border-b-2 border-slate-900">
        <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">{settings?.storeName || 'POS PLUS APPARELS'}</h1>
        <p className="text-sm font-semibold text-slate-700">{settings?.tagline}</p>
        <p className="text-xs text-gray-700 mt-1">{settings?.address}, {settings?.city}, {settings?.state} - {settings?.pincode}</p>
        <div className="flex justify-center gap-6 mt-1 text-xs font-medium">
          <span>Phone: {settings?.phone}</span>
          <span>Email: {settings?.email}</span>
          <span className="font-bold text-slate-950">GSTIN: {settings?.gstin}</span>
          <span>State Code: {settings?.stateCode || '29'}</span>
        </div>
      </div>

      <div className="bg-slate-100 py-1 px-3 my-2 text-center font-bold text-sm tracking-widest uppercase border-y border-slate-300">
        TAX INVOICE
      </div>

      {/* Invoice & Buyer Info Grid */}
      <div className="grid grid-cols-2 border border-slate-300 rounded mb-4 text-xs">
        <div className="p-3 border-r border-slate-300 space-y-1">
          <p className="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-1">Invoice Details:</p>
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice No:</span>
            <span className="font-bold">{sale.invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice Date:</span>
            <span>{formatDate(sale.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Place of Supply:</span>
            <span>{settings?.state || 'Local'} ({settings?.stateCode || '29'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reverse Charge:</span>
            <span>No</span>
          </div>
        </div>

        <div className="p-3 space-y-1">
          <p className="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-1">Billed To (Customer):</p>
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-bold">{sale.customerName || 'Cash Customer'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span>{sale.customerPhone || 'N/A'}</span>
          </div>
          {sale.customerGstin && (
            <div className="flex justify-between font-semibold">
              <span className="text-gray-600">GSTIN:</span>
              <span>{sale.customerGstin}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Mode:</span>
            <span className="font-bold uppercase text-slate-800">{sale.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-slate-300 text-xs mb-4">
        <thead>
          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
            <th className="border border-slate-300 p-1.5 text-center w-8">#</th>
            <th className="border border-slate-300 p-1.5 text-left">Description of Goods</th>
            <th className="border border-slate-300 p-1.5 text-center w-16">HSN</th>
            <th className="border border-slate-300 p-1.5 text-center w-12">Qty</th>
            <th className="border border-slate-300 p-1.5 text-right w-16">MRP</th>
            <th className="border border-slate-300 p-1.5 text-right w-16">Rate</th>
            <th className="border border-slate-300 p-1.5 text-right w-16">Disc</th>
            <th className="border border-slate-300 p-1.5 text-right w-20">Taxable</th>
            <th className="border border-slate-300 p-1.5 text-center w-12">GST %</th>
            <th className="border border-slate-300 p-1.5 text-right w-20">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, index) => (
            <tr key={index} className="border-b border-slate-200">
              <td className="border border-slate-300 p-1.5 text-center">{index + 1}</td>
              <td className="border border-slate-300 p-1.5 font-medium">
                <div>{item.name}</div>
                <div className="text-[10px] text-gray-500">
                  {item.brand && <span className="mr-2">Brand: {item.brand}</span>}
                  {item.size && <span className="mr-2 font-semibold text-slate-700">Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>
              </td>
              <td className="border border-slate-300 p-1.5 text-center">{item.hsn || '6205'}</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">{item.qty}</td>
              <td className="border border-slate-300 p-1.5 text-right text-gray-500 line-through">₹{item.mrp || item.unitPrice}</td>
              <td className="border border-slate-300 p-1.5 text-right">₹{item.unitPrice}</td>
              <td className="border border-slate-300 p-1.5 text-right text-green-700">
                {item.discountAmount > 0 ? `₹${item.discountAmount}` : '-'}
              </td>
              <td className="border border-slate-300 p-1.5 text-right">₹{item.taxableAmount}</td>
              <td className="border border-slate-300 p-1.5 text-center font-medium">{item.taxRate}%</td>
              <td className="border border-slate-300 p-1.5 text-right font-bold">₹{item.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & Tax Summary Layout */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Left Side: HSN Tax Summary */}
        <div className="col-span-7">
          <p className="font-bold text-xs uppercase mb-1">GST Tax Breakdown:</p>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 font-semibold text-gray-700">
                <th className="border border-slate-300 p-1 text-center">HSN</th>
                <th className="border border-slate-300 p-1 text-right">Taxable (₹)</th>
                <th className="border border-slate-300 p-1 text-right">CGST</th>
                <th className="border border-slate-300 p-1 text-right">SGST</th>
                <th className="border border-slate-300 p-1 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody>
              {sale.hsnSummary ? (
                sale.hsnSummary.map((h, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-1 text-center font-mono">{h.hsn}</td>
                    <td className="border border-slate-300 p-1 text-right">₹{h.taxableValue.toFixed(2)}</td>
                    <td className="border border-slate-300 p-1 text-right">₹{h.cgst.toFixed(2)} ({h.taxRate / 2}%)</td>
                    <td className="border border-slate-300 p-1 text-right">₹{h.sgst.toFixed(2)} ({h.taxRate / 2}%)</td>
                    <td className="border border-slate-300 p-1 text-right font-bold">₹{h.totalTax.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-slate-300 p-1 text-center">6205</td>
                  <td className="border border-slate-300 p-1 text-right">₹{sale.taxableSubtotal}</td>
                  <td className="border border-slate-300 p-1 text-right">₹{sale.totalCGST}</td>
                  <td className="border border-slate-300 p-1 text-right">₹{sale.totalSGST}</td>
                  <td className="border border-slate-300 p-1 text-right font-bold">₹{sale.totalTax}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Amount In Words */}
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
            <span className="font-semibold text-gray-700">Amount in Words: </span>
            <span className="font-bold text-slate-900 italic">{numberToWordsIndian(sale.netTotal)}</span>
          </div>
        </div>

        {/* Right Side: Total Calculation */}
        <div className="col-span-5 bg-slate-50 p-3 rounded border border-slate-300 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.billDiscount > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Bill Discount:</span>
              <span>- {formatCurrency(sale.billDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Taxable Amount:</span>
            <span>{formatCurrency(sale.taxableSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">CGST Amount:</span>
            <span>{formatCurrency(sale.totalCGST)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">SGST Amount:</span>
            <span>{formatCurrency(sale.totalSGST)}</span>
          </div>
          {sale.totalIGST > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">IGST Amount:</span>
              <span>{formatCurrency(sale.totalIGST)}</span>
            </div>
          )}
          {sale.roundOff !== 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Round Off:</span>
              <span>{sale.roundOff > 0 ? `+${sale.roundOff}` : sale.roundOff}</span>
            </div>
          )}
          <div className="border-t-2 border-slate-800 pt-1.5 flex justify-between font-black text-base text-slate-950">
            <span>TOTAL AMOUNT:</span>
            <span>{formatCurrency(sale.netTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer / QR / Signatures */}
      <div className="grid grid-cols-12 gap-4 pt-3 border-t border-slate-300 text-xs items-center">
        {/* UPI QR Payment */}
        <div className="col-span-3 flex items-center gap-2">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="UPI QR" className="w-16 h-16 border p-0.5 rounded" />
          )}
          <div className="text-[10px] text-gray-600">
            <p className="font-bold text-slate-800">Scan & Pay via UPI</p>
            <p>{settings?.upiId}</p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="col-span-5 text-[10px] text-gray-600 space-y-0.5">
          <p className="font-bold text-slate-800">Terms & Conditions:</p>
          <p>1. {settings?.exchangePolicy || 'Goods once sold can be exchanged within 7 days with bill and tags.'}</p>
          <p>2. Subject to {settings?.city || 'Local'} Jurisdiction.</p>
        </div>

        {/* Signatory */}
        <div className="col-span-4 text-center">
          <p className="font-bold text-slate-800 text-xs">For {settings?.storeName || 'POS PLUS APPARELS'}</p>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1 font-semibold text-[10px]">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
