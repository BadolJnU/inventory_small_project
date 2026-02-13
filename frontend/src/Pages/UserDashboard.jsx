import React, { useState, useEffect } from 'react';
import { api, socket } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [activeReservations, setActiveReservations] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Logout Function
  const handleLogout = () => {
    localStorage.clear();
    toast.info("Logged out successfully");
    navigate('/login');
  };

  // 2. Fetch Data
  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      toast.error("Failed to load items");
    }
  };

  const fetchOrders = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
      const res = await api.get(`/my-orders/${userId}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Orders fetch error:", err);
    }
  };

  // 3. Socket & Initial Load
  useEffect(() => {
    fetchItems();
    fetchOrders();

    socket.on('stock_updated', ({ itemId, newStock }) => {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, availableStock: newStock } : item
      ));
    });

    return () => socket.off('stock_updated');
  }, []);

  // 4. Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReservations(prev => {
        const updated = { ...prev };
        const keys = Object.keys(updated);
        if (keys.length === 0) return prev;

        keys.forEach(id => {
          if (updated[id] <= 1) {
            delete updated[id];
            toast.warn("Reservation expired!");
            fetchItems();
          } else {
            updated[id] -= 1;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 5. Reserve Item
  const handleReserve = async (itemId) => {
    const qty = quantities[itemId] || 1;
    const userId = localStorage.getItem('userId');
    
    try {
      await api.post('/reserve', { itemId, userId, quantity: qty });
      setActiveReservations(prev => ({ ...prev, [itemId]: 60 }));
      fetchItems();
      toast.success(`Reserved ${qty} item(s)!`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Reservation failed");
    }
  };

  // 6. Confirm Purchase
  const handlePurchase = async (itemId) => {
    const userId = localStorage.getItem('userId');
    setLoading(true);
    try {
      const res = await api.post('/purchase-confirm', { itemId, userId });
      if (res.status === 200) {
        toast.success("🎉 Purchase Successful!");
        fetchItems();
        fetchOrders();
        setActiveReservations(prev => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  // 7. Calculate Lifetime Total
  const grandTotal = orders.reduce((sum, order) => {
    return sum + (order.quantity * (order.Drop?.price || 0));
  }, 0);

  return (
    <div className="p-8 bg-black min-h-screen text-white font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            ELITE SHOP
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">User ID: {localStorage.getItem('userId')}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-600/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-full font-bold hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg shadow-red-900/20"
        >
          LOGOUT
        </button>
      </nav>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {items.map(item => (
          <div key={item.id} className="bg-gray-900 rounded-3xl border border-gray-800 p-6 hover:border-blue-500/50 transition-all duration-500 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{item.name}</h2>
              <span className="text-green-400 font-mono text-xl font-black">${item.price}</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 uppercase tracking-tight">Stock Available: {item.availableStock}</p>

            {activeReservations[item.id] ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 text-red-500 py-3 rounded-xl border border-red-500/30 text-center font-mono animate-pulse">
                  RESERVATION ENDS: {activeReservations[item.id]}s
                </div>
                <button 
                  disabled={loading}
                  onClick={() => handlePurchase(item.id)}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black text-lg transition-all shadow-lg shadow-green-900/40"
                >
                  {loading ? "PROCESSING..." : "CONFIRM PURCHASE"}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input 
                  type="number" 
                  min="1" 
                  defaultValue={1}
                  onChange={(e) => setQuantities({...quantities, [item.id]: parseInt(e.target.value)})}
                  className="w-20 bg-black border border-gray-700 rounded-xl text-center font-bold focus:border-blue-500 outline-none"
                />
                <button 
                  onClick={() => handleReserve(item.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
                >
                  RESERVE NOW
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order History Table */}
      <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden">
        <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-2xl font-black">MY ORDER HISTORY</h2>
          <span className="text-xs text-gray-500 uppercase font-bold tracking-widest bg-gray-800 px-4 py-2 rounded-full">
            {orders.length} Completed Transactions
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-20 text-center text-gray-600 font-medium">No orders found yet. Start shopping!</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                  <th className="p-6">Item Name</th>
                  <th className="p-6 text-center">Qty</th>
                  <th className="p-6">Price Each</th>
                  <th className="p-6">Total Amount</th>
                  <th className="p-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-medium">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6">{order.Drop?.name}</td>
                    <td className="p-6 text-center text-blue-400 font-mono">{order.quantity}</td>
                    <td className="p-6 text-gray-400">${(order.Drop?.price || 0).toFixed(2)}</td>
                    <td className="p-6 text-green-400 font-bold">${(order.quantity * (order.Drop?.price || 0)).toFixed(2)}</td>
                    <td className="p-6">
                      <span className="bg-green-500/10 text-green-500 px-4 py-1 rounded-full text-[10px] font-black uppercase border border-green-500/20">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-black/60 border-t-2 border-gray-800">
                <tr>
                  <td colSpan="3" className="p-8 text-right text-gray-500 font-bold text-sm uppercase">Total Lifetime Investment:</td>
                  <td colSpan="2" className="p-8 text-3xl font-black text-green-500 font-mono">${grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;