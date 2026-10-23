import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Printer, Tag, Sparkles, Plus, Copy, RefreshCw, Check, Layers } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { generateBarcodeNumber, formatCurrency } from '../../utils/formatters';

export function BarcodeTagGenerator({ settings }) {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  
  // Tag Form Fields
  const [storeName, setStoreName] = useState(settings?.storeName || 'POS PLUS APPARELS');
  const [productName, setProductName] = useState('Slim Fit Cotton Shirt');
  const [brand, setBrand] = useState('Allen Solly');
  const [size, setSize] = useState('42 (L)');
  const [color, setColor] = useState('Navy Blue');
  const [mrp, setMrp] = useState(1499);
  const [offerPrice, setOfferPrice] = useState(999);
  const [barcodeNumber, setBarcodeNumber] = useState('890100100013');
  const [printCopies, setPrintCopies] = useState(10);
  const [tagLayout, setTagLayout] = useState('single_50x25'); // 'single_50x25' | 'twin_50x25' | 'hangtag_50x35' | 'a4_24' | 'a4_40'

  const previewBarcodeRef = useRef(null);

  // Sync with product selection
  useEffect(() => {
    if (selectedProductId) {
      const prod = products.find(p => p.id === Number(selectedProductId));
      if (prod) {
        setProductName(prod.name);
        setBrand(prod.brand || '');
        if (prod.variants && prod.variants.length > 0) {
          const v = prod.variants.find(item => item.id === selectedVariantId) || prod.variants[0];
          setSelectedVariantId(v.id);
          setSize(v.size || '');
          setColor(v.color || '');
          setMrp(v.mrp || 999);
          setOfferPrice(v.sellingPrice || 799);
          setBarcodeNumber(v.barcode || generateBarcodeNumber());
        }
      }
    }
  }, [selectedProductId, selectedVariantId, products]);

  // When variant changes
  const handleVariantChange = (vId) => {
    setSelectedVariantId(vId);
    const prod = products.find(p => p.id === Number(selectedProductId));
    if (prod) {
      const v = prod.variants.find(item => item.id === vId);
      if (v) {
        setSize(v.size || '');
        setColor(v.color || '');
        setMrp(v.mrp || 999);
        setOfferPrice(v.sellingPrice || 799);
        setBarcodeNumber(v.barcode || generateBarcodeNumber());
      }
    }
  };

  // Generate new random barcode
  const handleGenerateNewBarcode = () => {
    setBarcodeNumber(generateBarcodeNumber());
  };

  // Render barcode in preview
  useEffect(() => {
    if (previewBarcodeRef.current && barcodeNumber) {
      try {
        JsBarcode(previewBarcodeRef.current, barcodeNumber, {
          format: 'CODE128',
          width: 1.3,
          height: 32,
          displayValue: true,
          fontSize: 10,
          margin: 0,
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [barcodeNumber]);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="w-7 h-7 text-indigo-400" />
            Garment Barcode & Price Tag Generator
          </h1>
          <p className="text-sm text-slate-400">
            Generate and bulk-print thermal barcode stickers or hang-tags for clothing items
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print {printCopies} Tag{printCopies > 1 ? 's' : ''} (Ctrl + P)
          </button>
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left Column: Form & Configuration (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            Tag Details & Layout Settings
          </h2>

          {/* Quick Select from Existing Inventory */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Select From Clothing Inventory (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Or Enter Custom Details Below --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                ))}
              </select>

              {selectedProduct && selectedProduct.variants && (
                <select
                  value={selectedVariantId}
                  onChange={(e) => handleVariantChange(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {selectedProduct.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      Size: {v.size} | Color: {v.color} (₹{v.sellingPrice})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tag Content Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Shop / Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Brand Name</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Allen Solly"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Product / Garment Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Slim Fit Cotton Shirt"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Size (Highlighted on Tag)</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 42 (L) or 32 Waist"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-bold text-amber-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Color / Shade</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Navy Blue"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">MRP (₹ - Crossed Out)</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Our Selling / Offer Price (₹)</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Barcode Number (Code-128 / EAN)</span>
                <button
                  type="button"
                  onClick={handleGenerateNewBarcode}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Generate Auto Barcode
                </button>
              </label>
              <input
                type="text"
                value={barcodeNumber}
                onChange={(e) => setBarcodeNumber(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono text-sm tracking-wider focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Print Format & Copies */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Label Printer Format</label>
              <select
                value={tagLayout}
                onChange={(e) => setTagLayout(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="single_50x25">50mm x 25mm (2" x 1" Standard Thermal Roll)</option>
                <option value="twin_50x25">50mm x 25mm (2-Up Twin Column Thermal Roll)</option>
                <option value="hangtag_50x35">50mm x 35mm (Garment Hang-Tag Sticker)</option>
                <option value="a4_24">A4 Sticker Sheet (24 labels: 3 x 8)</option>
                <option value="a4_40">A4 Sticker Sheet (40 labels: 4 x 10)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Number of Tags to Print</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={printCopies}
                  onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-1">
                  {[5, 10, 25, 50].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPrintCopies(cnt)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-bold transition ${
                        printCopies === cnt ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Tag Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Live Tag Preview
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {tagLayout.includes('50x35') ? '50mm × 35mm' : '50mm × 25mm'}
            </span>
          </div>

          <p className="text-xs text-slate-400 text-center">
            This is how each price tag will look when printed from your barcode label printer
          </p>

          {/* Render Individual Tag Card */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 w-full flex justify-center">
            <SingleBarcodeTag
              storeName={storeName}
              productName={productName}
              brand={brand}
              size={size}
              color={color}
              mrp={mrp}
              offerPrice={offerPrice}
              barcodeNumber={barcodeNumber}
              isHangTag={tagLayout === 'hangtag_50x35'}
            />
          </div>

          {/* Batch Print Info */}
          <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Labels:</span>
              <span className="font-bold text-white">{printCopies} Tags</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Retail Value:</span>
              <span className="font-bold text-emerald-400">{formatCurrency(offerPrice * printCopies)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Barcode Symbology:</span>
              <span className="font-mono text-slate-300">Code-128 (High Precision)</span>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY AREA: Array of tags formatted for printing */}
      <div className="print-only">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { margin: 0; padding: 0; background: white !important; }
            .print-only { display: block !important; }
            .tag-page {
              display: flex;
              flex-wrap: wrap;
              gap: 2mm;
              padding: 0;
            }
            .single-tag {
              page-break-inside: avoid;
              break-inside: avoid;
              margin: 1mm auto;
            }
          }
        `}} />
        <div className="tag-page">
          {Array.from({ length: printCopies }).map((_, idx) => (
            <div key={idx} className="single-tag">
              <SingleBarcodeTag
                storeName={storeName}
                productName={productName}
                brand={brand}
                size={size}
                color={color}
                mrp={mrp}
                offerPrice={offerPrice}
                barcodeNumber={barcodeNumber}
                isHangTag={tagLayout === 'hangtag_50x35'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable single clothing tag element
function SingleBarcodeTag({ storeName, productName, brand, size, color, mrp, offerPrice, barcodeNumber, isHangTag }) {
  const barcodeSvgRef = useRef(null);

  useEffect(() => {
    if (barcodeSvgRef.current && barcodeNumber) {
      try {
        JsBarcode(barcodeSvgRef.current, barcodeNumber, {
          format: 'CODE128',
          width: 1.25,
          height: isHangTag ? 28 : 22,
          displayValue: true,
          fontSize: 9,
          margin: 0,
          fontOptions: 'bold',
        });
      } catch (err) {
        console.error('Barcode tag render err:', err);
      }
    }
  }, [barcodeNumber, isHangTag]);

  return (
    <div
      className={`bg-white text-black border border-gray-400 rounded p-1.5 flex flex-col justify-between shadow-sm select-text ${
        isHangTag ? 'w-[50mm] h-[35mm]' : 'w-[50mm] h-[26mm]'
      }`}
      style={{ boxSizing: 'border-box', overflow: 'hidden' }}
    >
      {/* Top: Store Name & Brand */}
      <div className="text-center leading-none border-b border-gray-300 pb-0.5">
        <div className="font-extrabold text-[10px] tracking-tight uppercase truncate">{storeName || 'POS PLUS'}</div>
        <div className="text-[8px] font-semibold text-gray-700 truncate">{brand || 'APPAREL'}</div>
      </div>

      {/* Middle: Product & Size/Color */}
      <div className="my-0.5 leading-none">
        <div className="text-[9px] font-bold truncate">{productName}</div>
        <div className="flex justify-between items-center mt-0.5 text-[8.5px]">
          <span className="font-black bg-black text-white px-1 py-0.2 rounded text-[8.5px]">
            SIZE: {size || 'M'}
          </span>
          <span className="text-gray-700 font-medium truncate max-w-[22mm]">{color}</span>
        </div>
      </div>

      {/* Price section */}
      <div className="flex justify-between items-baseline leading-none pt-0.5">
        <div className="text-[8px] text-gray-500 line-through">
          MRP: ₹{mrp}
        </div>
        <div className="text-[10px] font-black text-black">
          OFFER: ₹{offerPrice}
        </div>
      </div>

      {/* Barcode SVG */}
      <div className="flex justify-center items-center overflow-hidden">
        <svg ref={barcodeSvgRef} className="max-w-full"></svg>
      </div>
    </div>
  );
}
