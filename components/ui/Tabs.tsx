'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ defaultValue, children, className }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={cn("space-y-4", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

export const TabsList = ({ children, className, activeTab, setActiveTab }: any) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

export const TabsTrigger = ({ value, children, className, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      activeTab === value ? "bg-white text-slate-950 shadow-sm" : "hover:text-slate-950",
      className
    )}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children, className, activeTab }: any) => {
  if (activeTab !== value) return null;
  return (
    <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
};
