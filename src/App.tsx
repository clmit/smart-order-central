
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import Layout from './components/Layout';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderCreate from './pages/OrderCreate';
import Messaging from './pages/Messaging';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Index />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/new" element={<OrderCreate />} />
            <Route path="messaging" element={<Messaging />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
