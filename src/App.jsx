import React, { useEffect, useMemo, useState } from 'react';
import HeroCover from './components/HeroCover';
import AuthPanel from './components/AuthPanel';
import AdminDashboard from './components/AdminDashboard';
import CashierPOS from './components/CashierPOS';

const LS_KEYS = {
  SESSION: 'pos_session',
  PRODUCTS: 'pos_products',
  CASHIERS: 'pos_cashiers',
  ORDERS: 'pos_orders',
};

function initData() {
  // Seed only once
  const hasSeed = localStorage.getItem('pos_seeded');
  if (hasSeed) return;

  const defaultProducts = [
    { id: crypto.randomUUID(), name: 'Visa Gift Card $25', sku: 'VISA25', barcode: '10001', price: 25, stock: 100, category: 'Gift Cards' },
    { id: crypto.randomUUID(), name: 'Visa Gift Card $50', sku: 'VISA50', barcode: '10002', price: 50, stock: 80, category: 'Gift Cards' },
    { id: crypto.randomUUID(), name: 'USB-C Cable 1m', sku: 'CAB-USB-C-1M', barcode: '20001', price: 9.99, stock: 50, category: 'Accessories' },
    { id: crypto.randomUUID(), name: 'Wireless Mouse', sku: 'MOU-WLS', barcode: '30001', price: 19.99, stock: 30, category: 'Peripherals' },
  ];

  const defaultCashiers = [
    { id: crypto.randomUUID(), username: 'cashier1', password: 'pass123', name: 'Cashier One', createdAt: Date.now() },
  ];

  localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
  localStorage.setItem(LS_KEYS.CASHIERS, JSON.stringify(defaultCashiers));
  localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify([]));
  localStorage.setItem('pos_seeded', '1');
}

function getSession() {
  try {
    const s = localStorage.getItem(LS_KEYS.SESSION);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(LS_KEYS.SESSION);
}

export default function App() {
  const [session, setSessionState] = useState(getSession());
  const [route, setRoute] = useState('home');

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (session?.role === 'admin') setRoute('admin');
    else if (session?.role === 'cashier') setRoute('pos');
    else setRoute('home');
  }, [session]);

  const handleLogin = (payload) => {
    setSession(payload);
    setSessionState(payload);
  };

  const handleLogout = () => {
    clearSession();
    setSessionState(null);
    setRoute('home');
  };

  const header = useMemo(() => (
    <header className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-blue-600" />
          <span className="font-semibold tracking-tight">SwiftPOS</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <button onClick={() => setRoute('home')} className={`px-3 py-1.5 rounded ${route==='home'?'bg-gray-900 text-white':'hover:bg-gray-100'}`}>Home</button>
          <button onClick={() => setRoute('admin')} className={`px-3 py-1.5 rounded ${route==='admin'?'bg-gray-900 text-white':'hover:bg-gray-100'}`}>Admin</button>
          <button onClick={() => setRoute('pos')} className={`px-3 py-1.5 rounded ${route==='pos'?'bg-gray-900 text-white':'hover:bg-gray-100'}`}>POS</button>
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{session.role==='admin'?'Admin':session.username}</span>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded bg-red-600 text-white">Logout</button>
            </div>
          ) : (
            <span className="text-gray-500">Not signed in</span>
          )}
        </nav>
      </div>
    </header>
  ), [route, session]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      {header}

      {route === 'home' && (
        <>
          <div className="h-[60vh]">
            <HeroCover />
          </div>
          <section className="max-w-6xl mx-auto w-full px-4 -mt-20 relative z-10">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg border p-6">
                <h2 className="text-xl font-semibold mb-2">Welcome to SwiftPOS</h2>
                <p className="text-gray-600 mb-4">A modern, minimalist POS for retail and e-commerce. Manage products, staff, and sales with an elegant admin. Cashiers enjoy a fast, keyboard-first checkout.</p>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  <li>Admin: product and staff management, sales analytics</li>
                  <li>Cashier: barcode search, cart, taxes, receipt</li>
                  <li>Local-first: stored privately in your browser</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl shadow-lg border p-6">
                <AuthPanel onLogin={handleLogin} />
              </div>
            </div>
          </section>
        </>
      )}

      {route === 'admin' && (
        <main className="max-w-6xl mx-auto w-full px-4 py-6">
          {session?.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-semibold mb-2">Admin Login Required</h3>
              <AuthPanel onLogin={handleLogin} defaultTab="admin" />
            </div>
          )}
        </main>
      )}

      {route === 'pos' && (
        <main className="max-w-6xl mx-auto w-full px-4 py-6">
          {session?.role === 'cashier' ? (
            <CashierPOS cashier={session} />
          ) : (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-semibold mb-2">Cashier Login Required</h3>
              <AuthPanel onLogin={handleLogin} defaultTab="cashier" />
            </div>
          )}
        </main>
      )}

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-gray-600 flex items-center justify-between">
          <span>SwiftPOS © {new Date().getFullYear()}</span>
          <span>Admin: admin / admin123</span>
        </div>
      </footer>
    </div>
  );
}
