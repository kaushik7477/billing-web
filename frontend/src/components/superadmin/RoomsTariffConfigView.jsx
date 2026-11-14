import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import { 
  Settings, Building2, Plus, Edit3, Trash2, CheckCircle2, 
  ArrowLeft, RefreshCw, AlertCircle, Save, X
} from 'lucide-react';

export default function RoomsTariffConfigView({
  hotels = [],
  rooms = [],
  token,
  onRefresh,
  onHotelsUpdated,
  onBackToDashboard
}) {
  const [selectedHotelId, setSelectedHotelId] = useState('hotel-1');
  const [toastMsg, setToastMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Room Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addRoomNumber, setAddRoomNumber] = useState('');
  const [addFloor, setAddFloor] = useState(1);
  const [addRoomType, setAddRoomType] = useState('Standard Room');
  const [addPricePerDay, setAddPricePerDay] = useState(1500);

  // Edit Tariff Inline State
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editType, setEditType] = useState('');
  const [editFloor, setEditFloor] = useState(1);

  const selectedHotel = hotels.find(h => h.hotelId === selectedHotelId) || {};

  // Filter rooms for current hotel
  const hotelRooms = rooms.filter(r => r.hotelId === selectedHotelId);

  // Add New Room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!addRoomNumber || !addPricePerDay || !addRoomType) {
      alert('Please enter room number, category name, and daily tariff.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: selectedHotelId,
          roomNumber: addRoomNumber.trim(),
          floor: parseInt(addFloor, 10) || 1,
          roomType: addRoomType.trim(),
          defaultRent: parseFloat(addPricePerDay) || 1500,
          pricePerDay: parseFloat(addPricePerDay) || 1500
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMsg(`Room ${addRoomNumber} added successfully to ${selectedHotel.name}!`);
        setShowAddModal(false);
        setAddRoomNumber('');
        onRefresh();
        setTimeout(() => setToastMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to add room.');
      }
    } catch (err) {
      alert('Network error adding room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edited Tariff & Details
  const handleSaveEditRoom = async (roomNumber) => {
    try {
      const res = await fetch(`/api/rooms/${selectedHotelId}/${roomNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          defaultRent: parseFloat(editPrice) || 1500,
          pricePerDay: parseFloat(editPrice) || 1500,
          roomType: editType.trim(),
          floor: parseInt(editFloor, 10) || 1
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMsg(`Room ${roomNumber} updated successfully!`);
        setEditingRoomId(null);
        onRefresh();
        setTimeout(() => setToastMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to update room.');
      }
    } catch (err) {
      alert('Error updating room details.');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomNumber) => {
    if (!window.confirm(`Are you sure you want to remove Room ${roomNumber} from inventory?`)) return;
    try {
      const res = await fetch(`/api/rooms/${selectedHotelId}/${roomNumber}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setToastMsg(`Room ${roomNumber} removed.`);
        onRefresh();
        setTimeout(() => setToastMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to delete room.');
      }
    } catch (err) {
      alert('Error deleting room.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
            title="Back to HQ Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 font-serif tracking-wide">
                Room Inventory, Tariff Rates & GST Configuration
              </h1>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Super Admin Rates Master
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Property Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {hotels.map(h => {
          const isSelected = selectedHotelId === h.hotelId;
          const count = rooms.filter(r => r.hotelId === h.hotelId).length;

          return (
            <button
              key={h.hotelId}
              onClick={() => setSelectedHotelId(h.hotelId)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-blue-600 bg-white border border-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{h.name} ({count} Rooms)</span>
            </button>
          );
        })}
      </div>

      {/* ROOMS INVENTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Configured Rooms & Default Base Tariffs ({hotelRooms.length} Rooms)
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Live Inventory
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 font-mono">Room No</th>
                <th className="py-3 px-3">Floor</th>
                <th className="py-3 px-4">Room Category</th>
                <th className="py-3 px-4 text-right">Default Base Tariff (₹/Day)</th>
                <th className="py-3 px-3 text-center">Current Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotelRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No rooms configured for this property yet.
                  </td>
                </tr>
              ) : (
                hotelRooms.map(room => {
                  const isEditing = editingRoomId === room.roomNumber;
                  const isOccupied = room.displayStatus === 'occupied';

                  return (
                    <tr key={room.roomNumber} className="hover:bg-slate-50/80 transition">
                      
                      {/* Room Number */}
                      <td className="py-3 px-4 font-mono font-black text-base text-slate-900">
                        {room.roomNumber}
                      </td>

                      {/* Floor */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editFloor}
                            onChange={(e) => setEditFloor(e.target.value)}
                            className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs font-mono"
                          />
                        ) : (
                          `Floor ${room.floor || 1}`
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            required
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            placeholder="e.g. Deluxe Room"
                            className="w-44 px-2 py-1 bg-white border border-slate-300 focus:border-blue-500 rounded text-slate-900 text-xs font-medium outline-none"
                          />
                        ) : (
                          <span className="font-medium">{room.roomType || 'Standard'}</span>
                        )}
                      </td>

                      {/* Tariff */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-blue-700 text-xs font-mono text-right"
                            />
                          </div>
                        ) : (
                          <span className="text-slate-900 text-sm">
                            ₹ {formatINR(room.defaultRent || room.pricePerDay || 0)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isOccupied 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {room.displayStatus || 'Available'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveEditRoom(room.roomNumber)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              title="Save Changes"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingRoomId(null)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRoomId(room.roomNumber);
                                setEditPrice(room.defaultRent || room.pricePerDay || 1500);
                                setEditType(room.roomType || 'Standard Room');
                                setEditFloor(room.floor || 1);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Tariff & Category"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.roomNumber)}
                              disabled={isOccupied}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-30 cursor-pointer"
                              title={isOccupied ? "Cannot delete occupied room" : "Delete Room"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ROOM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white border border-slate-200 text-slate-900 rounded-2xl p-6 shadow-xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 font-serif mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add New Room to {selectedHotel.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter room identifier, floor level and standard daily tariff.
            </p>

            <form onSubmit={handleAddRoom} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">
                  Room Number:
                </label>
                <input
                  type="text"
                  required
                  value={addRoomNumber}
                  onChange={(e) => setAddRoomNumber(e.target.value)}
                  placeholder="e.g. 106 or 305"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">
                    Floor Level:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={addFloor}
                    onChange={(e) => setAddFloor(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">
                    Tariff (₹ / Day):
                  </label>
                  <input
                    type="number"
                    required
                    min="500"
                    value={addPricePerDay}
                    onChange={(e) => setAddPricePerDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">
                  Room Category / Name:
                </label>
                <input
                  type="text"
                  required
                  value={addRoomType}
                  onChange={(e) => setAddRoomType(e.target.value)}
                  placeholder="e.g. Standard Room, Sea View AC, Suite Room"
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-slate-900 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer disabled:opacity-50 font-mono"
                >
                  {isSubmitting ? 'Adding Room...' : 'Confirm & Save Room'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
