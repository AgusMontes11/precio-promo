import * as React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border bg-white shadow-sm p-4 ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return <div className={className} {...props} />;
}
