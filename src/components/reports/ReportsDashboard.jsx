import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  BarChart3, Calendar, TrendingUp, DollarSign, CreditCard, Banknote,
  QrCode, FileSpreadsheet, Printer, Search, ArrowUpRight, PieChart
} from 'lucide-react';
import { PrintModal } from '../print/PrintModal';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export function ReportsDashboard({ settings }) {
  const sales = useLiveQuery(() => db.sales.reverse().toArray(), []) || [];
  
  // Date filter: 'today' | 'week' | 'month' | 'all'
  const [dateFilter, setDateFilter] = useState('today');
  const [reprintSale, setReprintSale] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Opening Cash State for Day Closing (Z-Report)
  const [openingCash, setOpeningCash] = useState(2000);
  const [pettyExpenses, setPettyExpenses] = useState(150);

  // Filter sales based on date
  const now = new Date();
  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.date);
    if (dateFilter === 'today') {
      return saleDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return saleDate >= oneWeekAgo;
    } else if (dateFilter === 'month') {
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // KPI Calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.netTotal || 0), 0);
  const totalOrders = filteredSales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Payment Breakdown
  let cashSales = 0;
  let upiSales = 0;
  let cardSales = 0;
  let creditSales = 0;

  filteredSales.forEach(s => {
    if (s.paymentDetails) {
      cashSales += Number(s.paymentDetails.cash) || 0;
      upiSales += Number(s.paymentDetails.upi) || 0;
      cardSales += Number(s.paymentDetails.card) || 0;
      creditSales += Number(s.paymentDetails.credit) || 0;
    } else {
      if (s.paymentMethod === 'cash') cashSales += s.netTotal;
      else if (s.paymentMethod === 'upi') upiSales += s.netTotal;
      else if (s.paymentMethod === 'card') cardSales += s.netTotal;
      else if (s.paymentMethod === 'credit') creditSales += s.netTotal;
    }
  });

  // Indian GST Totals
  const totalTaxable = filteredSales.reduce((sum, s) => sum + (s.taxableSubtotal || 0), 0);
  const totalCGST = filteredSales.reduce((sum, s) => sum + (s.totalCGST || 0), 0);
  const totalSGST = filteredSales.reduce((sum, s) => sum + (s.totalSGST || 0), 0);
  const totalIGST = filteredSales.reduce((sum, s) => sum + (s.totalIGST || 0), 0);
  const totalGST = totalCGST + totalSGST + totalIGST;

  // HSN Breakdown
  const hsnMap = {};
  filteredSales.forEach(s => {
    s.items?.forEach(i => {
      const code = i.hsn || '6205';
      if (!hsnMap[code]) {
        hsnMap[code] = { hsn: code, qty: 0, taxable: 0, gst: 0 };
      }
      hsnMap[code].qty += Number(i.qty) || 1;
      hsnMap[code].taxable += Number(i.taxableAmount) || 0;
      hsnMap[code].gst += Number(i.totalTax) || 0;
    });
  });
  const hsnList = Object.values(hsnMap);

  // Clothing Category breakdown
  const categoryMap = {};
  filteredSales.forEach(s => {
    s.items?.forEach(i => {
      const cat = i.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(i.totalAmount) || 0);
    });
  });

  // Cash Drawer Closing Calculator
  const estimatedDrawerCash = openingCash + cashSales - pettyExpenses;

  // Export Sales Report to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date & Time', 'Customer', 'Phone', 'Items Count', 'Payment Mode', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Net Total'];
    const rows = filteredSales.map(s => [
      `"${s.invoiceNo}"`,
      `"${formatDateTime(s.date)}"`,
      `"${s.customerName || 'Walk-in'}"`,
      `"${s.customerPhone || ''}"`,
      s.items?.length || 0,
      `"${s.paymentMethod}"`,
      s.taxableSubtotal || 0,
      s.totalCGST || 0,
      s.totalSGST || 0,
      s.totalIGST || 0,
      s.netTotal || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search filter on invoices table
  const searchedSales = filteredSales.filter(s => {
    const q = invoiceSearch.toLowerCase().trim();
    return !q || s.invoiceNo.toLowerCase().includes(q) || (s.customerName && s.customerName.toLowerCase().includes(q)) || (s.customerPhone && s.customerPhone.includes(q));
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Sales Reports & GST Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Real-time daily turnover, cash drawer closing, payment collections, and GST filing report
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Filter */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {['today', 'week', 'month', 'all'].map(period => (
              <button
                key={period}
                type="button"
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                  dateFilter === period
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period === 'today' ? "Today's Sales" : period}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Total Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Across {totalOrders} customer orders</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Cash Collected</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatCurrency(cashSales)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Physical cash received</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>UPI QR Collection</span>
            <QrCode className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400 mt-2">
            {formatCurrency(upiSales)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bank direct credit</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>GST Tax Collected</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-2">
            {formatCurrency(totalGST)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">CGST: ₹{totalCGST.toFixed(0)} | SGST: ₹{totalSGST.toFixed(0)}</p>
        </div>
      </div>

      {/* Day End Cash Drawer Reconciliation (Z-Report) & Payment Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cash Drawer Z-Report (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              Day-End Cash Reconciliation (Z-Report)
            </h3>
            <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              Today's Drawer
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Opening Cash in Till (Float):</span>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-right font-mono"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">+ Total Cash Sales:</span>
              <span className="font-mono font-bold text-emerald-400">+{formatCurrency(cashSales)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">- Petty Cash Expenses (Tea / Cleaning / Bags):</span>
              <input
                type="number"
                value={pettyExpenses}
                onChange={(e) => setPettyExpenses(Number(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-right font-mono"
              />
            </div>

            <div className="pt-3 border-t-2 border-slate-800 flex justify-between items-center text-sm">
              <span className="font-bold text-white">Expected Closing Cash in Drawer:</span>
              <span className="text-xl font-black text-emerald-400">{formatCurrency(estimatedDrawerCash)}</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Payment Mode Collection
            </h3>
            <span className="text-xs text-slate-400">{filteredSales.length} Transactions</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-400" /> Cash Sales
              </div>
              <div className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(cashSales)}</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-400" /> UPI Collection
              </div>
              <div className="text-lg font-black text-teal-400 mt-1">{formatCurrency(upiSales)}</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-400" /> Card / POS
              </div>
              <div className="text-lg font-black text-sky-400 mt-1">{formatCurrency(cardSales)}</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Khata Credit
              </div>
              <div className="text-lg font-black text-amber-400 mt-1">{formatCurrency(creditSales)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Indian GST Filing Summary (GSTR-1 Ready) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Indian GST Filing Summary (HSN-wise GSTR-1)</h3>
            <p className="text-xs text-slate-400">HSN code summary ready for your CA / tax consultant</p>
          </div>
          <div className="text-xs text-right">
            <span className="text-slate-400">Total Taxable Value: </span>
            <span className="font-bold text-white">{formatCurrency(totalTaxable)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
              <tr>
                <th className="p-2.5">HSN Code</th>
                <th className="p-2.5 text-center">Pieces Sold</th>
                <th className="p-2.5 text-right">Taxable Turnover (₹)</th>
                <th className="p-2.5 text-right">CGST (₹)</th>
                <th className="p-2.5 text-right">SGST (₹)</th>
                <th className="p-2.5 text-right">Total GST (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {hsnList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No sales recorded in this period.
                  </td>
                </tr>
              ) : (
                hsnList.map(h => (
                  <tr key={h.hsn} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono font-bold text-white">{h.hsn}</td>
                    <td className="p-2.5 text-center font-bold text-slate-300">{h.qty} pcs</td>
                    <td className="p-2.5 text-right font-medium">{formatCurrency(h.taxable)}</td>
                    <td className="p-2.5 text-right text-slate-400">{formatCurrency(h.gst / 2)}</td>
                    <td className="p-2.5 text-right text-slate-400">{formatCurrency(h.gst / 2)}</td>
                    <td className="p-2.5 text-right font-bold text-indigo-300">{formatCurrency(h.gst)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice History & Reprinting Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Sales Invoices History ({searchedSales.length})</h3>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search invoice no or customer..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
              <tr>
                <th className="p-2.5">Invoice No</th>
                <th className="p-2.5">Date & Time</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5 text-center">Mode</th>
                <th className="p-2.5 text-right">Net Amount</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {searchedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No matching sales invoices found.
                  </td>
                </tr>
              ) : (
                searchedSales.slice(0, 20).map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono font-bold text-white">{sale.invoiceNo}</td>
                    <td className="p-2.5 text-slate-400">{formatDateTime(sale.date)}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-200">{sale.customerName}</div>
                      {sale.customerPhone && <div className="text-[10px] text-slate-500">{sale.customerPhone}</div>}
                    </td>
                    <td className="p-2.5 text-slate-400">{sale.items?.length} items</td>
                    <td className="p-2.5 text-center uppercase font-mono font-bold text-indigo-400">
                      {sale.paymentMethod}
                    </td>
                    <td className="p-2.5 text-right font-black text-emerald-400 text-sm">
                      {formatCurrency(sale.netTotal)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setReprintSale(sale)}
                        className="flex items-center gap-1 mx-auto px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold transition"
                      >
                        <Printer className="w-3 h-3" /> Reprint
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reprint Modal */}
      {reprintSale && (
        <PrintModal
          sale={reprintSale}
          settings={settings}
          onClose={() => setReprintSale(null)}
        />
      )}
    </div>
  );
}
