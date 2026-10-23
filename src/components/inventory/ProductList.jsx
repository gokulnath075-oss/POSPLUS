import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  Package, Plus, Search, Tag, Edit, Trash2, ArrowUpDown,
  Download, AlertTriangle, Layers, Filter, CheckCircle2
} from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { formatCurrency } from '../../utils/formatters';

export function ProductList({ onNavigateToBarcodeTag }) {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesGender = selectedGender === 'All' || p.gender === selectedGender;
    const totalStock = p.variants?.reduce((s, v) => s + (Number(v.stock) || 0), 0) || 0;
    const isLow = totalStock <= 5;
    const matchesStock = !filterLowStock || isLow;

    const q = search.toLowerCase().trim();
    const matchesQuery = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.variants && p.variants.some(v => (v.barcode && v.barcode.includes(q)) || v.size.toLowerCase().includes(q) || v.color.toLowerCase().includes(q)));

    return matchesCat && matchesGender && matchesStock && matchesQuery;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Quick adjust variant stock
  const handleAdjustStock = async (productId, variantId, delta) => {
    const prod = await db.products.get(productId);
    if (!prod) return;
    const updated = prod.variants.map(v => {
      if (v.id === variantId) {
        return { ...v, stock: Math.max(0, (Number(v.stock) || 0) + delta) };
      }
      return v;
    });
    await db.products.update(productId, { variants: updated });
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      await db.products.delete(id);
    }
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    const headers = ['Product Name', 'Brand', 'Category', 'Gender', 'Size', 'Color', 'Barcode', 'Cost Price', 'MRP', 'Selling Price', 'Stock', 'HSN', 'GST Rate'];
    const rows = [];

    products.forEach(p => {
      p.variants?.forEach(v => {
        rows.push([
          `"${p.name}"`,
          `"${p.brand || ''}"`,
          `"${p.category || ''}"`,
          `"${p.gender || ''}"`,
          `"${v.size || ''}"`,
          `"${v.color || ''}"`,
          `"${v.barcode || ''}"`,
          v.costPrice || 0,
          v.mrp || 0,
          v.sellingPrice || 0,
          v.stock || 0,
          `"${p.hsn || ''}"`,
          `${p.taxRate || 5}%`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clothing_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-400" />
            Garments & Inventory Catalog
          </h1>
          <p className="text-sm text-slate-400">
            Manage clothing sizes, stock levels, barcodes, MRP and Indian GST tax slabs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Garment
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search garments by name, brand, barcode number, size, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
            >
              <option value="All">All Genders</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Boys">Boys</option>
              <option value="Girls">Girls</option>
            </select>

            <button
              type="button"
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                filterLowStock
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Only
            </button>
          </div>
        </div>
      </div>

      {/* Garments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Garment / Brand</th>
                <th className="p-3.5">Category / HSN</th>
                <th className="p-3.5">Size & Color Variants</th>
                <th className="p-3.5 text-center">Total Stock</th>
                <th className="p-3.5 text-right">Price Range</th>
                <th className="p-3.5 text-right">GST %</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No garment products match the current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const totalStock = p.variants?.reduce((s, v) => s + (Number(v.stock) || 0), 0) || 0;
                  const minPrice = Math.min(...(p.variants?.map(v => v.sellingPrice) || [0]));
                  const maxPrice = Math.max(...(p.variants?.map(v => v.sellingPrice) || [0]));

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      {/* Product Name & Brand */}
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                          <span className="font-medium text-indigo-400">{p.brand}</span>
                          <span>•</span>
                          <span>{p.gender}</span>
                          {p.material && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500">{p.material}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category & HSN */}
                      <td className="p-3.5">
                        <div className="font-medium text-slate-200">{p.category}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">HSN: {p.hsn || '6205'}</div>
                      </td>

                      {/* Size & Color Matrix Chips */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {p.variants?.map(v => (
                            <div
                              key={v.id}
                              className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-[11px]"
                            >
                              <span className="font-bold text-amber-400">{v.size}</span>
                              <span className="text-slate-500">|</span>
                              <span className="text-slate-300">{v.color}</span>
                              <span className="text-slate-500">|</span>
                              <span className={`font-mono font-bold ${v.stock <= 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {v.stock} pcs
                              </span>

                              {/* Quick stock +/- */}
                              <div className="flex items-center ml-1 border-l border-slate-800 pl-1">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(p.id, v.id, -1)}
                                  className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-white"
                                  title="Decrease stock"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(p.id, v.id, 1)}
                                  className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-white"
                                  title="Increase stock"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Stock */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                          totalStock === 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : totalStock <= 5
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {totalStock} pcs
                        </span>
                      </td>

                      {/* Price Range */}
                      <td className="p-3.5 text-right font-bold text-slate-200">
                        {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`}
                      </td>

                      {/* GST */}
                      <td className="p-3.5 text-right font-medium text-slate-400">
                        {p.taxRate}%
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Tag Shortcut */}
                          <button
                            type="button"
                            onClick={() => onNavigateToBarcodeTag?.(p.id)}
                            title="Generate Barcode Tags for this garment"
                            className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            title="Edit product"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Delete product"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Garment Modal */}
      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
