import React, { useEffect, useState } from 'react';
import { api, socket } from '../api';

const InventoryDashboard = () => {
  const [drops, setDrops] = useState([]);
  const [reservation, setReservation] = useState(null); // { id, dropId }
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Initial Load from Database
    fetchDrops();

    // 2. Listen for Real-Time Stock Updates (Reservations or Expirations)
    socket.on('stock_updated', (data) => {
      setDrops((prev) =>
        prev.map((d) => (d.id === data.dropId ? { ...d, availableStock: data.availableStock } : d))
      );
    });

    // 3. Listen for New Purchases to update Activity Feed
    socket.on('new_purchase', (data) => {
      setDrops((prev) =>
        prev.map((d) => {
          if (d.id === data.dropId) {
            const newEntry = { User: { username: data.username }, createdAt: new Date() };
            const updatedPurchases = [newEntry, ...(d.Purchases || [])].slice(0, 3);
            return { ...d, Purchases: updatedPurchases };
          }
          return d;
        })
      );
    });

    return () => {
      socket.off('stock_updated');
      socket.off('new_purchase');
    };
  }, []);

  const fetchDrops = async () => {
    try {
      const res = await api.get('/drops');
      setDrops(res.data);
    } catch (err) {
      console.error("Failed to fetch drops", err);
    }
  };

  const handleReserve = async (dropId) => {
    setLoading(true);
    try {
      const res = await api.post(`/reserve/${dropId}`);
      setReservation({ id: res.data.reservationId, dropId });
      setTimeLeft(60); // Start the 60s countdown
    } catch (err) {
      alert(err.response?.data?.message || "Out of stock!");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await api.post(`/purchase/${reservation.id}`);
      alert("🚀 Purchase Confirmed!");
      setReservation(null);
      setTimeLeft(0);
      fetchDrops(); // Refresh to show latest activity
    } catch (err) {
      alert("Purchase failed. Your reservation may have expired.");
      setReservation(null);
    } finally {
      setLoading(false);
    }
  };

  // Timer Logic: Auto-cleanup when time hits 0
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && reservation) {
      setReservation(null);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, reservation]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">SNEAKER DROPS</h1>
          <p className="text-gray-500 font-medium">Real-time Inventory & High-Concurrency Sales</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {drops.map((drop) => (
          <div key={drop.id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800 leading-tight">{drop.name}</h2>
                <span className="text-xl font-black text-blue-600">${drop.price}</span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Units</span>
                <p className="text-4xl font-black text-gray-900">{drop.availableStock}</p>
              </div>

              {reservation?.dropId === drop.id ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                    <span className="text-orange-600 font-bold text-sm uppercase">Time to Buy</span>
                    <span className="text-orange-600 font-mono font-black text-xl">{timeLeft}s</span>
                  </div>
                  <button 
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-green-200 active:scale-95"
                  >
                    {loading ? 'PROCESSING...' : 'COMPLETE PURCHASE'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleReserve(drop.id)}
                  disabled={drop.availableStock === 0 || reservation !== null || loading}
                  className={`w-full py-4 rounded-2xl font-black transition-all active:scale-95 ${
                    drop.availableStock === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : reservation !== null
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-black shadow-xl'
                  }`}
                >
                  {drop.availableStock === 0 ? 'SOLD OUT' : 'RESERVE SPOT'}
                </button>
              )}
            </div>

            {/* Activity Feed Section */}
            <div className="bg-gray-50 p-6 mt-auto border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Recent Activity</h4>
              <div className="space-y-3">
                {drop.Purchases?.length > 0 ? drop.Purchases.map((p, i) => (
                  <div key={i} className="flex items-center text-sm text-gray-600 animate-fadeIn">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span>User <span className="font-bold text-gray-800">{p.User?.username}</span> grabbed a pair!</span>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 italic">No purchases yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryDashboard;