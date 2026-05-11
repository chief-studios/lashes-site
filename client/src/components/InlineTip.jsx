import React from 'react';

export default function InlineTip({ title, children, className = '' }) {
  return (
    <div className={`inline-tip ${className}`.trim()} role="note" aria-label={title}>
      {title ? <div className="inline-tip__title">{title}</div> : null}
      <div className="inline-tip__body">{children}</div>
    </div>
  );
}

