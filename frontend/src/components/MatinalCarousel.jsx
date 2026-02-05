import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../pages/css/matinalPage.css";

export default function MatinalCarousel({ actions = [] }) {
  const [open, setOpen] = useState(() => new Set());

  const sorted = useMemo(() => {
    return [...actions].sort((a, b) => a.name.localeCompare(b.name));
  }, [actions]);

  function toggle(name) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (!sorted.length) {
    return <p className="matinal-empty">No hay acciones para mostrar</p>;
  }

  return (
    <div className="matinal-grid">
      {sorted.map((action) => {
        const isOpen = open.has(action.name);
        return (
          <motion.div
            key={action.name}
            className="matinal-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            whileHover={{ y: -4 }}
          >
            <motion.button
              className="matinal-card-header"
              onClick={() => toggle(action.name)}
              whileTap={{ scale: 0.98 }}
            >
              <span className="matinal-card-title">{action.name}</span>
              <span className="matinal-card-count">
                {action.clients.length}
              </span>
            </motion.button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className="matinal-card-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {action.clients.map((client, idx) => (
                    <motion.div
                      key={`${client.codigo_pdv}-${idx}`}
                      className="matinal-client"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="matinal-client-main">
                        <span className="matinal-client-code">
                          {client.codigo_pdv}
                        </span>
                        <span className="matinal-client-name">
                          {client.razon_social}
                        </span>
                      </div>
                      <div className="matinal-client-meta">
                        Frecuencia: {client.frecuencia_raw}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
