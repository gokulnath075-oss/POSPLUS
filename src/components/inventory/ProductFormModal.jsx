import React, { useState } from 'react';
import { db } from '../../db/db';
import { X, Plus, Trash2, Sparkles, Barcode, Check } from 'lucide-react';
import { generateBarcodeNumber } from '../../utils/formatters';
import { COMMON_APPAREL_HSN } from '../../utils/gst';

const COMMON_SIZES = {
  Shirts: ['38 (S)', '40 (M)', '42 (L)', '44 (XL)', '46 (XXL)'],
  Jeans: ['28 Waist', '30 Waist', '32 Waist', '34 Waist', '36 Waist', '38 Waist', '40 Waist'],
  Kurtis: ['XS (34)', 'S (36)', 'M (38)', 'L (40)', 'XL (42)', 'XXL (44)'],
  General: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'],
  Kids: ['1-2Y', '3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y'],
};

export function ProductFormModal({ product, onClose, onSave }) {
  const isEditing = Boolean(product?.id);

  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [category, setCategory] = useState(product?.category || 'Casual Shirts');
  const [gender, setGender] = useState(product?.gender || 'Men');
  const [material, setMaterial] = useState(product?.material || '100% Cotton');
  const [hsn, setHsn] = useState(product?.hsn || '6205');
  const [taxRate, setTaxRate] = useState(product?.taxRate || 5);
  const [description, setDescription] = useState(product?.description || '');

  // Variants matrix
  const [variants, setVariants] = useState(
    product?.variants || [
      {
        id: 'v-' + Date.now() + '-1',
        sku: 'SKU-' + Date.now().toString().slice(-4) + '-M',
        barcode: generateBarcodeNumber(),
        size: '40 (M)',
        color: 'Navy Blue',
        costPrice: 500,
        mrp: 1299,
        sellingPrice: 899,
        stock: 10,
        minStock: 2,
      }
    ]
  );

  // Add individual variant
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: 'v-' + Date.now() + '-' + (variants.length + 1),
        sku: 'SKU-' + Date.now().toString().slice(-4),
        barcode: generateBarcodeNumber(),
        size: '42 (L)',
        color: 'Navy Blue',
        costPrice: 500,
        mrp: 1299,
        sellingPrice: 899,
        stock: 10,
        minStock: 2,
      }
    ]);
  };

  // Quick generate sizes helper
  const handleQuickAddSizes = (sizeList) => {
    const baseColor = variants[0]?.color || 'Navy Blue';
    const baseCost = variants[0]?.costPrice || 500;
    const baseMrp = variants[0]?.mrp || 1299;
    const baseSell = variants[0]?.sellingPrice || 899;

    const newVariants = sizeList.map((sz, idx) => ({
      id: 'v-' + Date.now() + '-' + idx,
      sku: `${brand?.slice(0, 3) || 'GAR'}-${sz.replace(/[^a-zA-Z0-9]/g, '')}`,
      barcode: generateBarcodeNumber(),
      size: sz,
      color: baseColor,
      costPrice: baseCost,
      mrp: baseMrp,
      sellingPrice: baseSell,
      stock: 10,
      minStock: 2,
    }));

    setVariants(newVariants);
  };

  const handleUpdateVariant = (id, field, value) => {
    setVariants(variants.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const handleRemoveVariant = (id) => {
    if (variants.length <= 1) {
      alert('A product must have at least one size variant.');
      return;
    }
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      gender,
      material: material.trim(),
      hsn: hsn.trim(),
      taxRate: Number(taxRate) || 5,
      description: description.trim(),
      variants,
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      await db.products.update(product.id, payload);
      onSave({ ...payload, id: product.id });
    } else {
      payload.createdAt = new Date().toISOString();
      const id = await db.products.add(payload);
      onSave({ ...payload, id });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-black text-white">
              {isEditing ? 'Edit Garment Product' : 'Add New Garment / Clothing Item'}
            </h2>
            <p className="text-xs text-slate-400">Configure garment details, sizes, colors, MRP & barcodes</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Base Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Garment / Item Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Slim Fit Cotton Formal Shirt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Brand / Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Allen Solly"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Casual Shirts">Casual Shirts</option>
                <option value="Formal Shirts">Formal Shirts</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Jeans">Jeans</option>
                <option value="Formal Trousers">Formal Trousers</option>
                <option value="Kurtis & Ethnic">Kurtis & Ethnic</option>
                <option value="Sarees">Sarees</option>
                <option value="Suits & Blazers">Suits & Blazers</option>
                <option value="Kids Wear">Kids Wear</option>
                <option value="Innerwear">Innerwear</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Gender / Department</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Fabric / Material</label>
              <input
                type="text"
                placeholder="e.g. 100% Cotton, Denim"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">HSN Code (Indian GST)</label>
              <select
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
              >
                {COMMON_APPAREL_HSN.map(h => (
                  <option key={h.hsn} value={h.hsn}>{h.hsn} - {h.description}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">GST Slab (%)</label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value={5}>5% GST (Standard MRP &le; ₹1000)</option>
                <option value={12}>12% GST (Standard MRP &gt; ₹1000)</option>
                <option value={18}>18% GST</option>
                <option value={0}>0% (Tax Exempt)</option>
              </select>
            </div>
          </div>

          {/* Quick Size Preset Generator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Quick Generate Size Matrix:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickAddSizes(COMMON_SIZES.Shirts)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Shirt Sizes (38 to 46)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSizes(COMMON_SIZES.Jeans)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Jeans Waists (28 to 40)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSizes(COMMON_SIZES.General.slice(1, 6))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Standard (S, M, L, XL, XXL)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSizes(COMMON_SIZES.Kids)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold transition"
              >
                Kids Age Sizes
              </button>
            </div>
          </div>

          {/* Size / Color / Barcode Matrix Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Barcode className="w-4 h-4 text-indigo-400" />
                Size, Color & Barcode Matrix ({variants.length} Variants)
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Size / Color
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Color</th>
                    <th className="p-2.5">Barcode (Code-128)</th>
                    <th className="p-2.5">Cost (₹)</th>
                    <th className="p-2.5">MRP (₹)</th>
                    <th className="p-2.5">Selling (₹)</th>
                    <th className="p-2.5">Stock</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  {variants.map(v => (
                    <tr key={v.id} className="hover:bg-slate-900/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => handleUpdateVariant(v.id, 'size', e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold text-amber-400 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => handleUpdateVariant(v.id, 'color', e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={v.barcode}
                            onChange={(e) => handleUpdateVariant(v.id, 'barcode', e.target.value)}
                            className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateVariant(v.id, 'barcode', generateBarcodeNumber())}
                            title="Generate new barcode"
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.costPrice}
                          onChange={(e) => handleUpdateVariant(v.id, 'costPrice', Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.mrp}
                          onChange={(e) => handleUpdateVariant(v.id, 'mrp', Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.sellingPrice}
                          onChange={(e) => handleUpdateVariant(v.id, 'sellingPrice', Number(e.target.value))}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-bold focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleUpdateVariant(v.id, 'stock', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold focus:outline-none text-center"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              <Check className="w-4 h-4" />
              Save Garment Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
