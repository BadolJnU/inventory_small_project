import React, { useState } from 'react';
import { api } from '../api';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await api.post(endpoint, formData);
  
      if (!isLogin) {
        alert("Registration successful! Now please log in.");
        setIsLogin(true);
        return;
      }
  
      // 1. Save the token
      localStorage.setItem('token', res.data.token);
      
      // 2. MATCH THE BACKEND KEY: Your backend sends 'userId' directly
      const idToSave = res.data.userId; 
      
      if (idToSave) {
        localStorage.setItem('userId', idToSave);
        console.log("UserID successfully saved:", idToSave);
      } else {
        // This log will help you see if the backend changed its mind again
        console.error("Backend did not send userId! Received:", res.data);
      }

      localStorage.setItem('username', res.data.username);
      localStorage.setItem('email', res.data.email);
  
      // 3. Redirect logic
      if (res.data.email === 'admin@system.com') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      const message = err.response?.data?.error || "Something went wrong";
      alert(isLogin ? "Login failed: " + message : "Registration failed: " + message);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-96">
        <h2 className="text-2xl font-black mb-6 text-center">{isLogin ? 'WELCOME BACK' : 'JOIN THE DROP'}</h2>
        {!isLogin && (
          <input className="w-full border p-3 rounded mb-4" placeholder="Username" 
            onChange={e => setFormData({...formData, username: e.target.value})} />
        )}
        <input className="w-full border p-3 rounded mb-4" placeholder="Email" type="email"
          onChange={e => setFormData({...formData, email: e.target.value})} />
        <input className="w-full border p-3 rounded mb-6" placeholder="Password" type="password"
          onChange={e => setFormData({...formData, password: e.target.value})} />
        
        <button className="w-full bg-black text-white p-3 rounded-lg font-bold mb-4 hover:bg-gray-800 transition">
          {isLogin ? 'LOG IN' : 'SIGN UP'}
        </button>
        <p className="text-center text-sm cursor-pointer text-blue-600 font-medium" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Sign Up" : "Have an account? Log In"}
        </p>
      </form>
    </div>
  );
};

export default AuthPage;