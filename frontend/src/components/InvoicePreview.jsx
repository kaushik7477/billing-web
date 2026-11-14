import React from 'react';
import { formatINR } from '../utils/numberToWords';
import { maskIdNumber } from '../utils/idMasking';

export default function InvoicePreview({ hotel, billData, calculations, billSettings = {} }) {
  if (!hotel) return null;

  const {
    showManagerSign: _showManagerSign = true,
    showGST: _showGST = true,
    showTerms = true,
    showRemarks = true,
    isNonGST: _isNonGST = false,
  } = billSettings;

  const isNonGST = Boolean(_isNonGST);
  const showGST = !isNonGST && (_showGST !== false);

  const {
    invoiceNo = 'HR/26/00001',
    billDate = '10-Nov-2026',
    customerName = 'Rahul Banerjee',
    countryCode = '+91',
    customerPhone = '9830124567',
    idType = 'Aadhaar Card',
    idNumber = '',
    roomType = 'Deluxe Room',
    roomNumber = '302',
    numPersons = 2,
    checkInDateTime = '',
    checkOutDateTime = '',
    checkInDate = '',
    checkOutDate = '',
    numDays = 1,
    paymentMode = 'Cash',
    remarks = '',
    showManagerSign = _showManagerSign
  } = billData;

  const {
    roomRentPerDay = 2200,
    baseAccommodation = 2200,
    extraCharges = 0,
    subtotal = 2200,
    cgst = 55,
    sgst = 55,
    totalGst = 110,
    netTotal = 2310,
    advancePaid = 0,
    balanceDue = 2310,
    amountInWords = 'Two Thousand Three Hundred Ten Rupees Only',
    roomsList = []
  } = calculations || {};

  // Format date for receipt (e.g., "14-Nov-2026") - Only print date, no time per requirement
  const formatReceiptDate = (dtStr) => {
    if (!dtStr) return 'Not Specified';
    // If date string (YYYY-MM-DD or ISO string)
    if (/^\d{4}-\d{2}-\d{2}/.test(dtStr)) {
      const parts = dtStr.slice(0, 10).split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]}-${months[mIdx]}-${parts[0]}`;
    }
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  // Determine total daily rent for duration label
  const dailyRentDisplay = (roomsList && roomsList.length > 0)
    ? roomsList.reduce((sum, r) => sum + (parseFloat(r.rentPerDay) || 0), 0)
    : roomRentPerDay;

  return (
    <div
      id="invoice-card"
      className="bg-white w-full max-w-[780px] p-6 sm:p-8 rounded-lg shadow-md border-2 border-brand-800 text-slate-900 relative print-exact"
    >
      {/* Subtle Authentic Watermark */}
      <div className="invoice-watermark no-print">{isNonGST ? 'HOTEL BILL' : hotel.name.toUpperCase()}</div>

      {/* 1. Header Section: Hotel Branding & Identification */}
      <header className="invoice-header text-center pb-3 border-b-2 border-brand-800 relative">
        {!isNonGST && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] font-semibold text-brand-900 mb-1 border-b border-brand-200 pb-1">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <i className="fa-solid fa-file-invoice text-brand-700"></i>
              <span>GSTIN: <strong className="font-mono tracking-wider">{hotel.gstin}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 justify-center sm:justify-end">
              <i className="fa-solid fa-phone text-brand-700"></i>
              <span>Mobile: <strong className="tracking-wide">{hotel.phone}</strong></span>
            </div>
          </div>
        )}

        <div className="py-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-brand-800 font-serif uppercase leading-tight">
            {isNonGST ? 'HOTEL BILL' : hotel.name}
          </h1>
          {!isNonGST && hotel.subText && (
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-brand-700 italic mt-0.5">
              {hotel.subText}
            </p>
          )}
          {!isNonGST && hotel.address && (
            <p className="text-[11px] sm:text-xs text-slate-700 mt-1 font-medium max-w-xl mx-auto leading-relaxed">
              {hotel.address}
            </p>
          )}
        </div>

        {/* Tax Invoice Banner Strip (only for regular Tax Invoices) */}
        {!isNonGST && (
          <div className="mt-2.5 inline-block bg-brand-800 text-white text-[11px] sm:text-xs font-bold px-6 py-1 rounded tracking-widest uppercase shadow-sm print-exact">
            Tax Invoice / Guest Bill
          </div>
        )}
      </header>

      {/* 2. Serial Number & Date Bar */}
      <div className="flex flex-wrap items-center justify-between py-2 text-xs border-b border-brand-800 font-medium bg-brand-50 px-3 mt-1.5 print-exact">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Bill No:</span>
          <span className="font-mono font-bold text-brand-900 tracking-wider">{invoiceNo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Bill Date:</span>
          <span className="font-bold text-slate-900">{billDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Payment:</span>
          <span className="font-bold text-brand-800">{paymentMode}</span>
        </div>
      </div>

      {/* 3. Meta Information Grid (Customer & Stay Details) */}
      <div className="my-3 text-xs border border-brand-800 rounded overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-brand-800">

          {/* Left Side: Guest Info */}
          <div className="p-2.5 space-y-1.5 bg-white">
            <div className="flex">
              <span className="w-32 font-bold text-slate-700">Guest Name:</span>
              <span className="font-bold text-brand-900 uppercase">{customerName || 'Rahul Banerjee'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-slate-600">Phone / WhatsApp:</span>
              <span className="font-mono font-semibold text-slate-800">{countryCode} {customerPhone || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-slate-600">ID Proof:</span>
              <span className="text-slate-800">
                {idType}{' '}
                {idNumber ? (
                  <>
                    {/* Screen view for Receptionist / Manager / SuperAdmin */}
                    <span className="id-full-display font-medium">({idNumber})</span>
                    {/* Print & PDF Download view with first half masked (XXXX) for customer privacy */}
                    <span className="id-masked-display font-mono font-semibold">({maskIdNumber(idNumber)})</span>
                  </>
                ) : ''}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-slate-600">No. of Persons:</span>
              <span className="font-semibold text-slate-800">{numPersons} Person{numPersons > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Right Side: Room & Stay Info */}
          <div className="p-2.5 space-y-1.5 bg-white">
            <div className="flex">
              <span className="w-32 font-bold text-slate-700">Room Category:</span>
              <span className="font-bold text-brand-900">{roomType}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-bold text-slate-700">Room Number(s):</span>
              <span className="font-mono font-bold text-brand-900">{roomNumber || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-slate-600">Check-in:</span>
              <span className="font-medium text-slate-800">{formatReceiptDate(checkInDate || checkInDateTime, 'in')}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-slate-600">Check-out:</span>
              <span className="font-medium text-slate-800">{formatReceiptDate(checkOutDate || checkOutDateTime, 'out')}</span>
            </div>
            <div className="flex bg-brand-50 -mx-2.5 -mb-2.5 p-1.5 px-2.5 border-t border-brand-200">
              <span className="w-32 font-bold text-brand-900">Total Duration:</span>
              <span className="font-bold text-brand-900">
                {numDays} Day{numDays > 1 ? 's' : ''} / Night{numDays > 1 ? 's' : ''} @ ₹ {formatINR(dailyRentDisplay)}/day
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Itemized Calculation Table */}
      <div className="my-3 overflow-hidden border border-brand-800 rounded">
        <table className="w-full text-xs text-left bill-table border-collapse">
          <thead>
            <tr className="bg-brand-800 text-white font-bold text-center print-exact">
              <th className="py-2 px-2 w-12 border-brand-800">SL</th>
              <th className="py-2 px-3 text-left border-brand-800">DESCRIPTION OF CHARGES</th>
              <th className="py-2 px-2 w-24 text-right border-brand-800">RATE (₹)</th>
              <th className="py-2 px-2 w-16 text-center border-brand-800">QTY</th>
              <th className="py-2 px-3 w-28 text-right border-brand-800">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-800 text-slate-800 font-medium">
            {/* 1. Itemized Room Accommodation Charges */}
            {roomsList && roomsList.length > 0 ? (
              roomsList.map((rm, idx) => (
                <tr key={rm.roomNumber || idx}>
                  <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-slate-900">
                      Room Accommodation Charges{roomsList.length > 1 ? ` (Room ${rm.roomNumber})` : ''}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {rm.roomType} (Room {rm.roomNumber}) &bull; {numDays} Day{numDays > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono">{formatINR(rm.rentPerDay)}</td>
                  <td className="py-2 px-2 text-center font-mono">{numDays}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">{formatINR(rm.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 px-2 text-center font-mono">1</td>
                <td className="py-2 px-3">
                  <div className="font-bold text-slate-900">Room Accommodation Charges</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {roomType} (Room {roomNumber || 'N/A'}) &bull; {numDays} Day{numDays > 1 ? 's' : ''}
                  </div>
                </td>
                <td className="py-2 px-2 text-right font-mono">{formatINR(roomRentPerDay)}</td>
                <td className="py-2 px-2 text-center font-mono">{numDays}</td>
                <td className="py-2 px-3 text-right font-mono font-bold">{formatINR(baseAccommodation)}</td>
              </tr>
            )}

            {/* 2. Extra Guest / Other Charges (if > 0) */}
            {extraCharges > 0 && (
              <tr>
                <td className="py-2 px-2 text-center font-mono">
                  {(roomsList?.length || 1) + 1}
                </td>
                <td className="py-2 px-3">
                  <div className="font-semibold text-slate-900">Extra Guest / Miscellaneous Charges</div>
                  <div className="text-[10px] text-slate-500 font-normal">Extra mattress & guest amenities</div>
                </td>
                <td className="py-2 px-2 text-right font-mono">{formatINR(extraCharges)}</td>
                <td className="py-2 px-2 text-center font-mono">1</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatINR(extraCharges)}</td>
              </tr>
            )}

            {/* Subtotal Row */}
            <tr className="bg-slate-50 font-semibold border-t-2 border-brand-800">
              <td colSpan={4} className="py-1.5 px-3 text-right uppercase tracking-wider text-[11px] text-slate-700">
                {isNonGST ? 'Subtotal Amount:' : 'Subtotal (Taxable Amount):'}
              </td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                {formatINR(subtotal)}
              </td>
            </tr>

            {/* CGST 2.5% - hidden when GST is off */}
            {showGST && (
              <tr>
                <td colSpan={4} className="py-1 px-3 text-right text-slate-600 text-[11px]">
                  CGST (2.5%):
                </td>
                <td className="py-1 px-3 text-right font-mono font-medium text-slate-800 text-[11px]">
                  {formatINR(cgst)}
                </td>
              </tr>
            )}

            {/* SGST 2.5% - hidden when GST is off */}
            {showGST && (
              <tr>
                <td colSpan={4} className="py-1 px-3 text-right text-slate-600 text-[11px]">
                  SGST (2.5%):
                </td>
                <td className="py-1 px-3 text-right font-mono font-medium text-slate-800 text-[11px]">
                  {formatINR(sgst)}
                </td>
              </tr>
            )}

            {/* Total GST 5% - hidden when GST is off */}
            {showGST && (
              <tr className="bg-slate-50/70 text-[11px]">
                <td colSpan={4} className="py-1 px-3 text-right text-slate-500 italic">
                  Total GST (5.0%):
                </td>
                <td className="py-1 px-3 text-right font-mono text-slate-600">
                  {formatINR(totalGst)}
                </td>
              </tr>
            )}

            {/* Net Total Amount */}
            <tr className="bg-slate-100 font-bold border-t border-brand-800">
              <td colSpan={4} className="py-1.5 px-3 text-right uppercase tracking-wider text-slate-900 text-xs">
                Net Total Bill Amount:
              </td>
              <td className="py-1.5 px-3 text-right font-mono text-brand-900 font-extrabold text-xs sm:text-sm">
                {formatINR(netTotal)}
              </td>
            </tr>

            {/* Less Advance Paid */}
            <tr className="text-emerald-800">
              <td colSpan={4} className="py-1.5 px-3 text-right font-medium text-[11px]">
                Less: Advance Paid Received:
              </td>
              <td className="py-1.5 px-3 text-right font-mono font-bold text-[11px]">
                - {formatINR(advancePaid)}
              </td>
            </tr>

            {/* FINAL TOTAL RECEIPT / BALANCE PAYABLE HIGHLIGHTED ROW */}
            <tr className="bg-brand-800 text-white font-extrabold text-sm border-t-2 border-brand-800 print-exact">
              <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider">
                {balanceDue <= 0 ? (balanceDue === 0 ? 'Total Receipt / Net Amount Paid in Full:' : 'Refund Due to Guest:') : 'Total Receipt / Balance Payable:'}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-sm sm:text-base tracking-tight">
                ₹ {formatINR(balanceDue > 0 ? balanceDue : Math.abs(balanceDue))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Amount in Words Box */}
      <div className="my-2.5 p-2 bg-brand-50 border border-brand-800 rounded text-xs print-exact">
        <span className="font-bold text-brand-900">Amount in Words:</span>
        <span className="italic font-semibold text-slate-800 ml-1">
          {amountInWords}
        </span>
      </div>

      {/* 6. Remarks Line */}
      {showRemarks && remarks && (
        <div className="my-2 px-1 text-[11px] text-slate-600">
          <span className="font-bold text-slate-700">Remarks:</span>
          <span className="italic ml-1">{remarks}</span>
        </div>
      )}

      {/* 7. Terms & Conditions */}
      {showTerms && (
        <div className="my-2 border-t border-dashed border-slate-300 pt-2 text-[9.5px] text-slate-500 leading-normal">
          <div className="font-bold text-slate-700 mb-0.5 uppercase tracking-wider text-[10px]">Terms & Conditions:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <p>&bull; Standard Check-in: 10:30 AM | Check-out: 09:30 AM.</p>
            <p>&bull; Please deposit room key at reception during final check-out.</p>
            <p>&bull; Management is not responsible for personal valuables or cash.</p>
            <p>&bull; All legal disputes subject to Digha / Purba Medinipur jurisdiction.</p>
          </div>
        </div>
      )}

      {/* 8. Signatures Area (Customer Sign on Left & Manager Sign on Right) */}
      <div className="mt-6 pt-2 border-t border-brand-800 flex items-end justify-between text-xs">

        {/* Left: Customer Signature */}
        <div className="text-center w-44">
          <div className="h-14 flex items-end justify-center pb-1">
            <span className="text-slate-300 text-[10px] italic">Verified & Accepted</span>
          </div>
          <div className="border-t border-slate-700 pt-1 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Customer's Sign
          </div>
        </div>

        {/* Right: Manager / Stamp Signature Area */}
        <div className="text-center w-52 relative">
          <div className={`h-16 flex items-center justify-center relative ${!isNonGST && showManagerSign ? '' : 'invisible'}`}>
            {!isNonGST && (
              <img
                src={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'><g fill='none' stroke='%231a365d'><circle cx='50' cy='40' r='32' stroke-width='2' stroke-dasharray='4 2'/><circle cx='50' cy='40' r='27' stroke-width='1'/><text x='50' y='36' font-size='7' font-weight='bold' fill='%231a365d' text-anchor='middle' stroke='none'>${encodeURIComponent(hotel.name.toUpperCase())}</text><text x='50' y='46' font-size='6' fill='%231a365d' text-anchor='middle' stroke='none'>★ DIGHA ★</text><path d='M95 50 Q110 20 125 45 T155 35 T180 55 T215 30' stroke-width='2.5' stroke-linecap='round'/><path d='M90 60 Q150 55 220 52' stroke-width='1.8' stroke-linecap='round'/></g></svg>`}
                alt="Manager Signature & Stamp"
                className="max-h-16 object-contain pointer-events-none"
              />
            )}
          </div>
          <div className="border-t border-slate-700 pt-1 font-bold text-brand-900 uppercase tracking-wider text-[11px]">
            Manager
          </div>
          {!isNonGST && (
            <div className="text-[9.5px] text-slate-600 font-semibold tracking-tight">
              For {hotel.name} / Maa Tara Ent.
            </div>
          )}
        </div>

      </div>

      {/* Bottom Micro Details */}
      {!isNonGST && (
        <div className="mt-4 pt-1.5 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
          Generated via {hotel.name} Billing Engine &bull; GSTIN: {hotel.gstin} &bull; Computer Generated Tax Invoice
        </div>
      )}

    </div>
  );
}
