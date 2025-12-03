export function Toaster({ toast }) {
  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        background: "#333",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "6px",
        zIndex: 9999,
      }}
    >
      {toast}
    </div>
  );
}
