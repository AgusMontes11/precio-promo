import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  return {
    toast,
    showToast: (msg) => setToast(msg),
    hideToast: () => setToast(null),
  };
}
