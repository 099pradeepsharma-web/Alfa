import React from 'react';
import '../styles/theme.css';

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="container">{children}</div>;
}
