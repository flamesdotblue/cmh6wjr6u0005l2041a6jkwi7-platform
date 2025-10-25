import React, { useEffect, useMemo, useState } from 'react';

const LS = {
  PRODUCTS: 'pos_products',
  ORDERS: 'pos_orders',
};

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export default function CashierPOS({ cashier }) {
  const TAX_RATE = 0.1; // 10%

  const [products, setProducts] = useState(() => read(LS.PRODUCTS, []));
  const [orders, setOrders] = useState(() => read(LS.ORDERS, []));
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => { write(LS.PRODUCTS, products); }, [products]);
  useEffect(() => { write(LS.ORDERS, orders); }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter(p => [p.name, p.sku, p.barcode, p.category].some(x => (x||'').toLowerCase().includes(q))).slice(0, 12);
  }, [products, query]);

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id===p.id ? { ...i, qty: Math.min(i.qty+1, p.stock) } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, stock: p.stock }];
    });
  };

  const addByBarcode = (e) => {
    e.preventDefault();
    const p = products.find(x => x.barcode === barcode.trim());
    if (p) addToCart(p);
    setBarcode('');
  };

  const updateQty = (id, qty) => {
    setCart(prev => prev.map(i => i.id===id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart]);

  const checkout = () => {
    if (cart.length === 0) return;
    // verify stock
    for (const item of cart) {
      const p = products.find(x => x.id === item.id);
      if (!p || p.stock < item.qty) {
        alert(`Insufficient stock for ${item.name}`);
        return;
      }
    }
    // decrement stock
    const newProducts = products.map(p => {
      const it = cart.find(i => i.id === p.id);
      if (!it) return p;
      return { ...p, stock: p.stock - it.qty };
    });
    setProducts(newProducts);

    const order = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      cashierId: cashier?.cashierId,
      cashierName: cashier?.name || cashier?.username,
    };
    setOrders(prev => [...prev, order]);
    setCart([]);
    alert('Payment successful. Order saved.');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 bg-white border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Search products by name, SKU, barcode..." />
          <form onSubmit={addByBarcode} className="flex items-center gap-2">
            <input value={barcode} onChange={e=>setBarcode(e.target.value)} className="border rounded px-3 py-2 w-40" placeholder="Scan barcode" />
            <button className="px-3 py-2 rounded bg-gray-900 text-white">Add</button>
          </form>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <button key={p.id} onClick={()=>addToCart(p)} className="border rounded-lg p-3 text-left hover:shadow bg-white">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.category || 'General'} • SKU {p.sku || '-'} • Barcode {p.barcode || '-'}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm">${p.price.toFixed(2)}</span>
                <span className={`text-xs ${p.stock<=5?'text-red-600':'text-gray-600'}`}>Stock: {p.stock}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-5 flex flex-col">
        <h3 className="font-semibold mb-3">Cart</h3>
        <div className="flex-1 border rounded-lg divide-y overflow-auto">
          {cart.length === 0 && <div className="p-4 text-gray-500">Cart is empty</div>}
          {cart.map(item => (
            <div key={item.id} className="p-3 grid grid-cols-6 gap-2 items-center">
              <div className="col-span-3">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <button onClick={()=>updateQty(item.id, item.qty-1)} className="px-2 py-1 border rounded">-</button>
                <input value={item.qty} onChange={e=>updateQty(item.id, parseInt(e.target.value||'1'))} className="w-14 border rounded px-2 py-1 text-center" type="number" min="1" max={item.stock} />
                <button onClick={()=>updateQty(item.id, item.qty+1)} className="px-2 py-1 border rounded">+</button>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">${(item.price*item.qty).toFixed(2)}</div>
                <button onClick={()=>removeItem(item.id)} className="text-xs text-red-600">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Tax (10%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-semibold mt-2">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
          <button onClick={checkout} className="mt-3 w-full bg-blue-600 text-white py-2 rounded">Charge ${totals.total.toFixed(2)}</button>
        </div>
      </section>
    </div>
  );
}
