import React, { useState, useEffect } from 'react';
import { api, socket } from '../api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [data, setData] = useState({ users: [], items: [], history: [] });
  const [newItem, setNewItem] = useState({ name: '', price: '', availableStock: '', category: '' });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/admin/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      if (err.response?.status === 401) alert("Unauthorized: Please login as Admin.");
    }
  };

  useEffect(() => {
    fetchAdminData();

    socket.on('stock_updated', ({ itemId, newStock }) => {
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, availableStock: newStock } : item
        )
      }));
    });
  
    return () => socket.off('stock_updated');
  }, []);

  // --- ACTIONS ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/items', newItem, { headers: { Authorization: `Bearer ${token}` } });
      setNewItem({ name: '', price: '', availableStock: '', category: '' });
      fetchAdminData();
      alert("Item Created!");
    } catch (err) { alert("Create failed: " + err.response?.data?.error); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAdminData();
    } catch (err) { alert("Delete failed"); }
  };

  if (loading) return <div className="p-10 text-white font-black">ACCESSING SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 text-black font-sans">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-black italic tracking-tighter">ADMIN CONTROL PANEL</h1>
        <button onClick={() => { localStorage.clear(); window.location.href='/'; }} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 transition">LOGOUT</button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-200 rounded-xl w-fit">
        {['items', 'users', 'history'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-6 rounded-lg font-bold uppercase transition ${activeTab === tab ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-black'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- TAB 1: ITEMS MANAGEMENT --- */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Add New Merch Drop</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input className="border p-2 rounded-lg" placeholder="Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              <input className="border p-2 rounded-lg" type="number" placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
              <input className="border p-2 rounded-lg" type="number" placeholder="Stock" value={newItem.availableStock} onChange={e => setNewItem({...newItem, availableStock: e.target.value})} required />
              <input className="border p-2 rounded-lg" placeholder="Category" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} required />
              <button className="bg-black text-white rounded-lg font-bold hover:bg-gray-800">CREATE DROP</button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest">
                  <th className="p-4 border-b">Product</th>
                  <th className="p-4 border-b">Category</th>
                  <th className="p-4 border-b">Stock</th>
                  <th className="p-4 border-b">Top 3 Purchasers</th>
                  <th className="p-4 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 border-b last:border-0 transition">
                    <td className="p-4 font-bold">{item.name}</td>
                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.category}</span></td>
                    <td className="p-4 font-mono font-bold">{item.availableStock}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.Purchases?.length > 0 ? (
                          item.Purchases.slice(0, 3).map((p, i) => (
                            <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">
                              @{p.User?.username}
                            </span>
                          ))
                        ) : <span className="text-xs text-gray-300">None</span>}
                      </div>
                    </td>
                    <td className="p-4 text-red-500 font-bold cursor-pointer hover:underline" onClick={() => handleDelete(item.id)}>Delete</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: USERS LIST --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase p-4 border-b">
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="p-4 font-bold">{user.username}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 3: ALL PURCHASES --- */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white text-xs uppercase tracking-widest">
                <th className="p-4">User</th>
                <th className="p-4">Item</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((record, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="p-4 font-bold">
  {record.User?.username || record.user?.username || `ID: ${record.userId || record.UserId || '??'}`}
</td>
                  <td className="p-4">{record.Drop?.name}</td>
                  <td className="p-4">{record.quantity}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${record.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(record.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;