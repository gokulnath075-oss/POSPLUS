// Utility formatters for Indian Clothing Store POS

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Generate human-friendly random EAN/Code-128 barcode number if not provided
export function generateBarcodeNumber() {
  const prefix = '890'; // Indian country barcode prefix
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}${timestamp}${random}`.slice(0, 13);
}

// Indian Rupee in Words converter for A4 Tax Invoices
export function numberToWordsIndian(amount) {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return twoDigits[n - 10];
    return tensMultiple[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + singleDigits[n % 10] : '');
  }

  function convertThreeDigits(n) {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
    }
    const remainder = n % 100;
    if (remainder > 0) {
      str += convertTwoDigits(remainder);
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;

  if (crore > 0) words += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds) + ' ';

  return words.trim() + ' Rupees Only';
}
