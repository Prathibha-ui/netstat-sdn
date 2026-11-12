import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const DEVICE_1_MAC = 'AA:BB:CC:11:22:33'; // Registered / Primary Test Device
export const DEVICE_2_MAC = 'DD:EE:FF:44:55:66'; // Unauthorized / Secondary Test Device
export const DEVICE_3_MAC = '11:22:33:44:55:66'; // Replacement Test Device

export interface DemoFeedback {
  type: 'ALLOW' | 'DROP' | 'INFO';
  title: string;
  message: string;
  observedMac: string;
  registeredMac?: string;
  ruleInstalled?: string;
  timestamp: string;
}

interface DemoContextType {
  simulatedMac: string;
  setSimulatedMac: (mac: string) => void;
  resetDemoData: () => Promise<void>;
  isResetting: boolean;
  demoFeedback: DemoFeedback | null;
  setDemoFeedback: (feedback: DemoFeedback | null) => void;
  showDemoBar: boolean;
  setShowDemoBar: (show: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulatedMac, setSimulatedMacState] = useState<string>(() => {
    return localStorage.getItem('netstat_simulated_mac') || DEVICE_1_MAC;
  });
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [demoFeedback, setDemoFeedback] = useState<DemoFeedback | null>(null);
  const [showDemoBar, setShowDemoBar] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('netstat_simulated_mac', simulatedMac);
  }, [simulatedMac]);

  const setSimulatedMac = (mac: string) => {
    setSimulatedMacState(mac.trim().toUpperCase());
  };

  const resetDemoData = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      setSimulatedMacState(DEVICE_1_MAC);
      setDemoFeedback({
        type: 'INFO',
        title: 'Demo Environment Reset',
        message: 'Student 23CS001 device state cleared. Ready to demonstrate TEST 1 (First Connection Registration).',
        observedMac: DEVICE_1_MAC,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        simulatedMac,
        setSimulatedMac,
        resetDemoData,
        isResetting,
        demoFeedback,
        setDemoFeedback,
        showDemoBar,
        setShowDemoBar,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
