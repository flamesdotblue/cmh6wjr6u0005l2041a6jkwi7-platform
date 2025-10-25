import React, { useEffect, useState } from 'react';

const LS_KEYS = {
  SESSION: 'pos_session',
  CASHIERS: 'pos_cashiers',
};

function saveSession(s) { localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(s)); }

function readCashiers() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.CASHIERS) || '[]');
  } catch {
    return [];
  }
}

function writeCashiers(list) {
  localStorage.setItem(LS_KEYS.CASHIERS, JSON.stringify(list));
}

export default function AuthPanel({ onLogin, defaultTab = 'admin' }) {
  const [tab, setTab] = useState(defaultTab);

  // Admin credentials
  const ADMIN = { username: 'admin', password: 'admin123' };

  // Admin form
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('admin123');
  const [adminErr, setAdminErr] = useState('');

  // Cashier forms
  const [cUser, setCUser] = useState('');
  const [cPass, setCPass] = useState('');
  const [cName, setCName] = useState('');
  const [mode, setMode] = useState('login'); // or signup
  const [cErr, setCErr] = useState('');

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAdminErr('');
    if (adminUser === ADMIN.username && adminPass === ADMIN.password) {
      const s = { role: 'admin', username: adminUser, loggedAt: Date.now() };
      saveSession(s);
      onLogin?.(s);
    } else {
      setAdminErr('Invalid admin credentials');
    }
  };

  const handleCashierLogin = (e) => {
    e.preventDefault();
    setCErr('');
    const list = readCashiers();
    const match = list.find(u => u.username === cUser && u.password === cPass);
    if (match) {
      const s = { role: 'cashier', username: match.username, cashierId: match.id, name: match.name, loggedAt: Date.now() };
      saveSession(s);
      onLogin?.(s);
    } else {
      setCErr('Invalid username or password');
    }
  };

  const handleCashierSignup = (e) => {
    e.preventDefault();
    setCErr('');
    if (!cUser || !cPass || !cName) {
      setCErr('Please fill all fields');
      return;
    }
    const list = readCashiers();
    if (list.some(u => u.username === cUser)) {
      setCErr('Username already exists');
      return;
    }
    const newUser = { id: crypto.randomUUID(), username: cUser, password: cPass, name: cName, createdAt: Date.now() };
    const updated = [...list, newUser];
    writeCashiers(updated);
    setMode('login');
    setCErr('Account created. Please login.');
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className={`px-3 py-2 rounded border ${tab==='admin'?'bg-gray-900 text-white border-gray-900':'bg-white hover:bg-gray-50'}`} onClick={() => setTab('admin')}>Admin</button>
        <button className={`px-3 py-2 rounded border ${tab==='cashier'?'bg-gray-900 text-white border-gray-900':'bg-white hover:bg-gray-50'}`} onClick={() => setTab('cashier')}>Cashier</button>
      </div>

      {tab === 'admin' && (
        <form onSubmit={handleAdminLogin} className="space-y-3">
          <div>
            <label className="text-sm text-gray-700">Admin Username</label>
            <input value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="admin" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input value={adminPass} onChange={e=>setAdminPass(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" type="password" placeholder="••••••" />
          </div>
          {adminErr && <div className="text-red-600 text-sm">{adminErr}</div>}
          <button className="w-full bg-blue-600 text-white rounded py-2">Login as Admin</button>
          <p className="text-xs text-gray-500">Hint: admin / admin123</p>
        </form>
      )}

      {tab === 'cashier' && (
        <div>
          <div className="flex gap-2 mb-3">
            <button className={`px-3 py-1.5 rounded border ${mode==='login'?'bg-blue-600 text-white border-blue-600':'bg-white'}`} onClick={()=>setMode('login')}>Login</button>
            <button className={`px-3 py-1.5 rounded border ${mode==='signup'?'bg-blue-600 text-white border-blue-600':'bg-white'}`} onClick={()=>setMode('signup')}>Sign up</button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleCashierLogin} className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Username</label>
                <input value={cUser} onChange={e=>setCUser(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="cashier1" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Password</label>
                <input value={cPass} onChange={e=>setCPass(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" type="password" placeholder="••••••" />
              </div>
              {cErr && <div className="text-sm text-blue-700">{cErr}</div>}
              <button className="w-full bg-blue-600 text-white rounded py-2">Login</button>
            </form>
          ) : (
            <form onSubmit={handleCashierSignup} className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Full Name</label>
                <input value={cName} onChange={e=>setCName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Username</label>
                <input value={cUser} onChange={e=>setCUser(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="jane" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Password</label>
                <input value={cPass} onChange={e=>setCPass(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" type="password" placeholder="••••••" />
              </div>
              {cErr && <div className="text-sm text-blue-700">{cErr}</div>}
              <button className="w-full bg-blue-600 text-white rounded py-2">Create account</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
