# 🛍️ POS PLUS — Clothing & Apparel Billing System

A complete, offline-first, professional Point of Sale (POS) and inventory management software custom-built for **Clothing, Garment, and Fashion Retail Stores in India**.

---

## 🌟 Key Features

### 1. ⚡ Fast POS Billing Counter
- **Barcode Scanner Compatible:** Instant audio feedback beep (`playScanSound`) on barcode scan.
- **Garment Matrix & Size Picker:** Quick selection of Sizes (S, M, L, XL, XXL, 28 to 44 waist) and Colors with real-time stock counters.
- **Hold & Recall Bills:** Put customer bills on hold when someone tries on another garment; resume anytime with 1 click.
- **Discounts:** Line-item discount (₹ or %) and overall bill discount with automatic round-off.

### 2. 🏷️ Garment Barcode & Price Tag Generator & Printing
- **Thermal Label Printers:** Standard 50mm x 25mm (2" x 1") single or 2-up rolls (TVS, TSC, Zebra, Xprinter).
- **Hang-Tag Stickers:** 50mm x 35mm garment hang-tag stickers.
- **A4 Sticker Sheets:** 24 labels (3x8) or 40 labels (4x10) for laser/inkjet printers.
- **Information on each Tag:** Store Name, Brand, Garment Name, Highlighted Size badge, Color, MRP (strike-through), Offer Price, and high-precision Code-128 barcode.

### 3. 📱 Dynamic UPI QR Code Payments
- Generates real-time NPCI-compliant UPI QR codes displaying the **exact net bill amount**.
- Customers can scan directly from the screen or from the printed bill using **Google Pay, PhonePe, Paytm, BHIM, Cred**, or any banking app.
- Pre-configured UPI ID with custom store business name.

### 4. 🇮🇳 Indian GST Tax Engine
- Compliant with Indian Textile GST rules (CGST, SGST, and IGST for interstate).
- Pre-loaded with common apparel HSN codes (HSN 6109 for T-shirts, 6205 for Shirts, 6203 for Trousers, 6204 for Kurtis/Dresses, 5208 for Sarees).
- Automatic tax breakdown table and Indian Rupee in Words converter on A4 invoices.

### 5. 🖨️ Receipt & Invoice Formats
- **80mm (3-Inch) Thermal Receipt:** Complete with Shop GSTIN, Barcode, UPI QR code, items with size/color, and exchange policy.
- **58mm (2-Inch) Thermal Receipt:** Compact layout for mini thermal printers.
- **A4 / A5 Tax Invoice:** Full GST Tax Invoice under Rule 46 of CGST Rules with buyer details, HSN table, and signatory stamp.
- **WhatsApp Bill Sharing:** Send formatted invoice summaries directly to the customer's WhatsApp with one click!

### 6. 👥 Customers, Loyalty Points & Khata (Store Credit) Ledger
- Customer directory with mobile number lookup.
- Automatic loyalty points earning & one-click redemption during billing.
- Store Credit / Khata tracker: Record credit sales and accept partial/full payments.

### 7. 🔄 Returns, Exchanges & Store Credit Notes
- Search original sales invoice by bill number or barcode scan.
- Select specific garment items returned with reason (e.g. Size Issue, Defect).
- Issue **Store Credit Notes** or cash/UPI refunds and automatically restock garments.

### 8. 📊 Day-End Closing (Z-Report) & GST Reports
- Daily Cash Drawer closing reconciliation (Opening Cash + Cash Sales - Petty Expenses = Closing Cash).
- Payment mode split (Cash, UPI, Card, Khata).
- GSTR-1 ready HSN summary report for your CA / tax filing.
- 1-Click invoice search and reprint.

### 9. 🔒 100% Offline & Safe
- No internet connection required to bill customers at your counter.
- One-click full database backup to JSON file for safety.

---

## 🚀 How to Run

### Method 1: Double-Click Launcher (Windows)
Double-click **`Start-POS-PLUS.bat`** in this folder. It will start the system and automatically launch the software in clean desktop application mode.

### Method 2: Command Line
```powershell
npm run dev
```
Open your browser at: **`http://localhost:3000`**

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Key | Action |
|---|---|
| **F1** | Switch to POS Billing Counter |
| **F2** | Focus Barcode Scanner / Barcode Tag Generator |
| **F3** | Garments & Stock Catalog |
| **F4** | Customers & Khata Ledger / Hold Current Bill |
| **F5** | Returns & Exchanges |
| **F6** | Sales Reports & GST Analytics |
| **F8** | Open Payment & Checkout Modal |
| **Enter** | Fast add / Confirm print |
| **Esc** | Close modal |

---

## 🏢 Pre-loaded Demo Inventory
The system comes pre-loaded with sample Indian apparel stock (Men's Cotton Shirts, Levi's Denim Jeans, US Polo T-shirts, Biba Kurtis, Raymond Trousers, Heritage Silk Sarees, Jockey Vests, Kids Wear) with ready-to-test barcodes (`890100100011`, `890100200021`, etc.) so you can test billing immediately!
