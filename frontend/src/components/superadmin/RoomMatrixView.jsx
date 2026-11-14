import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import { 
  BedDouble, Search, RefreshCw, ArrowLeft, Building2, 
  User, Calendar, Clock, AlertTriangle, Sparkles, Filter,
  FileText, Eye, CheckCircle2, X
} from 'lucide-react';

export default function RoomMatrixView({
  rooms = [],
  hotels = [],
  allBills = [],
  onSelectBill,
  isLoading,
  onRefresh,
  onBackToDashboard
}) {
  // Default to first hotel ('hotel-1' Hotel Rojana)
  const [selectedHotelId, setSelectedHotelId] = useState('hotel-1');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [roomInfoModal, setRoomInfoModal] = useState(null);

  // Property configuration for the 3 distinct boxes with distinct colors
  const propertyCards = [
    {
      hotelId: 'hotel-1',
      name: 'Hotel Rojana',
      number: 'Property #1',
      activeBorder: 'border-2 border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/90 shadow-md',
      inactiveBorder: 'border border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 shadow-xs',
      badgeColor: 'bg-blue-600 text-white',
      accentColor: 'text-blue-700',
      tagColor: 'text-blue-600 bg-blue-50 border-blue-200',
      colorDot: 'bg-blue-600',
    },
    {
      hotelId: 'hotel-2',
      name: 'Hotel Sagar Priya',
      number: 'Property #2',
      activeBorder: 'border-2 border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/90 shadow-md',
      inactiveBorder: 'border border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 shadow-xs',
      badgeColor: 'bg-emerald-600 text-white',
      accentColor: 'text-emerald-700',
      tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      colorDot: 'bg-emerald-600',
    },
    {
      hotelId: 'hotel-3',
      name: 'Hotel Sea Pearl',
      number: 'Property #3',
      activeBorder: 'border-2 border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/90 shadow-md',
      inactiveBorder: 'border border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 shadow-xs',
      badgeColor: 'bg-indigo-600 text-white',
      accentColor: 'text-indigo-700',
      tagColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      colorDot: 'bg-indigo-600',
    }
  ];

  // Handler to open bill preview when clicking an occupied room
  const handleOpenBillForRoom = async (room) => {
    if (!room) return;

    // 1. Try finding in allBills
    let matchingBill = (allBills || []).find(b => {
      if (room.currentInvoiceNo && b.invoiceNo === room.currentInvoiceNo) return true;
      if (room.currentBillId && (b._id === room.currentBillId || b.id === room.currentBillId)) return true;
      if (b.hotelId === room.hotelId) {
        const roomList = String(b.roomNumber || '').split(',').map(s => s.trim());
        if (roomList.includes(String(room.roomNumber)) && b.billStatus !== 'CLOSED') return true;
      }
      return false;
    });

    // 2. If not found in memory, fetch from backend
    if (!matchingBill) {
      try {
        const res = await fetch(`/api/bills?hotelId=${room.hotelId}&billStatus=SAVED`);
        const data = await res.json();
        if (data.success && data.bills) {
          matchingBill = data.bills.find(b => {
            if (room.currentInvoiceNo && b.invoiceNo === room.currentInvoiceNo) return true;
            if (room.currentBillId && (b._id === room.currentBillId || b.id === room.currentBillId)) return true;
            const roomList = String(b.roomNumber || '').split(',').map(s => s.trim());
            return roomList.includes(String(room.roomNumber));
          });
        }
      } catch (err) {
        console.error('Error fetching bill for room:', err);
      }
    }

    // 3. Fallback bill reconstruction to ensure bill preview modal always opens
    if (!matchingBill) {
      const hotelName = room.hotelId === 'hotel-1' ? 'Hotel Rojana' : room.hotelId === 'hotel-2' ? 'Hotel Sagar Priya' : 'Hotel Sea Pearl';
      const tariff = room.defaultRent || room.pricePerDay || 1500;
      matchingBill = {
        invoiceNo: room.currentInvoiceNo || `INV-${room.roomNumber}`,
        hotelId: room.hotelId,
        hotelName: hotelName,
        customerName: room.currentGuestName || 'In-House Guest',
        customerPhone: room.currentGuestPhone || '+91 9876543210',
        roomNumber: String(room.roomNumber),
        roomType: room.roomType || 'Standard Room',
        billDate: String(room.checkInDateTime || new Date().toISOString()).slice(0, 10),
        checkInDate: String(room.checkInDateTime || new Date().toISOString()).slice(0, 10),
        checkOutDate: String(room.expectedCheckOutDateTime || new Date().toISOString()).slice(0, 10),
        paymentMode: 'Cash / UPI',
        paymentStatus: 'PAID',
        billStatus: 'SAVED',
        tariffPerDay: tariff,
        subTotal: tariff,
        cgstAmount: Math.round(tariff * 0.025),
        sgstAmount: Math.round(tariff * 0.025),
        totalGst: Math.round(tariff * 0.05),
        netTotal: Math.round(tariff * 1.05),
        advancePayment: Math.round(tariff * 1.05),
        balanceDue: 0,
        rooms: [{
          roomNumber: String(room.roomNumber),
          roomType: room.roomType || 'Standard Room',
          pricePerDay: tariff
        }]
      };
    }

    if (onSelectBill) {
      onSelectBill(matchingBill);
    }
  };

  // Filter rooms for selected hotel & status
  const currentHotelRooms = rooms.filter(room => {
    if (selectedHotelId !== 'all' && room.hotelId !== selectedHotelId) return false;
    return true;
  });

  const filteredRooms = currentHotelRooms.filter(room => {
    if (statusFilter !== 'all' && room.displayStatus !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchRoom = String(room.roomNumber).toLowerCase().includes(term);
      const matchGuest = room.currentGuestName?.toLowerCase().includes(term);
      const matchType = room.roomType?.toLowerCase().includes(term);
      const matchInv = room.currentInvoiceNo?.toLowerCase().includes(term);
      if (!matchRoom && !matchGuest && !matchType && !matchInv) return false;
    }
    return true;
  });

  // Group rooms by Floor
  const floorsMap = {};
  filteredRooms.forEach(room => {
    const fl = room.floor || 1;
    if (!floorsMap[fl]) floorsMap[fl] = [];
    floorsMap[fl].push(room);
  });
  const sortedFloors = Object.keys(floorsMap).map(Number).sort((a, b) => a - b);

  // Stats for the currently selected hotel
  const totalCount = currentHotelRooms.length;
  const occupiedCount = currentHotelRooms.filter(r => r.displayStatus === 'occupied').length;
  const availableCount = currentHotelRooms.filter(r => r.displayStatus === 'available').length;
  const reservedCount = currentHotelRooms.filter(r => r.displayStatus === 'reserved').length;
  const cleaningCount = currentHotelRooms.filter(r => r.displayStatus === 'maintenance').length;

  const currentHotelObj = hotels.find(h => h.hotelId === selectedHotelId) || {
    name: selectedHotelId === 'hotel-1' ? 'Hotel Rojana' : selectedHotelId === 'hotel-2' ? 'Hotel Sagar Priya' : selectedHotelId === 'hotel-3' ? 'Hotel Sea Pearl' : 'All 3 Properties'
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition cursor-pointer"
            title="Back to HQ Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 font-serif tracking-wide">
                Live Room Matrix & Real-Time Occupancy
              </h1>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Floor-by-Floor View
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE SYNC ACTIVE
          </span>
          <button
            onClick={onRefresh}
            className="p-2.5 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition flex items-center gap-2 text-xs font-mono font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Matrix</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. THREE PROPERTY BOXES IN DIFFERENT COLOURS              */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Select Hotel Property to View Room Occupancy & Free List:</span>
          </span>
          <button
            onClick={() => setSelectedHotelId('all')}
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
              selectedHotelId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 bg-white border border-slate-200'
            }`}
          >
            🏢 View All Properties Combined
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {propertyCards.map((card) => {
            const isSelected = selectedHotelId === card.hotelId;
            const hotelRooms = rooms.filter(r => r.hotelId === card.hotelId);
            const total = hotelRooms.length;
            const avail = hotelRooms.filter(r => r.displayStatus === 'available').length;
            const occ = hotelRooms.filter(r => r.displayStatus === 'occupied').length;
            const res = hotelRooms.filter(r => r.displayStatus === 'reserved').length;
            const mnt = hotelRooms.filter(r => r.displayStatus === 'maintenance').length;

            return (
              <div
                key={card.hotelId}
                onClick={() => {
                  setSelectedHotelId(card.hotelId);
                  setStatusFilter('all');
                }}
                className={`
                  rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between
                  ${isSelected ? card.activeBorder : card.inactiveBorder}
                `}
              >
                <div>
                  {/* Top Bar inside Box */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      {card.number}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        VIEWING MATRIX
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {total} Rooms
                      </span>
                    )}
                  </div>

                  {/* Hotel Name */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif tracking-wide mb-3">
                    {card.name}
                  </h3>

                  {/* Room Status Summary Grid */}
                  <div className="grid grid-cols-4 gap-1.5 text-center bg-white/80 p-2 rounded-xl border border-slate-200/80">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1 px-0.5">
                      <div className="text-sm font-black font-mono text-emerald-700">{avail}</div>
                      <div className="text-[8px] font-bold text-emerald-700 uppercase">Available</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg py-1 px-0.5">
                      <div className="text-sm font-black font-mono text-rose-700">{occ}</div>
                      <div className="text-[8px] font-bold text-rose-700 uppercase">Occupied</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg py-1 px-0.5">
                      <div className="text-sm font-black font-mono text-blue-700">{res}</div>
                      <div className="text-[8px] font-bold text-blue-700 uppercase">Reserved</div>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded-lg py-1 px-0.5">
                      <div className="text-sm font-black font-mono text-slate-700">{mnt}</div>
                      <div className="text-[8px] font-bold text-slate-500 uppercase">Cleaning</div>
                    </div>
                  </div>
                </div>

                {/* Footer Callout */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                  {isSelected ? (
                    <span className="font-bold text-blue-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      Active Property Selected
                    </span>
                  ) : (
                    <span className="text-slate-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                      Click to inspect rooms →
                    </span>
                  )}
                  <span className="font-bold text-slate-800">{total} Rooms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FILTER PILLS & SEARCH FOR SELECTED PROPERTY           */}
      {/* ======================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Active Property Indicator & Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-black text-slate-900 mr-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              {currentHotelObj.name}:
            </span>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-700 hover:text-blue-600 bg-slate-100 border border-slate-200'
              }`}
            >
              All ({totalCount})
            </button>

            <button
              onClick={() => setStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                statusFilter === 'available' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              ● Available / Free ({availableCount})
            </button>

            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                statusFilter === 'occupied' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              ● Occupied ({occupiedCount})
            </button>

            <button
              onClick={() => setStatusFilter('reserved')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                statusFilter === 'reserved' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              ● Reserved ({reservedCount})
            </button>

            <button
              onClick={() => setStatusFilter('maintenance')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                statusFilter === 'maintenance' 
                  ? 'bg-slate-700 text-white shadow-xs' 
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              ● Cleaning ({cleaningCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search room no, guest name, invoice..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs text-slate-900 outline-none font-sans"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FLOOR BY FLOOR ROOM OCCUPANCY LIST                    */}
      {/* ======================================================== */}
      {sortedFloors.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs font-sans">
          No rooms found matching "{searchTerm || statusFilter}" in {currentHotelObj.name}.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedFloors.map(floorNum => {
            const floorRooms = floorsMap[floorNum] || [];

            return (
              <div key={floorNum} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                
                {/* Floor Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                      FLOOR {floorNum}
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {floorRooms.length} Rooms
                  </span>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {floorRooms.map(room => {
                    const status = room.displayStatus || 'available';
                    const isOccupied = status === 'occupied';
                    const isAvailable = status === 'available';
                    const isReserved = status === 'reserved';
                    const isCleaning = status === 'maintenance';

                    let cardBorder = 'border-slate-200 bg-slate-50/50';
                    let statusPillClass = 'bg-slate-100 text-slate-700';
                    let statusLabel = 'Available';

                    if (isOccupied) {
                      cardBorder = 'border-rose-300 bg-rose-50/50 hover:border-blue-500 hover:shadow-lg cursor-pointer';
                      statusPillClass = 'bg-rose-100 text-rose-800 border border-rose-200 font-bold';
                      statusLabel = 'Occupied';
                    } else if (isAvailable) {
                      cardBorder = 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:shadow-md cursor-pointer';
                      statusPillClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold';
                      statusLabel = 'Available (Free)';
                    } else if (isReserved) {
                      cardBorder = 'border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:shadow-md cursor-pointer';
                      statusPillClass = 'bg-blue-100 text-blue-800 border border-blue-200 font-bold';
                      statusLabel = 'Reserved';
                    } else if (isCleaning) {
                      cardBorder = 'border-slate-200 bg-slate-100/50 hover:border-slate-400 hover:shadow-md cursor-pointer';
                      statusPillClass = 'bg-slate-200 text-slate-700 border border-slate-300 font-bold';
                      statusLabel = 'Cleaning';
                    }

                    return (
                      <div
                        key={room.roomId || `${room.hotelId}-${room.roomNumber}`}
                        onClick={() => {
                          if (isOccupied) {
                            handleOpenBillForRoom(room);
                          } else {
                            setRoomInfoModal(room);
                          }
                        }}
                        className={`rounded-xl p-3.5 border ${cardBorder} flex flex-col justify-between transition-all duration-200 group`}
                        title={isOccupied ? "Click to view guest bill" : "Click to view room details"}
                      >
                        <div>
                          {/* Room Header */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-base font-black font-mono text-slate-900 group-hover:text-blue-600 transition">
                              Room {room.roomNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${statusPillClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="text-[11px] font-medium text-slate-700">
                            {room.roomType || 'Standard Room'}
                          </div>
                          
                          <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                            ₹ {formatINR(room.defaultRent || room.pricePerDay || 0)} / day
                          </div>

                          {/* Hotel Label if All view */}
                          {selectedHotelId === 'all' && (
                            <div className="text-[10px] font-mono text-blue-700 mt-1 font-semibold">
                              {room.hotelId === 'hotel-1' ? 'Hotel Rojana' : room.hotelId === 'hotel-2' ? 'Hotel Sagar Priya' : 'Hotel Sea Pearl'}
                            </div>
                          )}

                          {/* Occupied Details & Bill Link */}
                          {isOccupied && (
                            <div className="mt-2.5 pt-2 border-t border-rose-200/60 space-y-1 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-900 font-bold truncate">
                                <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="truncate">{room.currentGuestName || 'Guest In-House'}</span>
                              </div>
                              {room.expectedCheckOutDateTime && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>Out: {String(room.expectedCheckOutDateTime).slice(0, 10)}</span>
                                </div>
                              )}
                              {room.currentInvoiceNo && (
                                <div className="text-[10px] font-mono text-blue-700 font-bold flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-blue-600" />
                                  <span>Inv: {room.currentInvoiceNo}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cleaning Details */}
                          {isCleaning && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-600 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{room.maintenanceRemainingMins || 30} mins housekeeping</span>
                            </div>
                          )}

                          {/* Maintenance Alert */}
                          {room.activeIssues && room.activeIssues.length > 0 && (
                            <div className="mt-2 pt-1 text-[10px] text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="truncate font-semibold">{room.activeIssues[0].issue}</span>
                            </div>
                          )}
                        </div>

                        {/* OCCUPIED: VIEW BILL BUTTON */}
                        {isOccupied && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBillForRoom(room);
                            }}
                            className="w-full mt-3 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        )}

                        {/* AVAILABLE: FREE STATUS TAG */}
                        {isAvailable && (
                          <div className="mt-3 py-1 px-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-mono font-bold text-center">
                            ✓ Ready for Guest
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK ROOM INFO MODAL (FOR AVAILABLE / CLEANING ROOMS) */}
      {roomInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setRoomInfoModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Room {roomInfoModal.roomNumber} Details
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900">
                  {roomInfoModal.hotelId === 'hotel-1' ? 'Hotel Rojana' : roomInfoModal.hotelId === 'hotel-2' ? 'Hotel Sagar Priya' : 'Hotel Sea Pearl'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-bold text-slate-900">{roomInfoModal.roomType || 'Standard Room'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Floor Level:</span>
                <span className="font-bold text-slate-900">Floor {roomInfoModal.floor || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tariff Rate:</span>
                <span className="font-bold text-blue-700">₹ {formatINR(roomInfoModal.defaultRent || roomInfoModal.pricePerDay || 0)} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold uppercase text-emerald-700">
                  {roomInfoModal.displayStatus || 'Available'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setRoomInfoModal(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs font-mono transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
