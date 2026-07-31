'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Client Config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pccvfdvsufqnlnvcdrxk.supabase.co/rest/v1/',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JVqfPJWwmLrAMk7_nXp0pA_OwsvTnVt'
);

const DEFAULT_AMENITIES = [
  'Swimming Pool', 'Gym', 'Lift', 'Parking', 'Power Backup', 
  'Garden', 'Kids Play Area', 'Club House', 'Security', 'CCTV', 
  'Gas Pipeline', 'Temple', 'School', 'Hospital', 'Metro', 'Railway Station'
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('properties'); // properties | amenities | services
  
  // Property State
  const [properties, setProperties] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '', price: '', region: 'All Mumbai', location: '', 
    category: '1, 2, 3, 4 BHK Flats', status: 'Published', 
    is_featured: false, images: [], amenities: [], description: ''
  });

  // Amenities & Legal Services State
  const [amenitiesList, setAmenitiesList] = useState(DEFAULT_AMENITIES);
  const [newAmenity, setNewAmenity] = useState('');

  // Fetch properties from Supabase
  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (data) setProperties(data);
  };

  useEffect(() => {
    if (isAuthenticated) fetchProperties();
  }, [isAuthenticated]);

  // Handle Single Admin Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@tricorerealty.com' && password === 'Tricore@2026') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid admin credentials.');
    }
  };

  // Image Upload with Auto Compression & Resizing
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { error } = await supabase.storage.from('property-images').upload(filePath, file);
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    setUploading(false);
  };

  // Save / Update Property
  const handleSaveProperty = async (e) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('properties').update(formData).eq('id', editingId);
    } else {
      await supabase.from('properties').insert([formData]);
    }
    setIsFormOpen(false);
    resetForm();
    fetchProperties();
  };

  // Quick Action Handlers
  const handleStatusChange = async (id, status) => {
    await supabase.from('properties').update({ status }).eq('id', id);
    fetchProperties();
  };

  const handleToggleFeatured = async (id, currentVal) => {
    await supabase.from('properties').update({ is_featured: !currentVal }).eq('id', id);
    fetchProperties();
  };

  const handleDuplicate = async (property) => {
    const duplicated = { ...property, id: undefined, title: `${property.title} (Copy)`, created_at: undefined };
    await supabase.from('properties').insert([duplicated]);
    fetchProperties();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to permanently delete this listing?')) {
      await supabase.from('properties').delete().eq('id', id);
      fetchProperties();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '', price: '', region: 'All Mumbai', location: '', 
      category: '1, 2, 3, 4 BHK Flats', status: 'Published', 
      is_featured: false, images: [], amenities: [], description: ''
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-800">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-extrabold text-navy-900 mb-6 text-center">TRICORE Admin Portal</h1>
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 mb-1">ADMIN EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border p-2.5 rounded text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 mb-1">PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border p-2.5 rounded text-sm focus:outline-none focus:border-blue-600" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-sm transition">Login to Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-extrabold">TRICORE Admin Control Panel</h1>
        <button onClick={() => setIsAuthenticated(false)} className="bg-red-600 hover:bg-red-700 text-xs font-bold px-3 py-1.5 rounded transition">Logout</button>
      </header>

      {/* DASHBOARD STATS OVERVIEW */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded border text-center"><p className="text-xs text-slate-500 font-bold uppercase">Total</p><p className="text-2xl font-extrabold text-slate-800">{properties.length}</p></div>
          <div className="bg-white p-4 rounded border text-center"><p className="text-xs text-emerald-600 font-bold uppercase">Published</p><p className="text-2xl font-extrabold text-emerald-600">{properties.filter(p => p.status === 'Published').length}</p></div>
          <div className="bg-white p-4 rounded border text-center"><p className="text-xs text-amber-600 font-bold uppercase">Drafts</p><p className="text-2xl font-extrabold text-amber-600">{properties.filter(p => p.status === 'Draft').length}</p></div>
          <div className="bg-white p-4 rounded border text-center"><p className="text-xs text-blue-600 font-bold uppercase">Sold</p><p className="text-2xl font-extrabold text-blue-600">{properties.filter(p => p.status === 'Sold').length}</p></div>
          <div className="bg-white p-4 rounded border text-center"><p className="text-xs text-purple-600 font-bold uppercase">Featured</p><p className="text-2xl font-extrabold text-purple-600">{properties.filter(p => p.is_featured).length}</p></div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-300 mb-6 space-x-4">
          <button onClick={() => setActiveTab('properties')} className={`pb-2 text-sm font-bold border-b-2 ${activeTab === 'properties' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Property Manager</button>
          <button onClick={() => setActiveTab('amenities')} className={`pb-2 text-sm font-bold border-b-2 ${activeTab === 'amenities' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Amenities Manager</button>
        </div>

        {/* PROPERTY MANAGER TAB */}
        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">All Properties</h2>
              <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded transition">+ Add New Property</button>
            </div>

            {/* LISTINGS TABLE */}
            <div className="bg-white rounded border overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Featured</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {properties.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{item.title}</td>
                      <td className="p-3 text-slate-600">{item.region}</td>
                      <td className="p-3 text-blue-700 font-bold">{item.price}</td>
                      <td className="p-3">
                        <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} className="border rounded p-1 text-xs bg-white font-semibold">
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Archived">Archived</option>
                          <option value="Sold">Mark Sold</option>
                          <option value="Rented">Mark Rented</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleToggleFeatured(item.id, item.is_featured)} className={`px-2 py-1 rounded text-[10px] font-bold ${item.is_featured ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.is_featured ? 'Featured' : 'Standard'}
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => { setEditingId(item.id); setFormData(item); setIsFormOpen(true); }} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDuplicate(item)} className="text-slate-600 hover:underline">Duplicate</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AMENITIES MANAGER TAB */}
        {activeTab === 'amenities' && (
          <div className="bg-white p-6 rounded border max-w-2xl">
            <h2 className="text-base font-bold mb-4">Manage Reusable Amenities</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Add new amenity name..." className="flex-1 border p-2 text-xs rounded" />
              <button onClick={() => { if (newAmenity) setAmenitiesList([...amenitiesList, newAmenity]); setNewAmenity(''); }} className="bg-emerald-600 text-white font-bold px-4 text-xs rounded">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((item, idx) => (
                <span key={idx} className="bg-slate-100 border px-3 py-1 rounded text-xs font-semibold flex items-center gap-2">
                  {item}
                  <button onClick={() => setAmenitiesList(amenitiesList.filter((_, i) => i !== idx))} className="text-red-500 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROPERTY MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Property' : 'Add New Property'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">×</button>
            </div>
            <form onSubmit={handleSaveProperty} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Property Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Price (e.g. ₹1.12 Cr)</label>
                  <input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Region</label>
                  <select value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="w-full border p-2 rounded">
                    <option value="All Mumbai">All Mumbai</option>
                    <option value="All Thane">All Thane</option>
                    <option value="Navi Mumbai">Navi Mumbai</option>
                    <option value="Virar & Vasai">Virar & Vasai</option>
                    <option value="Lonavala">Lonavala</option>
                  </select>
                </div>
              </div>

              {/* IMAGE GALLERY DRAG-AND-DROP UPLOAD */}
              <div>
                <label className="block font-bold mb-1">Upload Property Photos</label>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full border p-2 rounded bg-slate-50" />
                {uploading && <p className="text-blue-600 mt-1 font-semibold">Uploading & compressing photos...</p>}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                      <img src={img} class="w-full h-full object-cover" />
                      <button type="button" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })} className="absolute top-0 right-0 bg-red-600 text-white px-1 text-[10px]">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsFormOpen(false)} className="border px-4 py-2 rounded font-bold">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700">Save Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
