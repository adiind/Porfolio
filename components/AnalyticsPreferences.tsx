import React, { useState } from 'react';
import { getAnalyticsPreference, setAnalyticsOptOut } from '../lib/analyticsPrivacy';

const AnalyticsPreferences: React.FC = () => {
  const [allowed, setAllowed] = useState(() => getAnalyticsPreference() === 'allowed');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextAllowed = event.target.checked;
    setAllowed(nextAllowed);
    setAnalyticsOptOut(!nextAllowed);
    window.location.reload();
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-5 text-left" data-openpanel-unmask>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 text-white/75 transition-colors hover:bg-white/[0.04] focus-within:ring-2 focus-within:ring-[#E5E55A]">
        <input
          type="checkbox"
          checked={allowed}
          onChange={handleChange}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#E5E55A]"
        />
        <span>
          <span className="block text-sm font-semibold text-white/90">Allow anonymous analytics</span>
          <span className="mt-1 block text-xs leading-relaxed text-white/60">
            Anonymous interaction analytics and privacy-masked session replay help improve this portfolio. Inputs and page text are masked in replay, and you can turn collection off here.
          </span>
        </span>
      </label>
    </div>
  );
};

export default AnalyticsPreferences;
