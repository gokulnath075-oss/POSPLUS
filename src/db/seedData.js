// Initial Seed Data for Indian Clothing / Garment Shop

export const INITIAL_PRODUCTS = [
  {
    name: "Men's Slim Fit Cotton Casual Shirt",
    brand: "Allen Solly",
    category: "Casual Shirts",
    gender: "Men",
    material: "100% Cotton",
    hsn: "6205",
    taxRate: 5,
    description: "Premium breathable pure cotton casual shirt with spread collar",
    variants: [
      { id: 'v1-1', sku: 'AS-SHT-38-NVY', barcode: '890100100011', size: '38 (S)', color: 'Navy Blue', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 12, minStock: 3 },
      { id: 'v1-2', sku: 'AS-SHT-40-NVY', barcode: '890100100012', size: '40 (M)', color: 'Navy Blue', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 18, minStock: 4 },
      { id: 'v1-3', sku: 'AS-SHT-42-NVY', barcode: '890100100013', size: '42 (L)', color: 'Navy Blue', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 15, minStock: 4 },
      { id: 'v1-4', sku: 'AS-SHT-44-NVY', barcode: '890100100014', size: '44 (XL)', color: 'Navy Blue', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 8, minStock: 2 },
      { id: 'v1-5', sku: 'AS-SHT-40-WHT', barcode: '890100100015', size: '40 (M)', color: 'Classic White', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 20, minStock: 5 },
      { id: 'v1-6', sku: 'AS-SHT-42-WHT', barcode: '890100100016', size: '42 (L)', color: 'Classic White', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 14, minStock: 3 },
      { id: 'v1-7', sku: 'AS-SHT-40-OLV', barcode: '890100100017', size: '40 (M)', color: 'Olive Green', costPrice: 550, mrp: 1499, sellingPrice: 999, stock: 6, minStock: 2 },
    ]
  },
  {
    name: "Classic Polo Pique T-Shirt",
    brand: "US Polo Assn",
    category: "T-Shirts",
    gender: "Men",
    material: "Cotton Pique",
    hsn: "6109",
    taxRate: 5,
    description: "Solid color polo collar t-shirt with ribbed cuffs and hem",
    variants: [
      { id: 'v2-1', sku: 'USP-POL-M-BLK', barcode: '890100200021', size: 'M (38-40)', color: 'Jet Black', costPrice: 420, mrp: 1199, sellingPrice: 799, stock: 14, minStock: 3 },
      { id: 'v2-2', sku: 'USP-POL-L-BLK', barcode: '890100200022', size: 'L (42)', color: 'Jet Black', costPrice: 420, mrp: 1199, sellingPrice: 799, stock: 16, minStock: 4 },
      { id: 'v2-3', sku: 'USP-POL-XL-BLK', barcode: '890100200023', size: 'XL (44)', color: 'Jet Black', costPrice: 420, mrp: 1199, sellingPrice: 799, stock: 10, minStock: 2 },
      { id: 'v2-4', sku: 'USP-POL-M-MAR', barcode: '890100200024', size: 'M (38-40)', color: 'Maroon', costPrice: 420, mrp: 1199, sellingPrice: 799, stock: 11, minStock: 3 },
      { id: 'v2-5', sku: 'USP-POL-L-MAR', barcode: '890100200025', size: 'L (42)', color: 'Maroon', costPrice: 420, mrp: 1199, sellingPrice: 799, stock: 9, minStock: 2 },
      { id: 'v2-6', sku: 'USP-POL-L-ROY', barcode: '890100200026', size: 'L (42)', color: 'Royal Blue', costPrice: 420, mrp: 1199, sellingPrice: 799, stock: 8, minStock: 2 },
    ]
  },
  {
    name: "511 Slim Fit Stretch Denim Jeans",
    brand: "Levi's",
    category: "Jeans",
    gender: "Men",
    material: "98% Cotton 2% Elastane",
    hsn: "6203",
    taxRate: 12,
    description: "Iconic slim fit denim jeans with comfortable stretch",
    variants: [
      { id: 'v3-1', sku: 'LEV-JNS-30-IND', barcode: '890100300031', size: '30 Waist', color: 'Indigo Dark Wash', costPrice: 1100, mrp: 2999, sellingPrice: 2199, stock: 8, minStock: 2 },
      { id: 'v3-2', sku: 'LEV-JNS-32-IND', barcode: '890100300032', size: '32 Waist', color: 'Indigo Dark Wash', costPrice: 1100, mrp: 2999, sellingPrice: 2199, stock: 15, minStock: 3 },
      { id: 'v3-3', sku: 'LEV-JNS-34-IND', barcode: '890100300033', size: '34 Waist', color: 'Indigo Dark Wash', costPrice: 1100, mrp: 2999, sellingPrice: 2199, stock: 12, minStock: 3 },
      { id: 'v3-4', sku: 'LEV-JNS-36-IND', barcode: '890100300034', size: '36 Waist', color: 'Indigo Dark Wash', costPrice: 1100, mrp: 2999, sellingPrice: 2199, stock: 7, minStock: 2 },
      { id: 'v3-5', sku: 'LEV-JNS-32-BLK', barcode: '890100300035', size: '32 Waist', color: 'Faded Black', costPrice: 1100, mrp: 2999, sellingPrice: 2199, stock: 9, minStock: 2 },
      { id: 'v3-6', sku: 'LEV-JNS-34-BLK', barcode: '890100300036', size: '34 Waist', color: 'Faded Black', costPrice: 1100, mrp: 2999, sellingPrice: 2199, stock: 10, minStock: 2 },
    ]
  },
  {
    name: "Floral Hand-Block Print Cotton Kurti",
    brand: "Biba",
    category: "Kurtis & Ethnic",
    gender: "Women",
    material: "100% Cambric Cotton",
    hsn: "6204",
    taxRate: 12,
    description: "Elegant straight A-line daily wear printed kurti with 3/4 sleeves",
    variants: [
      { id: 'v4-1', sku: 'BIB-KRT-S-MST', barcode: '890100400041', size: 'S (36)', color: 'Mustard Yellow', costPrice: 600, mrp: 1899, sellingPrice: 1299, stock: 6, minStock: 2 },
      { id: 'v4-2', sku: 'BIB-KRT-M-MST', barcode: '890100400042', size: 'M (38)', color: 'Mustard Yellow', costPrice: 600, mrp: 1899, sellingPrice: 1299, stock: 10, minStock: 2 },
      { id: 'v4-3', sku: 'BIB-KRT-L-MST', barcode: '890100400043', size: 'L (40)', color: 'Mustard Yellow', costPrice: 600, mrp: 1899, sellingPrice: 1299, stock: 14, minStock: 3 },
      { id: 'v4-4', sku: 'BIB-KRT-XL-MST', barcode: '890100400044', size: 'XL (42)', color: 'Mustard Yellow', costPrice: 600, mrp: 1899, sellingPrice: 1299, stock: 8, minStock: 2 },
      { id: 'v4-5', sku: 'BIB-KRT-L-TEA', barcode: '890100400045', size: 'L (40)', color: 'Teal Blue', costPrice: 600, mrp: 1899, sellingPrice: 1299, stock: 9, minStock: 2 },
      { id: 'v4-6', sku: 'BIB-KRT-XL-TEA', barcode: '890100400046', size: 'XL (42)', color: 'Teal Blue', costPrice: 600, mrp: 1899, sellingPrice: 1299, stock: 7, minStock: 2 },
    ]
  },
  {
    name: "Embroidered Rayon Anarkali Kurta Set with Dupatta",
    brand: "W for Woman",
    category: "Kurtis & Ethnic",
    gender: "Women",
    material: "Viscose Rayon",
    hsn: "6204",
    taxRate: 12,
    description: "3-piece festive ethnic set with gold zari embroidery and chanderi dupatta",
    variants: [
      { id: 'v5-1', sku: 'W-SET-M-WIN', barcode: '890100500051', size: 'M (38)', color: 'Wine Red', costPrice: 1400, mrp: 3999, sellingPrice: 2899, stock: 5, minStock: 2 },
      { id: 'v5-2', sku: 'W-SET-L-WIN', barcode: '890100500052', size: 'L (40)', color: 'Wine Red', costPrice: 1400, mrp: 3999, sellingPrice: 2899, stock: 7, minStock: 2 },
      { id: 'v5-3', sku: 'W-SET-XL-WIN', barcode: '890100500053', size: 'XL (42)', color: 'Wine Red', costPrice: 1400, mrp: 3999, sellingPrice: 2899, stock: 6, minStock: 2 },
      { id: 'v5-4', sku: 'W-SET-L-EMR', barcode: '890100500054', size: 'L (40)', color: 'Emerald Green', costPrice: 1400, mrp: 3999, sellingPrice: 2899, stock: 4, minStock: 2 },
    ]
  },
  {
    name: "Pure Kanchipuram Soft Silk Saree with Blouse Piece",
    brand: "Heritage Silk",
    category: "Sarees",
    gender: "Women",
    material: "Soft Art Silk",
    hsn: "5208",
    taxRate: 12,
    description: "Traditional wedding saree with rich pallu and contrast jacquard border",
    variants: [
      { id: 'v6-1', sku: 'HS-SAR-FS-RED', barcode: '890100600061', size: 'Free Size (6.3m)', color: 'Crimson Red & Gold', costPrice: 1600, mrp: 4500, sellingPrice: 3199, stock: 6, minStock: 2 },
      { id: 'v6-2', sku: 'HS-SAR-FS-BLU', barcode: '890100600062', size: 'Free Size (6.3m)', color: 'Peacock Blue & Pink', costPrice: 1600, mrp: 4500, sellingPrice: 3199, stock: 5, minStock: 2 },
    ]
  },
  {
    name: "Flat-Front Formal Chino Trousers",
    brand: "Raymond",
    category: "Formal Trousers",
    gender: "Men",
    material: "Poly-Viscose Cotton Blend",
    hsn: "6203",
    taxRate: 12,
    description: "Wrinkle-resistant formal trousers tailored for business and office wear",
    variants: [
      { id: 'v7-1', sku: 'RAY-TRS-32-KHK', barcode: '890100700071', size: '32 Waist', color: 'Khaki Beige', costPrice: 750, mrp: 1999, sellingPrice: 1499, stock: 8, minStock: 2 },
      { id: 'v7-2', sku: 'RAY-TRS-34-KHK', barcode: '890100700072', size: '34 Waist', color: 'Khaki Beige', costPrice: 750, mrp: 1999, sellingPrice: 1499, stock: 11, minStock: 2 },
      { id: 'v7-3', sku: 'RAY-TRS-32-CHR', barcode: '890100700073', size: '32 Waist', color: 'Charcoal Grey', costPrice: 750, mrp: 1999, sellingPrice: 1499, stock: 12, minStock: 3 },
      { id: 'v7-4', sku: 'RAY-TRS-34-CHR', barcode: '890100700074', size: '34 Waist', color: 'Charcoal Grey', costPrice: 750, mrp: 1999, sellingPrice: 1499, stock: 14, minStock: 3 },
      { id: 'v7-5', sku: 'RAY-TRS-36-CHR', barcode: '890100700075', size: '36 Waist', color: 'Charcoal Grey', costPrice: 750, mrp: 1999, sellingPrice: 1499, stock: 6, minStock: 2 },
    ]
  },
  {
    name: "Kids Dinosaur Bio-Wash Graphic T-Shirt",
    brand: "Hopscotch",
    category: "Kids Wear",
    gender: "Boys",
    material: "100% Combed Cotton",
    hsn: "6109",
    taxRate: 5,
    description: "Super soft bio-washed comfortable cotton graphic t-shirt for kids",
    variants: [
      { id: 'v8-1', sku: 'HOP-KID-4Y-YEL', barcode: '890100800081', size: '3-4 Years', color: 'Bright Yellow', costPrice: 200, mrp: 699, sellingPrice: 449, stock: 8, minStock: 2 },
      { id: 'v8-2', sku: 'HOP-KID-6Y-YEL', barcode: '890100800082', size: '5-6 Years', color: 'Bright Yellow', costPrice: 200, mrp: 699, sellingPrice: 449, stock: 10, minStock: 2 },
      { id: 'v8-3', sku: 'HOP-KID-8Y-YEL', barcode: '890100800083', size: '7-8 Years', color: 'Bright Yellow', costPrice: 200, mrp: 699, sellingPrice: 449, stock: 7, minStock: 2 },
      { id: 'v8-4', sku: 'HOP-KID-6Y-BLU', barcode: '890100800084', size: '5-6 Years', color: 'Sky Blue', costPrice: 200, mrp: 699, sellingPrice: 449, stock: 9, minStock: 2 },
    ]
  },
  {
    name: "Pure Cotton Ribbed Round-Neck Undershirt (Pack of 3)",
    brand: "Jockey",
    category: "Innerwear",
    gender: "Men",
    material: "100% Combed Cotton Rib",
    hsn: "6109",
    taxRate: 5,
    description: "StayFresh anti-microbial treatment pack of 3 sleeveless vests",
    variants: [
      { id: 'v9-1', sku: 'JOC-VST-85-WHT', barcode: '890100900091', size: '85cm (S)', color: 'White', costPrice: 260, mrp: 549, sellingPrice: 479, stock: 15, minStock: 4 },
      { id: 'v9-2', sku: 'JOC-VST-90-WHT', barcode: '890100900092', size: '90cm (M)', color: 'White', costPrice: 260, mrp: 549, sellingPrice: 479, stock: 24, minStock: 5 },
      { id: 'v9-3', sku: 'JOC-VST-95-WHT', barcode: '890100900093', size: '95cm (L)', color: 'White', costPrice: 260, mrp: 549, sellingPrice: 479, stock: 18, minStock: 5 },
    ]
  }
];

