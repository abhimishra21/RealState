import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Auth from './pages/Auth';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreateListing from './pages/CreateListing';
import PropertyValuation from './pages/PropertyValuation';
import About from './pages/About';
import Contact from './pages/Contact';
import Projects from './pages/Projects';
import SingleListingPage from './pages/listings/[id]';
import ListingsPage from './pages/listings/index';
import NotFound from './pages/NotFound';
import PropertyList from './components/PropertyList';
import Marketplace from './pages/Marketplace';
import MarketplaceItem from './pages/MarketplaceItem';
import MarketplaceForm from './pages/MarketplaceForm';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300">
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          autoHideDuration={3000}
        >
          <div className="App">
            <Header />
            
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/auth" 
                  element={<Auth />}
                />

                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <PropertyList />
                  </ProtectedRoute>
                } />
                <Route path="/home" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/create-listing" element={
                  <ProtectedRoute>
                    <CreateListing />
                  </ProtectedRoute>
                } />
                <Route path="/property-valuation" element={
                  <ProtectedRoute>
                    <PropertyValuation />
                  </ProtectedRoute>
                } />
                <Route path="/about" element={
                  <ProtectedRoute>
                    <About />
                  </ProtectedRoute>
                } />
                <Route path="/contact" element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/listings/:id" element={
                  <ProtectedRoute>
                    <SingleListingPage />
                  </ProtectedRoute>
                } />
                <Route path="/listings" element={
                  <ProtectedRoute>
                    <ListingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/create" element={<MarketplaceForm />} />
                <Route path="/marketplace/:id" element={<MarketplaceItem />} />
                <Route path="/marketplace/edit/:id" element={<MarketplaceForm />} />
                <Route path="*" element={
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                } />
              </Routes>
            </AnimatePresence>
            
            <ThemeToggle />
          </div>
        </SnackbarProvider>
      </div>
    </ThemeProvider>
  );
}

export default App; 