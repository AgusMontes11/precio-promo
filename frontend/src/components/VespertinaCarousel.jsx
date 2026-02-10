import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../pages/css/matinalPage.css";

export default function VespertinaCarousel({
  actions = [],
  salesStatus = {},
  onToggleSale,
  clientQuery = "",
}) {
  const [open, setOpen] = useState(() => new Set());
  const [pending, setPending] = useState(() => new Set());

  const clients = useMemo(() => {
    const map = new Map();

    actions.forEach((action) => {
      (action.clients || []).forEach((client, index) => {
        const code = client.codigo_pdv || `no-code-${action.name}-${index}`;

        if (!map.has(code)) {
          map.set(code, {
            codigo_pdv: client.codigo_pdv || "",
            razon_social: client.razon_social || "",
            actions: [],
          });
        }

        map.get(code).actions.push({
          name: action.name,
          frecuencia_raw: client.frecuencia_raw,
        });
      });
    });

    const list = Array.from(map.values()).sort((a, b) => {
      return (a.razon_social || "").localeCompare(b.razon_social || "");
    });

    const query = clientQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((client) => {
      const name = (client.razon_social || "").toLowerCase();
      const code = String(client.codigo_pdv || "").toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [actions, clientQuery]);

  function toggle(key) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setPendingState(key, isBusy) {
    setPending((prev) => {
      const next = new Set(prev);
      if (isBusy) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  if (!clients.length) {
    return <p className="matinal-empty">No hay clientes para mostrar</p>;
  }

  return (
    <div className="matinal-grid">
      {clients.map((client, index) => {
        const key = client.codigo_pdv || `${client.razon_social}-${index}`;
        const isOpen = open.has(key);

        return (
          <motion.div
            key={key}
            className="matinal-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            whileHover={{ y: -4 }}
          >
            <motion.button
              className="matinal-card-header"
              onClick={() => toggle(key)}
              whileTap={{ scale: 0.98 }}
            >
              <span className="matinal-card-title">
                {client.razon_social || "Cliente sin nombre"}
              </span>
              <span className="matinal-card-count">
                {client.actions.length}
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
                  <div className="matinal-client">
                    <div className="matinal-client-row">
                      <div className="matinal-client-main">
                        <span className="matinal-client-code">
                          {client.codigo_pdv || "-"}
                        </span>
                        <span className="matinal-client-name">
                          {client.razon_social || "Cliente sin nombre"}
                        </span>
                      </div>
                    </div>

                    <div className="matinal-action-list">
                      {client.actions.map((action, actionIndex) => {
                        const statusKey = `${client.codigo_pdv}__${action.name}`;
                        const pendingKey = `${statusKey}__${actionIndex}`;

                        return (
                          <div
                            key={`${action.name}-${actionIndex}`}
                            className="matinal-action-item"
                          >
                            <div className="matinal-action-row">
                              <span className="matinal-action-name">
                                {action.name}
                              </span>
                              <label className="matinal-client-check">
                                <input
                                  type="checkbox"
                                  checked={Boolean(salesStatus[statusKey])}
                                  disabled={
                                    pending.has(pendingKey) ||
                                    !onToggleSale ||
                                    !client.codigo_pdv
                                  }
                                  onChange={async (event) => {
                                    if (!onToggleSale || !client.codigo_pdv) {
                                      return;
                                    }
                                    setPendingState(pendingKey, true);
                                    try {
                                      await onToggleSale({
                                        codigo_pdv: client.codigo_pdv,
                                        accion: action.name,
                                        sold: event.target.checked,
                                      });
                                    } finally {
                                      setPendingState(pendingKey, false);
                                    }
                                  }}
                                />
                                <span>Vendido</span>
                              </label>
                            </div>
                            {action.frecuencia_raw && (
                              <span className="matinal-action-meta">
                                Frecuencia: {action.frecuencia_raw}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
