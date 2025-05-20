'use client';
import React from 'react';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function HeaderSection({ title, subtitle, className = '' }: HeaderSectionProps) {
  return (
    <header className={`mb-6 ${className}`}>
      <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-md text-gray-600 mt-1">{subtitle}</p>}
    </header>
  );
}
