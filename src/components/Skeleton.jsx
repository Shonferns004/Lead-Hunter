import React from 'react';

function SkeletonBlock({ className = '' }) {
  return <div className={`bg-surface-container-high rounded animate-pulse ${className}`} />;
}

function SkeletonText({ lines = 1, lastWidth = 'w-3/4' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? lastWidth : 'w-full'}`} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#1d2026] border border-[#374151] rounded-xl px-3 py-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-3/5" />
          <SkeletonBlock className="h-3 w-4/5" />
        </div>
        <SkeletonBlock className="h-5 w-16 rounded-full shrink-0" />
      </div>
      <SkeletonBlock className="h-3 w-2/5" />
      <div className="flex gap-2 pt-1">
        <SkeletonBlock className="h-8 flex-1 rounded-lg" />
        <SkeletonBlock className="h-8 flex-1 rounded-lg" />
        <SkeletonBlock className="h-8 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonTableRow({ cols = 5 }) {
  return (
    <tr className="border-b border-[#374151]/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className={`h-4 ${i === 0 ? 'w-3/5' : i === cols - 1 ? 'w-2/5' : 'w-2/5'}`} />
        </td>
      ))}
    </tr>
  );
}

export { SkeletonBlock, SkeletonText, SkeletonCard, SkeletonTableRow };
