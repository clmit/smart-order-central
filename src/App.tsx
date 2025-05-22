
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
import NotFound from './pages/NotFound';

// Remove the CreateOrder API route from the main application routes
// as we'll now use the direct API approach

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
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
  );
}

export default App;
