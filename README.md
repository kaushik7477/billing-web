# Hotel Multi-Property Billing & Super Admin Management Suite (MERN Stack)

A full-stack **MERN** (MongoDB, Express.js, React, Node.js) multi-property hotel billing, financial analytics, and property management application.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Hotel Property Portal
The landing screen presents **3 Hotel Selection Boxes** + **1 Super Admin Control Box**:
- **Hotel Box 1:** **Hotel Rojana** (Organised by Maa Tara Enterprise &bull; New Digha &bull; Navy Theme &bull; Default PIN: `1111`)
- **Hotel Box 2:** **Hotel Sagar Priya** (A Unit of Sagar Hospitality &bull; Old Digha &bull; Emerald Theme &bull; Default PIN: `2222`)
- **Hotel Box 3:** **Hotel Sea Pearl** (Managed by Tara Holidays &bull; Foreshore Road &bull; Indigo Theme &bull; Default PIN: `3333`)
- **Box 4:** **Super Admin Portal** (Central Financial Analytics & Multi-Hotel Management &bull; `admin` / `admin123`)

---

### 2. Hotel Manager Billing Dashboard
When clicking on any hotel box:
1. Manager enters their 4-digit PIN to authenticate.
2. The hotel's specific billing workspace opens with custom branding, address, GSTIN, phone, and room categories.
3. **Dynamic Calculations:**
   - Auto-calculated stay days between Check-in and Check-out (minimum 1 day).
   - Base Accommodation = $\text{Room Rent} \times \text{Days}$.
   - Subtotal = $\text{Base Accommodation} + \text{Extra Guest Charges}$.
   - GST (5% Total): CGST (2.5%) + SGST (2.5%).
   - Net Total = $\text{Subtotal} + \text{Total GST}$.
   - Balance Due = $\text{Net Total} - \text{Advance Paid}$.
   - Indian Number-to-Words converter for receipt amount.
4. **Action Tools:**
   - 🖨️ **Print:** `@media print` rules format the receipt for standard A4 portrait paper.
   - 📥 **Download PDF:** High-resolution PDF export via `html2pdf.js`.
   - 💬 **WhatsApp:** 1-click sharing to guest's WhatsApp with full invoice breakdown.
   - 💾 **Save to Database:** Saves the bill to MongoDB / persistent storage.
   - 📜 **Records Drawer:** Search, view, and reprint past invoices for that property.

---

### 3. Super Admin Financial Analytics & Multi-Hotel Control
Super Admin authenticates via the Admin Login card:
- 🔑 **PIN Management:** Set and change manager PINs for every hotel individually with real-time updates.
- 📊 **Day-by-Day Financial Details:** Detailed day-by-day revenue, advance received, balance due, GST collected, and guest count.
- 📈 **Weekly & Monthly Reports:** Grouped aggregations showing weekly and monthly performance.
- 🔍 **Filter Controls:**
  - Property Filter (Consolidated All 3 Hotels or specific Hotel)
  - Time Range Presets (Today, Yesterday, Last 7 Days, This Month, Custom Date Range)
  - Payment Mode Filter (Cash, UPI / QR, Debit / Credit Card)
  - Payment Status Filter (Paid in Full, Balance Due)
- 📁 **Export to Excel / CSV:** 1-click download of all transaction details for tax and accounting.
- 🧾 **Bill Inspection:** View any guest invoice across any property in full view.

---

## 🚀 How to Run

### Option A: Unified Full-Stack Run (Recommended)
From the root directory:
```bash
# 1. Start the backend (serves API and built frontend on port 5000)
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

### Option B: Development Mode (Vite Hot-Reload)
In two separate terminals:
```bash
# Terminal 1: Backend API (port 5000)
cd backend
npm run dev

# Terminal 2: React Frontend with Hot Reload (port 5173)
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🗄️ Database (Zero-Config Resilient Design)
- **MongoDB:** Configured via `MONGODB_URI` in `backend/.env`.
- **Automatic Fallback:** If a local MongoDB daemon is not running, the application automatically falls back to an embedded JSON database at `backend/data/`, ensuring that it runs immediately out-of-the-box without requiring MongoDB installation.

---

## 🔐 Default Credentials

| Portal | Identifier | Password / PIN |
| :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` |
| **Hotel 1 (Hotel Rojana)** | `hotel-1` | `1111` *(changeable by Admin)* |
| **Hotel 2 (Hotel Sagar Priya)** | `hotel-2` | `2222` *(changeable by Admin)* |
| **Hotel 3 (Hotel Sea Pearl)** | `hotel-3` | `3333` *(changeable by Admin)* |

---

## 📂 Project Structure

```text
├── backend/
│   ├── data/                 # Embedded JSON fallback data store
│   ├── middleware/auth.js    # JWT verification & role authorization
│   ├── models/               # Mongoose Schemas (Hotel, Bill)
│   ├── routes/               # API Endpoints (auth, hotels, bills, analytics)
│   ├── db.js                 # Unified Mongo / JSON persistence layer
│   ├── server.js             # Express application & static server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PortalScreen.jsx        # 3 Hotel boxes + 1 Admin box
│   │   │   ├── PinModal.jsx            # 4-digit PIN verification modal
│   │   │   ├── AdminLoginModal.jsx     # Super Admin credential modal
│   │   │   ├── BillingEngine.jsx       # Manager billing workspace
│   │   │   ├── InvoicePreview.jsx      # Print-ready physical receipt replica
│   │   │   ├── SuperAdminDashboard.jsx # Financial analytics & PIN control
│   │   │   └── BillHistoryDrawer.jsx   # Past bills drawer
│   │   ├── utils/numberToWords.js      # Indian currency word converter
│   │   ├── App.jsx                     # Root router & global state
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── standalone.html           # Original single-file standalone billing page
├── manager-sign.png          # Official stamp and signature asset
├── package.json              # Root project scripts
└── README.md
```
