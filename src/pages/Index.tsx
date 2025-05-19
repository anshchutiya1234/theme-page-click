import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Partner with Arciuz
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Earn $1,000 per 10,000 high-quality clicks. No cap. Join our partner program and start earning today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/join">Join Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Why Partner With Us?</h2>
              <p className="mt-4 text-xl text-gray-600">
                We offer the most competitive rates and the best support in the industry
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3">High Earnings</h3>
                <p className="text-gray-600">
                  Earn $1,000 for every 10,000 clicks. No hidden fees or caps on your earnings.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3">Real-Time Tracking</h3>
                <p className="text-gray-600">
                  Monitor your clicks and earnings in real-time through our dashboard.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3">Fast Payouts</h3>
                <p className="text-gray-600">
                  Get paid quickly through PayPal, bank transfer, or cryptocurrency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-partner-purple text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Earning?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join our partner program today and start earning from your traffic.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/join">Get Started</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
