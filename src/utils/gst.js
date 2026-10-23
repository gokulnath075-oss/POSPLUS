// Indian GST Calculation Engine for Apparel & Clothing Retail

/**
 * Calculates line-item GST, Taxable Value, CGST/SGST/IGST
 * @param {Object} item 
 * @param {boolean} isInterstate 
 * @param {boolean} isTaxInclusive 
 */
export function calculateItemGST(item, isInterstate = false, isTaxInclusive = true) {
  const qty = Number(item.qty) || 1;
  const unitPrice = Number(item.unitPrice) || Number(item.sellingPrice) || Number(item.mrp) || 0;
  const taxRate = Number(item.taxRate) || 0; // e.g. 5 or 12 or 18
  
  // Calculate discount for line item
  let discountAmount = 0;
  if (item.discountType === '%') {
    discountAmount = (unitPrice * qty * (Number(item.discountValue) || 0)) / 100;
  } else if (item.discountType === 'fixed') {
    discountAmount = Number(item.discountValue) || 0;
  }

  const grossTotal = Math.max(0, (unitPrice * qty) - discountAmount);
  
  let taxableAmount = 0;
  let totalTax = 0;
  let finalUnitPrice = unitPrice;

  if (isTaxInclusive) {
    // Standard Indian Retail: Price includes GST
    taxableAmount = grossTotal / (1 + (taxRate / 100));
    totalTax = grossTotal - taxableAmount;
  } else {
    // Price excludes GST (B2B / Wholesale)
    taxableAmount = grossTotal;
    totalTax = (taxableAmount * taxRate) / 100;
  }

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterstate) {
    igstRate = taxRate;
    igstAmount = totalTax;
  } else {
    cgstRate = taxRate / 2;
    sgstRate = taxRate / 2;
    cgstAmount = totalTax / 2;
    sgstAmount = totalTax / 2;
  }

  const finalAmount = isTaxInclusive ? grossTotal : (taxableAmount + totalTax);

  return {
    ...item,
    qty,
    unitPrice,
    discountAmount,
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxRate,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    igstAmount: Number(igstAmount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: Number(finalAmount.toFixed(2)),
  };
}

/**
 * Calculates entire cart totals, overall discount, roundoff, and GST summary
 */
export function calculateCartTotals(items = [], overallDiscount = 0, discountType = 'fixed', isInterstate = false, isTaxInclusive = true) {
  let subtotal = 0;
  let taxableSubtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalTax = 0;
  let lineItemsTotal = 0;

  const processedItems = items.map(item => {
    const calc = calculateItemGST(item, isInterstate, isTaxInclusive);
    subtotal += calc.unitPrice * calc.qty;
    taxableSubtotal += calc.taxableAmount;
    totalCGST += calc.cgstAmount;
    totalSGST += calc.sgstAmount;
    totalIGST += calc.igstAmount;
    totalTax += calc.totalTax;
    lineItemsTotal += calc.totalAmount;
    return calc;
  });

  // Apply overall bill discount if any
  let billDiscount = 0;
  if (discountType === '%') {
    billDiscount = (lineItemsTotal * Number(overallDiscount || 0)) / 100;
  } else {
    billDiscount = Number(overallDiscount || 0);
  }

  const preRoundTotal = Math.max(0, lineItemsTotal - billDiscount);
  const netPayable = Math.round(preRoundTotal);
  const roundOff = Number((netPayable - preRoundTotal).toFixed(2));

  // Group by HSN for GST Tax Invoice reporting
  const hsnSummary = {};
  processedItems.forEach(item => {
    const hsn = item.hsn || '6205';
    if (!hsnSummary[hsn]) {
      hsnSummary[hsn] = {
        hsn,
        taxRate: item.taxRate,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
      };
    }
    hsnSummary[hsn].taxableValue += item.taxableAmount;
    hsnSummary[hsn].cgst += item.cgstAmount;
    hsnSummary[hsn].sgst += item.sgstAmount;
    hsnSummary[hsn].igst += item.igstAmount;
    hsnSummary[hsn].totalTax += item.totalTax;
  });

  return {
    items: processedItems,
    subtotal: Number(subtotal.toFixed(2)),
    taxableSubtotal: Number(taxableSubtotal.toFixed(2)),
    totalCGST: Number(totalCGST.toFixed(2)),
    totalSGST: Number(totalSGST.toFixed(2)),
    totalIGST: Number(totalIGST.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    billDiscount: Number(billDiscount.toFixed(2)),
    preRoundTotal: Number(preRoundTotal.toFixed(2)),
    roundOff,
    netPayable,
    hsnSummary: Object.values(hsnSummary),
  };
}

// Indian standard apparel HSN codes helper
export const COMMON_APPAREL_HSN = [
  { hsn: '6109', description: 'T-Shirts, singlets and other vests (knitted/crocheted)' },
  { hsn: '6205', description: 'Men\'s or boys\' shirts (woven)' },
  { hsn: '6204', description: 'Women\'s or girls\' suits, dresses, skirts, trousers' },
  { hsn: '6203', description: 'Men\'s or boys\' suits, jackets, trousers, shorts' },
  { hsn: '6206', description: 'Women\'s or girls\' blouses, shirts' },
  { hsn: '5208', description: 'Woven fabrics of cotton / Sarees' },
  { hsn: '6115', description: 'Pantyhose, tights, stockings, socks' },
  { hsn: '6211', description: 'Track suits, ski suits and swimwear' },
  { hsn: '6214', description: 'Shawls, scarves, mufflers, mantillas, veils' },
];
