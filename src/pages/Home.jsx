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
        <div className="bg-green-600 text-white text-center py-3 px-4">
          🎉 Payment successful! Welcome to the {paymentStatus.plan} plan. We'll be in touch shortly.
        </div>
      )}
      {paymentStatus?.type === 'cancelled' && (
        <div className="bg-yellow-500 text-white text-center py-3 px-4">
          Payment was cancelled. Feel free to try again or contact us for assistance.
        </div>
      )}
      <HeroSection />
      <VideoPresentationSection />
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