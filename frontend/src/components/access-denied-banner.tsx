"use client";

import { useEffect, useState } from "react";
import { consumeAccessDeniedMessage } from "../lib/roles";

export function AccessDeniedBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(consumeAccessDeniedMessage());
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="mx-auto mb-4 w-full max-w-6xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700"
    >
      {message}
    </div>
  );
}
