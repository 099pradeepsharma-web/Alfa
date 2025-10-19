import React, { useState } from 'react';

export const CustomizePortal = () => {
  const [theme, setTheme] = useState({
    logo_url: '',
    primary_color: '#2563EB',
    secondary_color: '#7C3AED',
    accent_color: '#10B981',
    font_family: 'Inter, system-ui',
    border_radius: '0.5rem',
  });
  const [livePreview, setLivePreview] = useState(true);

  // Apply CSS vars live
  React.useEffect(() => {
    if (!livePreview) return;
    Object.entries(theme).forEach(([k, v]) => {
      if (k.endsWith('_color')) document.documentElement.style.setProperty(`--${k.replace('_', '-')}`, v);
    });
    document.documentElement.style.setProperty('--font-family', theme.font_family);
    document.documentElement.style.setProperty('--border-radius', theme.border_radius);
  }, [theme, livePreview]);

  const handleUpdate = (k, v) => setTheme({ ...theme, [k]: v });

  return (
    <div className="bg-white rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Customize Portal Theme</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <label className="flex flex-col gap-1">
          Logo URL
          <input type="url" value={theme.logo_url} onChange={e => handleUpdate('logo_url', e.target.value)} className="border rounded p-2" />
        </label>
        <label className="flex flex-col gap-1">
          Primary Color
          <input type="color" value={theme.primary_color} onChange={e => handleUpdate('primary_color', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Secondary Color
          <input type="color" value={theme.secondary_color} onChange={e => handleUpdate('secondary_color', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Accent Color
          <input type="color" value={theme.accent_color} onChange={e => handleUpdate('accent_color', e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          Font Family
          <input value={theme.font_family} onChange={e => handleUpdate('font_family', e.target.value)} className="border rounded p-2" />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          Border Radius
          <input value={theme.border_radius} onChange={e => handleUpdate('border_radius', e.target.value)} className="border rounded p-2" />
        </label>
      </div>
      <div className="mb-8">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={livePreview} onChange={e => setLivePreview(e.target.checked)} />
          Live Preview
        </label>
      </div>
      <div className="rounded-lg p-8 border bg-gray-50" style={{
        background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color}`,
        fontFamily: theme.font_family,
        borderRadius: theme.border_radius
      }}>
        <img src={theme.logo_url || 'https://api.dicebear.com/7.x/initials/svg?seed=School'} className="h-16 mb-4 rounded" style={{ borderRadius: 'inherit' }} alt="Logo" />
        <h1 className="text-3xl font-bold !text-white mb-2" style={{ color: theme.accent_color }}>School Name</h1>
        <p style={{ color: theme.accent_color }}>Welcome to your personalized branded portal!</p>
      </div>
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-3">Custom Domain</h3>
        <div className="flex gap-3 items-center">
          <input placeholder="school.yourdomain.com" className="p-2 border rounded" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">Request Domain</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">DNS TXT record instructions will be shown after requesting. SSL/TLS auto-provisioned on verification.</p>
      </div>
    </div>
  );
};

export default CustomizePortal;