export const INITIAL_CUSTOMERS = [
  {
    name: "Rajesh Sharma",
    phone: "9876543210",
    email: "rajesh.sharma@example.com",
    address: "B-42, MG Road, Commercial Complex",
    loyaltyPoints: 180,
    creditBalance: 0,
    totalSpent: 4200,
    visitCount: 4,
    notes: "Prefers Allen Solly formal shirts size 42",
    createdAt: new Date().toISOString()
  },
  {
    name: "Priya Sundaram",
    phone: "9845123456",
    email: "priya.s@example.com",
    address: "Flat 301, Lakeview Enclave",
    loyaltyPoints: 340,
    creditBalance: 0,
    totalSpent: 7850,
    visitCount: 6,
    notes: "Likes ethnic wear and silk sarees",
    createdAt: new Date().toISOString()
  },
  {
    name: "Karthik Verma",
    phone: "9988776655",
    email: "karthik.v@example.com",
    address: "Shop No. 5, Gandhi Bazaar",
    loyaltyPoints: 50,
    creditBalance: 500, // Rs 500 Khata balance
    totalSpent: 3100,
    visitCount: 2,
    notes: "Regular customer - has ₹500 store credit pending",
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_SETTINGS = {
  storeName: "POS PLUS APPARELS",
  tagline: "Fashion & Lifestyle Store",
  address: "Shop #12, Ground Floor, Fashion Street Market",
  city: "Bangalore",
  state: "Karnataka",
  stateCode: "29",
  pincode: "560001",
  phone: "+91 98765 00000",
  email: "billing@posplusapparels.com",
  gstin: "29ABCDE1234F1Z5",
  upiId: "posplus@okhdfcbank",
  upiPayeeName: "POS PLUS APPARELS",
  invoicePrefix: "POSP-26-",
  thermalSize: "80mm", // '80mm' | '58mm' | 'A4'
  defaultTerms: "Thank you for shopping with us! Please visit again.",
  exchangePolicy: "Exchange valid within 7 days with original barcode tag and bill. No cash refund.",
  enableLoyalty: true,
  pointsPer100: 1, // 1 point for every ₹100 spent
  pointValueInRupees: 1, // 1 point = ₹1
  counterName: "Counter 1", // 'Counter 1' | 'Counter 2' | 'Owner Mobile' | 'Branch 1'
  enableCloudSync: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export const INITIAL_USERS = [
  {
    name: "Store Admin / Owner",
    username: "admin",
    pin: "1234",
    role: "admin",
    counterName: "Admin Station",
    createdAt: new Date().toISOString(),
  },
  {
    name: "Cashier Rahul",
    username: "counter1",
    pin: "1111",
    role: "cashier",
    counterName: "Counter 1",
    createdAt: new Date().toISOString(),
  },
  {
    name: "Cashier Priya",
    username: "counter2",
    pin: "2222",
    role: "cashier",
    counterName: "Counter 2",
    createdAt: new Date().toISOString(),
  },
];

