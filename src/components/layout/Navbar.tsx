
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const location = useLocation();
  const isPublicPage = location.pathname === '/join' || location.pathname === '/login';

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">ClickFlow</span>
          <span className="text-sm font-medium">Partner Pulse</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {isPublicPage ? (
            <>
              {location.pathname === '/join' ? (
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              ) : (
                <Link to="/join">
                  <Button variant="outline">Join</Button>
                </Link>
              )}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
