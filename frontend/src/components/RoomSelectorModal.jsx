import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Check, 
  RefreshCw 
} from 'lucide-react';

export default function RoomSelectorModal({ 
  isOpen, 
  onClose, 
  hotelId, 
  selectedRoomNumber, 
  selectedRooms = [],
  onSelectRooms,
  isOptional = false,
  isAdvance = false,
  targetDate = ''
}) {
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tempSelectedRooms, setTempSelectedRooms] = useState([]);
  const [maintenanceWarningRoom, setMaintenanceWarningRoom] = useState(null);

  // Fetch rooms
  const fetchRooms = async () => {
    if (!hotelId) return;
    setIsLoading(true);
    try {
      const dateQuery = targetDate ? `&date=${encodeURIComponent(targetDate)}` : '';
      const res = await fetch(`/api/rooms?hotelId=${hotelId}${dateQuery}`);
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
        setFloors(data.floors || {});
      }
    } catch (err) {
      console.error('Failed to fetch rooms in selector:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMaintenanceWarningRoom(null);

      // Pre-populate with currently selected rooms
      if (selectedRooms && selectedRooms.length > 0) {
        setTempSelectedRooms([...selectedRooms]);
      } else if (selectedRoomNumber) {
        const currentNums = String(selectedRoomNumber).split(',').map(s => s.trim()).filter(Boolean);
        setTempSelectedRooms(currentNums.map(num => ({ 
          roomNumber: num, 
          roomType: 'Selected Room', 
          defaultRent: 2000,
          rentPerDay: 2000
        })));
      } else {
        setTempSelectedRooms([]);
      }

      fetchRooms();
    }
  }, [isOpen, hotelId, targetDate]);

  // When rooms list loads, enrich tempSelectedRooms with actual room details without dropping user selections
  useEffect(() => {
    if (rooms.length > 0) {
      setTempSelectedRooms(prev => {
        if (!prev || prev.length === 0) return prev;
        return prev.map(item => {
          const match = rooms.find(r => r.roomNumber === item.roomNumber);
          if (match) {
            return {
              ...match,
              rentPerDay: item.rentPerDay !== undefined ? item.rentPerDay : match.defaultRent
            };
          }
          return item;
        });
      });
    }
  }, [rooms]);

  if (!isOpen) return null;

  // Handle clicking a room in the matrix (multi-room toggle)
  const handleRoomClick = (room) => {
    const isAlreadySelected = tempSelectedRooms.some(r => r.roomNumber === room.roomNumber);

    // If occupied by someone else (and not part of current selection), block only if not advance booking
    if (!isAdvance && !isAlreadySelected && room.displayStatus === 'occupied') {
      alert(`Room ${room.roomNumber} is currently OCCUPIED by ${room.currentGuestName || 'a guest'}.`);
      return;
    }

    // If room is under 30-min maintenance (Grey), show user's required warning
    if (room.displayStatus === 'maintenance') {
      setMaintenanceWarningRoom(room);
      return;
    }

    // Toggle room in selection
    setTempSelectedRooms(prev => {
      const exists = prev.some(r => r.roomNumber === room.roomNumber);
      if (exists) {
        return prev.filter(r => r.roomNumber !== room.roomNumber);
      } else {
        return [...prev, {
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          defaultRent: room.defaultRent,
          rentPerDay: room.defaultRent
        }];
      }
    });
  };

  // Confirm selection and close - cleanly emits the full multi-room array
  const handleConfirmDone = () => {
    if (!isOptional && tempSelectedRooms.length === 0) {
      alert('Please select at least one available room, then click Done.');
      return;
    }
    if (onSelectRooms) {
      onSelectRooms(tempSelectedRooms);
    }
    onClose();
  };

  const totalDailyRent = tempSelectedRooms.reduce((sum, r) => sum + (parseFloat(r.defaultRent) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <BedDouble className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Select Room(s) from Inventory</h3>
              <p className="text-[11px] text-slate-500">Click rooms to select one or multiple rooms for this guest</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRooms}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
              title="Refresh Rooms"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status Color Legend */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider">Status Flags:</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span> Available (Green)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200"></span> Occupied (Red)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span> Reserved (Yellow)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200"></span> Housekeeping (Grey)
            </span>
          </div>
        </div>

        {/* Floor-by-Floor Room Matrix */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {isLoading && rooms.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">Loading rooms...</div>
          ) : Object.keys(floors).length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No rooms found for this property.</div>
          ) : (
            Object.keys(floors).map(floorNum => (
              <div key={floorNum} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    Floor {floorNum}
                  </span>
                  <div className="flex-1 h-[1px] bg-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {floors[floorNum].map(room => {
                    const isSelected = tempSelectedRooms.some(r => r.roomNumber === room.roomNumber);
                    const hasIssues = room.activeIssues && room.activeIssues.length > 0;

                    // Color styles by Live Status Flags
                    let cardBg = 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500 hover:shadow-md';
                    let badgeBg = 'bg-emerald-600 text-white';
                    let statusLabel = 'Available';

                    if (room.displayStatus === 'occupied') {
                      cardBg = 'bg-rose-50 border-rose-200 text-rose-800 opacity-70 cursor-not-allowed';
                      badgeBg = 'bg-rose-600 text-white';
                      statusLabel = 'Occupied';
                    } else if (room.displayStatus === 'reserved') {
                      cardBg = 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500 hover:shadow-md';
                      badgeBg = 'bg-amber-500 text-white';
                      statusLabel = 'Reserved';
                    } else if (room.displayStatus === 'maintenance') {
                      cardBg = 'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400 hover:shadow-sm';
                      badgeBg = 'bg-slate-500 text-white';
                      statusLabel = `${room.maintenanceRemainingMins || 30}m Cleaning`;
                    }

                    if (isSelected) {
                      cardBg = 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-600 ring-offset-1 shadow-md';
                    }

                    return (
                      <button
                        key={room.roomNumber}
                        type="button"
                        onClick={() => handleRoomClick(room)}
                        className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between cursor-pointer ${cardBg}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-base font-extrabold">{room.roomNumber}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium truncate">{room.roomType}</div>
                        <div className="text-[11px] font-bold mt-1 text-slate-700">₹{room.defaultRent}/day</div>

                        {/* Active defect/issue warning badge */}
                        {hasIssues && (
                          <div 
                            className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 truncate"
                            title={`Issue: ${room.activeIssues[0]?.issue}`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{room.activeIssues[0]?.issue}</span>
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Room Confirmation & Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            {tempSelectedRooms.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-slate-800">
                  Selected ({tempSelectedRooms.length} Room{tempSelectedRooms.length > 1 ? 's' : ''}):{' '}
                  <span className="text-blue-700 font-bold">
                    {tempSelectedRooms.map(r => `Room ${r.roomNumber} (₹${r.defaultRent})`).join(', ')}
                  </span>
                  {tempSelectedRooms.length > 1 && (
                    <span className="ml-1 text-emerald-700 font-extrabold">
                      • Total ₹{totalDailyRent}/day
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Click one or more available rooms above to select for this stay</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isOptional && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectRooms) onSelectRooms([]);
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
              >
                Clear Room (Keep Unassigned)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDone}
              disabled={!isOptional && tempSelectedRooms.length === 0}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {tempSelectedRooms.length === 0 
                ? (isOptional ? 'Keep Unassigned' : 'Select a Room')
                : `Done & Apply (${tempSelectedRooms.length} Room${tempSelectedRooms.length > 1 ? 's' : ''})`
              }
            </button>
          </div>
        </div>

      </div>

      {/* 30-Minute Maintenance Warning Modal */}
      {maintenanceWarningRoom && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Housekeeping in Progress (Room {maintenanceWarningRoom.roomNumber})
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This room was recently checked out and is under its <span className="font-bold text-slate-800">30-minute cleaning & sanitization cycle</span> ({maintenanceWarningRoom.maintenanceRemainingMins || 30} mins remaining).
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
              Assigning this room now will end its housekeeping cycle early. Would you like to force-assign to the guest?
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMaintenanceWarningRoom(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel (Wait 30m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempSelectedRooms(prev => {
                    const exists = prev.some(r => r.roomNumber === maintenanceWarningRoom.roomNumber);
                    if (exists) return prev;
                    return [...prev, maintenanceWarningRoom];
                  });
                  setMaintenanceWarningRoom(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                OK (Force Assign)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
