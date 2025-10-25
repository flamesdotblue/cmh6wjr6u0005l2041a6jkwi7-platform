import React, { useEffect, useMemo, useState } from 'react';

const LS = {
  PRODUCTS: 'pos_products',
  CASHIERS: 'pos_cashiers',
  ORDERS: 'pos_orders',
};

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export default function AdminDashboard() {
  const [products, setProducts] = useState(() => read(LS.PRODUCTS, []));
  const [cashiers, setCashiers] = useState(() => read(LS.CASHIERS, []));
  const [orders, setOrders] = useState(() => read(LS.ORDERS, []));

  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => { write(LS.PRODUCTS, products); }, [products]);
  useEffect(() => { write(LS.CASHIERS, cashiers); }, [cashiers]);
  useEffect(() => { write(LS.ORDERS, orders); }, [orders]);

  const stats = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayOrders = orders.filter(o => o.createdAt >= start);
    const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const itemsSold = todayOrders.reduce((s, o) => s + o.items.reduce((a,i)=>a+i.qty,0), 0);
    const lowStock = products.filter(p => p.stock <= 5).length;
    return { revenue, orders: todayOrders.length, itemsSold, lowStock };
  }, [orders, products]);

  const filteredProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => [p.name,p.sku,p.barcode,p.category].some(x => (x||'').toLowerCase().includes(q)));
  }, [products, filter]);

  const resetForm = () => setEditing(null);

  const handleSave = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const item = {
      id: editing?.id || crypto.randomUUID(),
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      price: parseFloat(data.price||'0'),
      stock: parseInt(data.stock||'0'),
      category: data.category||'',
    };
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? item : p));
    } else {
      setProducts(prev => [item, ...prev]);
    }
    resetForm();
  };

  const removeProduct = (id) => {
    if (!confirm('Delete this product?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    if (editing?.id === id) resetForm();
  };

  const addCashier = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const username = data.c_username;
    const password = data.c_password;
    const name = data.c_name;
    if (!username || !password || !name) return;
    if (cashiers.some(c => c.username === username)) {
      alert('Username already exists');
      return;
    }
    const newC = { id: crypto.randomUUID(), username, password, name, createdAt: Date.now() };
    setCashiers(prev => [newC, ...prev]);
    e.currentTarget.reset();
  };

  const resetCashierPassword = (id) => {
    const pwd = prompt('Set new password');
    if (!pwd) return;
    setCashiers(prev => prev.map(c => c.id === id ? { ...c, password: pwd } : c));
  };

  const removeCashier = (id) => {
    if (!confirm('Delete this cashier?')) return;
    setCashiers(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3 grid sm:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Today Revenue</div>
          <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Today Orders</div>
          <div className="text-2xl font-bold">{stats.orders}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Items Sold</div>
          <div className="text-2xl font-bold">{stats.itemsSold}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Low Stock</div>
          <div className="text-2xl font-bold">{stats.lowStock}</div>
        </div>
      </div>

      <section className="lg:col-span-2 bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Products</h3>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search by name, SKU, barcode or category" className="border rounded px-3 py-2 w-72" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <form onSubmit={handleSave} className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">{editing? 'Edit Product' : 'Add Product'}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input name="name" defaultValue={editing?.name||''} className="mt-1 w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <input name="category" defaultValue={editing?.category||''} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600">SKU</label>
                <input name="sku" defaultValue={editing?.sku||''} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Barcode</label>
                <input name="barcode" defaultValue={editing?.barcode||''} className="mt-1 w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Price</label>
                <input name="price" type="number" step="0.01" defaultValue={editing?.price||''} className="mt-1 w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">Stock</label>
                <input name="stock" type="number" defaultValue={editing?.stock||''} className="mt-1 w-full border rounded px-3 py-2" required />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded">{editing? 'Update' : 'Add'}</button>
              {editing && <button type="button" onClick={resetForm} className="px-4 py-2 rounded border">Cancel</button>}
            </div>
          </form>
          <div className="border rounded-lg divide-y">
            {filteredProducts.length === 0 && <div className="p-4 text-gray-500">No products</div>}
            {filteredProducts.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.category || 'Uncategorized'} • SKU {p.sku || '-'} • Barcode {p.barcode || '-'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">${p.price.toFixed(2)}</span>
                  <span className={`text-sm ${p.stock<=5?'text-red-600':'text-gray-600'}`}>Stock: {p.stock}</span>
                  <button onClick={()=>setEditing(p)} className="px-3 py-1.5 rounded border">Edit</button>
                  <button onClick={()=>removeProduct(p.id)} className="px-3 py-1.5 rounded border border-red-600 text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Cashiers</h3>
        <form onSubmit={addCashier} className="grid grid-cols-3 gap-2 mb-3">
          <input name="c_name" placeholder="Full name" className="border rounded px-3 py-2" />
          <input name="c_username" placeholder="Username" className="border rounded px-3 py-2" />
          <div className="flex gap-2">
            <input name="c_password" placeholder="Password" className="border rounded px-3 py-2 w-full" />
            <button className="px-3 py-2 rounded bg-blue-600 text-white whitespace-nowrap">Add</button>
          </div>
        </form>
        <div className="border rounded-lg divide-y">
          {cashiers.length === 0 && <div className="p-4 text-gray-500">No cashiers</div>}
          {cashiers.map(c => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.username} • created {new Date(c.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>resetCashierPassword(c.id)} className="px-3 py-1.5 rounded border">Reset Password</button>
                <button onClick={()=>removeCashier(c.id)} className="px-3 py-1.5 rounded border border-red-600 text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lg:col-span-3 bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Orders</h3>
          <div className="text-sm text-gray-600">Total: {orders.length}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Cashier</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4">Subtotal</th>
                <th className="py-2 pr-4">Tax</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td className="py-3 text-gray-500" colSpan={6}>No orders yet</td></tr>
              )}
              {[...orders].reverse().slice(0, 50).map(o => (
                <tr key={o.id} className="border-b">
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">{o.cashierName || o.cashierId}</td>
                  <td className="py-2 pr-4">{o.items.map(i=>`${i.name} x${i.qty}`).join(', ')}</td>
                  <td className="py-2 pr-4">${o.subtotal.toFixed(2)}</td>
                  <td className="py-2 pr-4">${o.tax.toFixed(2)}</td>
                  <td className="py-2 pr-4 font-medium">${o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
