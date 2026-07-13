import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();

  return isAuthenticated ? (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-slate-800">DocuIntel AI</h1>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Dashboard</Link>
          <Link to="/documents" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Documents</Link>
          <Link to="/analytics" className="text-sm text-slate-600 hover:text-slate-900 font-medium">Analytics</Link>
          <button onClick={logout} className="text-sm text-red-500 font-medium hover:text-red-700">Logout</button>
        </div>
      </nav>
      <main className="p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  ) : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
      <Route path="/documents/:id" element={<PrivateRoute><DocumentDetail /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} /> 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;