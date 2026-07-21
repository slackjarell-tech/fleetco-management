import React, { useEffect, useState } from 'react';
import HeroSection from '@/components/home/HeroSection';
import ServicesSection from '@/components/home/ServicesSection';
import PricingSection from '@/components/home/PricingSection';
import YmsSection from '@/components/home/YmsSection';
import InquiryForm from '@/components/home/InquiryForm';
import FooterSection from '@/components/home/FooterSection';
import NavBar from '@/components/home/NavBar';
import AboutSection from '@/components/home/AboutSection';
import VideoPresentationSection from '@/components/home/VideoPresentationSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import DriverAppDownload from '@/components/shared/DriverAppDownload';

export default function Home() {
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('payment');
    const plan = params.get('plan');
    if (status === 'success') {
      setPaymentStatus({ type: 'success', plan });
    } else if (status === 'cancelled') {
      setPaymentStatus({ type: 'cancelled' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white font-body">
      <NavBar />
      {paymentStatus?.type === 'success' && (
        <div className="bg-green-600 text-white py-4 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-black text-lg">Payment successful — welcome to FleetCo{paymentStatus.plan ? ` (${paymentStatus.plan})` : ''}!</p>
            <p className="text-green-100 text-sm mt-2">
              Check your email for login credentials, then sign in to the Client Portal to add your first vehicle and invite drivers.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <a href="/login" className="bg-white text-green-800 font-bold px-5 py-2 rounded-lg text-sm hover:bg-green-50">
                Sign In to Portal
              </a>
              <a href="/manual" className="border border-green-200 text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-green-700">
                Read Getting Started Guide
              </a>
            </div>
          </div>
        </div>
      )}
      {paymentStatus?.type === 'cancelled' && (
        <div className="bg-yellow-500 text-white text-center py-3 px-4">
          Payment was cancelled. Feel free to try again or contact us for assistance.
        </div>
      )}
      <HeroSection />
      <VideoPresentationSection />
      <DriverAppDownload />
      <ServicesSection />
      <YmsSection />
      <PricingSection />
      <AboutSection />
      <TestimonialsSection />
      <InquiryForm />
      <FooterSection />
    </div>
  );
}