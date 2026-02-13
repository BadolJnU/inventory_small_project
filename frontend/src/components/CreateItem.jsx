import React, { useState } from 'react';
import { api } from '../api';

const CreateItem = () => {
  const [formData, setFormData] = useState({
    name: '', price: '', availableStock: '', category: 'Shoes'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/items', formData);
      alert("Item added successfully!");
      setFormData({ name: '', price: '', availableStock: '', category: 'Shoes' });
    } catch (err) {
      console.error(err);
      alert("Error adding item. Check console.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Create New Item</h2>
        <input className="w-full p-2 mb-4 border rounded" placeholder="Item Name" required
          onChange={e => setFormData({...formData, name: e.target.value})} />
        <input className="w-full p-2 mb-4 border rounded" type="number" placeholder="Price" required
          onChange={e => setFormData({...formData, price: e.target.value})} />
        <input className="w-full p-2 mb-4 border rounded" type="number" placeholder="Stock" required
          onChange={e => setFormData({...formData, availableStock: e.target.value})} />
        <select className="w-full p-2 mb-4 border rounded" 
          onChange={e => setFormData({...formData, category: e.target.value})}>
          <option value="Shoes">Shoes</option>
          <option value="Clothes">Clothes</option>
          <option value="Accessories">Accessories</option>
        </select>
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Add Product</button>
      </form>
    </div>
  );
};

export default CreateItem; // <--- MUST HAVE THIS