import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getViewAsCustomerId, setViewAsCustomerId, clearViewAsCustomerId } from '@/api/apiClient';

const CustomerContext = createContext(null);

export function CustomerProvider({ user, children }) {
  const [viewAsCustomerId, setViewAsCustomerIdState] = useState(() => getViewAsCustomerId());
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const isInternal = ['owner', 'executive', 'fleet_manager', 'fleet_coordinator'].includes(user?.role);

  useEffect(() => {
    if (!isInternal) {
      setCustomers([]);
      clearViewAsCustomerId();
      setViewAsCustomerIdState(null);
      return;
    }

    setLoadingCustomers(true);
    api.customerView.options()
      .then((list) => setCustomers(Array.isArray(list) ? list : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));
  }, [isInternal, user?.id]);

  const viewAsCustomer = useMemo(
    () => customers.find((c) => c.id === viewAsCustomerId) || null,
    [customers, viewAsCustomerId],
  );

  const selectCustomer = useCallback((customerId) => {
    if (!customerId) {
      clearViewAsCustomerId();
      setViewAsCustomerIdState(null);
      return;
    }
    setViewAsCustomerId(customerId);
    setViewAsCustomerIdState(customerId);
  }, []);

  const clearCustomerView = useCallback(() => {
    clearViewAsCustomerId();
    setViewAsCustomerIdState(null);
  }, []);

  const effectiveCustomerId = user?.customer_id || (isInternal ? viewAsCustomerId : null);
  const isViewingAsCustomer = isInternal && !!viewAsCustomerId;

  const value = useMemo(() => ({
    customers,
    loadingCustomers,
    viewAsCustomerId,
    viewAsCustomer,
    selectCustomer,
    clearCustomerView,
    effectiveCustomerId,
    isViewingAsCustomer,
    isInternal,
  }), [
    customers,
    loadingCustomers,
    viewAsCustomerId,
    viewAsCustomer,
    selectCustomer,
    clearCustomerView,
    effectiveCustomerId,
    isViewingAsCustomer,
    isInternal,
  ]);

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomerContext() {
  const ctx = useContext(CustomerContext);
  if (!ctx) {
    return {
      customers: [],
      loadingCustomers: false,
      viewAsCustomerId: null,
      viewAsCustomer: null,
      selectCustomer: () => {},
      clearCustomerView: () => {},
      effectiveCustomerId: null,
      isViewingAsCustomer: false,
      isInternal: false,
    };
  }
  return ctx;
}
