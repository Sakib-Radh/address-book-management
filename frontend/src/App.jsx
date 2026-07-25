import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AddressBookList from './pages/AddressBookList';
import AddressBookForm from './pages/AddressBookForm';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/address-book" replace />} />
                <Route path="/address-book" element={<AddressBookList />} />
                <Route path="/address-book/create" element={<AddressBookForm />} />
                <Route path="/address-book/edit/:id" element={<AddressBookForm />} />
                <Route path="*" element={<Navigate to="/address-book" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
