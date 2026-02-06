import * as XLSX from "xlsx";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    /* =========================
       CORS
    ========================= */
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {

     /* =========================
       SUPABASE HEADERS
    ========================= */
    const sbHeaders = {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };

    /* =========================
       AUTH HELPERS
    ========================= */
    function parseToken(req) {
      const auth = req.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) return null;
      return auth.replace("Bearer ", "").trim();
    }

    function decodeDummyToken(token) {
      if (!token || !token.startsWith("dummy-")) return null;
      const parts = token.split("-");
      if (parts.length < 3) return null;
      return { id: parts[1] };
    }

    async function getUserById(id) {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/usuarios?id=eq.${id}&select=id,email,role,nombre_promotor`,
        { headers: sbHeaders }
      );
      const rows = await res.json();
      return rows?.[0] || null;
    }

    async function requireAuth(req) {
      const token = parseToken(req);
      const decoded = decodeDummyToken(token);
      if (!decoded) return null;
      return await getUserById(decoded.id);
    }

    function requireRole(user, allowed) {
      return user && allowed.includes(user.role);
    }

    /* =========================
       LOGIN
    ========================= */
    if (method === "POST" && path === "/auth/login") {
      const { email, password } = await req.json();

      const res = await fetch(
        `${
          env.SUPABASE_URL
        }/rest/v1/usuarios?select=id,email,password,role,nombre_promotor&email=eq.${encodeURIComponent(
          email
        )}&limit=1`,
        { headers: sbHeaders }
      );

      const rows = await res.json();
      const user = rows?.[0];

      if (!user || user.password !== password) {
        return new Response(
          JSON.stringify({ error: "Usuario o contraseña incorrectos" }),
          { status: 401, headers: corsHeaders }
        );
      }

      const token = `dummy-${user.id}-${Date.now()}`;

      return new Response(
        JSON.stringify({
          token,
          usuario: {
            id: user.id,
            email: user.email,
            role: user.role,
            nombre_promotor: user.nombre_promotor,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    /* =========================
       CNC HELPERS
    ========================= */
    function normalizeKey(key) {
      return key
        .toString()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // elimina acentos
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-z]/g, "");
    }

    const DAY_MAP = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
    const todayCode = DAY_MAP[new Date().getDay()];

    function getCurrentMonth() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    function normalizeDays(diaRaw) {
      if (!diaRaw) return [];

      return diaRaw
        .toString()
        .toUpperCase()
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    }

    function normalizeText(v) {
      return v?.toString().trim() || null;
    }

    function normalizePromotorName(value) {
      return value
        ?.toString()
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " ");
    }

    const PROMOTOR_ID_BY_NAME = {
      "FLORES JOSE": 1,
      "MUSRI DIEGO": 5,
      "SEVILLA FIORELLA": 4,
      "TORO FRANCO": 11,
      "ORTIZ PABLO": 23,
      "SANCHEZ RONALDO LUCAS PITON": 12,
      "RIOS MAXIMILIANO": 6,
      "MONTES GABRIEL": 10,
      "CAMARGO MOIRA": 25,
      "BARLOTTA MARTIN": 3,
      "FLORES JOAQUIN": 26,
      "VILLEGAS ALEJANDRO SEBASTIAN": 2,
      "ROJOS YUNES JUAN JOSE": 6392,
      "ANTIPAN JESUS JUAN ANTONIO": 9,
      "VILCHEZ MARIO": 7,
      "JUAN PAULO": 19,
    };

    function getPromotorIdByName(value) {
      const key = normalizePromotorName(value);
      const id = PROMOTOR_ID_BY_NAME[key];
      return typeof id === "number" ? id : null;
    }

    const MATINAL_ID_KEYS = ["idvend", "idvendedor", "idpromotor"];
    const MATINAL_FREQ_KEYS = ["frecuencia", "dia", "dias", "diasemana"];
    const MATINAL_CODIGO_KEYS = ["codigopdv", "codigo", "codpdv", "pdv"];
    const MATINAL_RAZON_KEYS = [
      "razonsocial",
      "razon",
      "cliente",
      "razonsoc",
    ];

    const DAY_ALIASES = {
      LU: "LUN",
      LUN: "LUN",
      MA: "MAR",
      MAR: "MAR",
      MI: "MIE",
      MIE: "MIE",
      JU: "JUE",
      JUE: "JUE",
      VI: "VIE",
      VIE: "VIE",
      SA: "SAB",
      SAB: "SAB",
      DO: "DOM",
      DOM: "DOM",
    };

    const COMBO_ALIASES = {
      LUJU: ["LUN", "JUE"],
      MAVI: ["MAR", "VIE"],
      MISA: ["MIE", "SAB"],
    };

    function normalizeFrequency(value) {
      if (!value) return [];

      const raw = value.toString().toUpperCase();
      const tokens = raw
        .split(/[,;/]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const days = [];

      tokens.forEach((token) => {
        const clean = token.replace(/[^A-Z]/g, "");
        if (!clean) return;

        if (COMBO_ALIASES[clean]) {
          days.push(...COMBO_ALIASES[clean]);
          return;
        }

        const matches = clean.match(
          /LU|LUN|MA|MAR|MI|MIE|JU|JUE|VI|VIE|SA|SAB|DO|DOM/g
        );

        if (matches?.length) {
          matches.forEach((m) => {
            const mapped = DAY_ALIASES[m];
            if (mapped) days.push(mapped);
          });
        }
      });

      return Array.from(new Set(days));
    }

    function rowHasValues(row = []) {
      return row.some((cell) => {
        const value = cell?.toString?.().trim?.() ?? "";
        return value !== "";
      });
    }

    function findMatinalHeaderRow(raw = []) {
      return raw.findIndex((row) => {
        const normalized = row.map((cell) => normalizeKey(cell || ""));
        const hasId = normalized.some((k) => MATINAL_ID_KEYS.includes(k));
        const hasFreq = normalized.some((k) => MATINAL_FREQ_KEYS.includes(k));
        const hasCodigo = normalized.some((k) =>
          MATINAL_CODIGO_KEYS.includes(k)
        );
        const hasRazon = normalized.some((k) => MATINAL_RAZON_KEYS.includes(k));

        return hasId && hasFreq && hasCodigo && hasRazon;
      });
    }

    /* =========================
       CNC UPLOADS
    ========================= */
    if (method === "POST" && path === "/cnc/upload") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin"])) {
        return new Response(JSON.stringify({ error: "Solo admin" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const formData = await req.formData();
      const file = formData.get("file");

      if (!file) {
        return new Response(JSON.stringify({ error: "Archivo requerido" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const uploadedMonth = getCurrentMonth();
      const inserts = [];

      workbook.SheetNames.forEach((sheetName) => {
        if (!sheetName.toUpperCase().startsWith("CNC")) return;

        const sheet = workbook.Sheets[sheetName];

        // 1️⃣ Leer como matriz
        const raw = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        // 2️⃣ Buscar fila de headers reales
        const headerRowIndex = raw.findIndex((row) =>
          row.some(
            (cell) =>
              typeof cell === "string" && normalizeKey(cell) === "codigo"
          )
        );

        if (headerRowIndex === -1) return;

        // 3️⃣ Normalizar headers
        const headers = raw[headerRowIndex].map(normalizeKey);

        // 4️⃣ Procesar filas reales
        raw.slice(headerRowIndex + 1).forEach((row) => {
          const normalized = {};

          headers.forEach((h, i) => {
            normalized[h] = row[i] ?? "";
          });

          const dia = normalized.dia || normalized.dias || normalized.diasemana;

          if (
            !normalized.codigo ||
            !normalized.cliente ||
            !normalized.promotor ||
            !dia
          )
            return;

          inserts.push({
            sheet_name: sheetName,
            uploaded_month: uploadedMonth,

            codigo: normalizeText(normalized.codigo),
            cliente: normalizeText(normalized.cliente),
            canal: normalizeText(normalized.canalagrup),
            subregion: normalizeText(normalized.salessubregiondesc),
            distribuidor: normalizeText(normalized.descdistridirecta),

            promotor_nombre: normalizeText(normalized.promotor),
            dias: normalizeDays(dia),
          });
        });
      });

      if (inserts.length === 0) {
        return new Response(
          JSON.stringify({ error: "No se encontraron CNC válidos" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 🔥 NUEVO: borrar CNC del mes antes de insertar
      const deleteRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/cnc_records?uploaded_month=eq.${uploadedMonth}`,
        {
          method: "DELETE",
          headers: sbHeaders,
        }
      );

      if (!deleteRes.ok) {
        const err = await deleteRes.text();
        return new Response(
          JSON.stringify({
            error: "Error limpiando CNC del mes",
            detail: err,
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      // ✅ Insertar datos nuevos
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/cnc_records`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "return=minimal" },
        body: JSON.stringify(inserts),
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({ error: "Error guardando CNC", detail: err }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          uploadedMonth,
          rowsInserted: inserts.length,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    /* =========================
    CNC DATA (DESDE SUPABASE)
    ========================= */
    if (method === "GET" && path === "/cnc/data") {
      const user = await requireAuth(req);
      if (!user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const sheet = url.searchParams.get("sheet");
      if (!sheet) {
        return new Response(
          JSON.stringify({ error: "Falta parámetro sheet" }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      const todayCode = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"][
        new Date().getDay()
      ];
      const month = getCurrentMonth();

      let query =
        `${env.SUPABASE_URL}/rest/v1/cnc_records` +
        `?sheet_name=eq.${encodeURIComponent(sheet)}` +
        `&uploaded_month=eq.${month}`;

      // Promotor solo ve lo suyo
      if (user.role !== "admin") {
        query += `&promotor_nombre=eq.${encodeURIComponent(
          user.nombre_promotor
        )}`;
      }

      const res = await fetch(query, { headers: sbHeaders });
      const rows = await res.json();

      const filtered = rows.filter(
        (r) => Array.isArray(r.dias) && r.dias.includes(todayCode)
      );

      return new Response(
        JSON.stringify({
          sheet,
          dia: todayCode,
          total: filtered.length,
          cnc: filtered,
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    /* =========================
       MATINAL UPLOAD
    ========================= */
    if (method === "POST" && path === "/matinal/upload") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin"])) {
        return new Response(JSON.stringify({ error: "Solo admin" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const formData = await req.formData();
      const file = formData.get("file");

      if (!file) {
        return new Response(JSON.stringify({ error: "Archivo requerido" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const uploadedMonth = getCurrentMonth();
      const inserts = [];

      const matinalSheetName = workbook.SheetNames.find(
        (name) => name.toUpperCase() === "MATINAL"
      );

      if (!matinalSheetName) {
        return new Response(
          JSON.stringify({ error: "No se encontró la hoja MATINAL" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const sheet = workbook.Sheets[matinalSheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      const headerRowIndex = findMatinalHeaderRow(raw);
      if (headerRowIndex === -1) {
        return new Response(
          JSON.stringify({ error: "No se detectaron headers válidos" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const headersOriginal = raw[headerRowIndex].map((h) =>
        h?.toString?.().trim?.()
      );
      const normalizedHeaders = headersOriginal.map((h) =>
        normalizeKey(h || "")
      );

      const idIndex = normalizedHeaders.findIndex((h) =>
        MATINAL_ID_KEYS.includes(h)
      );
      const freqIndex = normalizedHeaders.findIndex((h) =>
        MATINAL_FREQ_KEYS.includes(h)
      );
      const codigoIndex = normalizedHeaders.findIndex((h) =>
        MATINAL_CODIGO_KEYS.includes(h)
      );
      const razonIndex = normalizedHeaders.findIndex((h) =>
        MATINAL_RAZON_KEYS.includes(h)
      );

      raw.slice(headerRowIndex + 1).forEach((row) => {
        if (!rowHasValues(row)) return;

        const idVendRaw = idIndex >= 0 ? row[idIndex] : null;
        const freqRaw = freqIndex >= 0 ? row[freqIndex] : null;
        const codigoRaw = codigoIndex >= 0 ? row[codigoIndex] : null;
        const razonRaw = razonIndex >= 0 ? row[razonIndex] : null;

        if (!idVendRaw || !freqRaw || !codigoRaw || !razonRaw) return;

        const promotorId = Number(idVendRaw);
        if (Number.isNaN(promotorId)) return;

        const dias = normalizeFrequency(freqRaw);
        if (!dias.length) return;

        const actions = [];
        headersOriginal.forEach((header, index) => {
          const normalized = normalizedHeaders[index];
          if (!header || !normalized) return;

          if (
            MATINAL_ID_KEYS.includes(normalized) ||
            MATINAL_FREQ_KEYS.includes(normalized) ||
            MATINAL_CODIGO_KEYS.includes(normalized) ||
            MATINAL_RAZON_KEYS.includes(normalized)
          ) {
            return;
          }

          const cell = row?.[index];
          const mark = cell?.toString?.().trim?.().toUpperCase?.() || "";
          if (mark === "X") {
            actions.push(header);
          }
        });

        if (!actions.length) return;

        actions.forEach((actionName) => {
          inserts.push({
            sheet_name: matinalSheetName,
            uploaded_month: uploadedMonth,
            promotor_id: promotorId,
            frecuencia_raw: normalizeText(freqRaw),
            dias,
            codigo_pdv: normalizeText(codigoRaw),
            razon_social: normalizeText(razonRaw),
            action_name: actionName?.toString?.().trim?.() || null,
          });
        });
      });

      if (inserts.length === 0) {
        return new Response(
          JSON.stringify({ error: "No se encontraron filas válidas" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const deleteRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/matinal_records?uploaded_month=eq.${uploadedMonth}`,
        {
          method: "DELETE",
          headers: sbHeaders,
        }
      );

      if (!deleteRes.ok) {
        const err = await deleteRes.text();
        return new Response(
          JSON.stringify({
            error: "Error limpiando Matinal del mes",
            detail: err,
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/matinal_records`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "return=minimal" },
        body: JSON.stringify(inserts),
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({ error: "Error guardando Matinal", detail: err }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          uploadedMonth,
          rowsInserted: inserts.length,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    /* =========================
       MATINAL DATA
    ========================= */
    if (method === "GET" && path === "/matinal/data") {
      const user = await requireAuth(req);
      if (!user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const month = getCurrentMonth();
      const today = todayCode;

      let promotorId = null;

      if (user.role !== "admin") {
        promotorId = getPromotorIdByName(user.nombre_promotor);
        if (!promotorId) {
          return new Response(
            JSON.stringify({ error: "Promotor sin ID asociado" }),
            { status: 403, headers: corsHeaders }
          );
        }
      } else {
        const requested = url.searchParams.get("promotorId");
        promotorId = requested ? Number(requested) : null;
      }

      let query =
        `${env.SUPABASE_URL}/rest/v1/matinal_records` +
        `?uploaded_month=eq.${month}`;

      if (promotorId) {
        query += `&promotor_id=eq.${promotorId}`;
      }

      const res = await fetch(query, { headers: sbHeaders });
      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({
            error: "Error consultando Matinal",
            detail: err,
          }),
          {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const rows = await res.json();
      if (!Array.isArray(rows)) {
        return new Response(
          JSON.stringify({
            error: "Respuesta inválida de Matinal",
            detail: rows,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const filtered = rows.filter(
        (r) => Array.isArray(r.dias) && r.dias.includes(today)
      );

      const grouped = {};
      filtered.forEach((row) => {
        const actionName = row.action_name || "Sin acción";
        if (!grouped[actionName]) grouped[actionName] = [];
        grouped[actionName].push({
          codigo_pdv: row.codigo_pdv,
          razon_social: row.razon_social,
          promotor_id: row.promotor_id,
          frecuencia_raw: row.frecuencia_raw,
          dias: row.dias,
        });
      });

      const actions = Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ name, clients: grouped[name] }));

      return new Response(
        JSON.stringify({
          dia: today,
          total: filtered.length,
          actions,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    /* =========================
       MATINAL SALES STATUS
    ========================= */
    if (method === "GET" && path === "/matinal/sales-status") {
      const user = await requireAuth(req);
      if (!user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/matinal_sales_status` +
          `?user_id=eq.${user.id}&select=codigo_pdv,sold`,
        { headers: sbHeaders }
      );

      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({
            error: "Error consultando estado de ventas",
            detail: err,
          }),
          {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const rows = await res.json();
      return new Response(JSON.stringify({ items: rows || [] }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (
      (method === "POST" || method === "PUT") &&
      path === "/matinal/sales-status"
    ) {
      const user = await requireAuth(req);
      if (!user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const body = await req.json().catch(() => ({}));
      const codigo = normalizeText(body.codigo_pdv);
      const sold = body.sold;

      if (!codigo || typeof sold !== "boolean") {
        return new Response(
          JSON.stringify({ error: "Datos invalidos" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const payload = {
        user_id: user.id,
        codigo_pdv: codigo,
        sold,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/matinal_sales_status` +
          `?on_conflict=user_id,codigo_pdv`,
        {
          method: "POST",
          headers: {
            ...sbHeaders,
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({ error: "Error guardando estado", detail: err }),
          {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const rows = await res.json().catch(() => []);
      return new Response(
        JSON.stringify({ success: true, item: rows?.[0] || payload }),
        { status: 200, headers: corsHeaders }
      );
    }

     /* =========================
       CNC FROM GOOGLE SHEETS
    ========================= */
    if (method === "GET" && path === "/cnc") {
      try {
        const sheetId = env.GOOGLE_SHEET_ID;
        const apiKey = env.GOOGLE_API_KEY;
        const sheetName = url.searchParams.get("sheet");

        if (!sheetName) {
          return new Response(
            JSON.stringify({ error: "Falta parámetro sheet" }),
            { status: 400, headers: corsHeaders }
          );
        }

        const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
          sheetName
        )}?key=${apiKey}`;

        const res = await fetch(sheetUrl);
        const data = await res.json();

        if (!data.values) {
          return new Response(JSON.stringify({ error: "Hoja sin datos" }), {
            status: 404,
            headers: corsHeaders,
          });
        }

        const rows = data.values;

        const headerIndex = rows.findIndex((row) =>
          row.some(
            (c) => typeof c === "string" && c.trim().toLowerCase() === "codigo"
          )
        );

        if (headerIndex === -1) {
          return new Response(
            JSON.stringify({ error: "Headers no encontrados" }),
            { status: 500, headers: corsHeaders }
          );
        }

        const headers = rows[headerIndex].map((h) =>
          h.toString().toLowerCase().trim().replace(/\s+/g, "")
        );

        const idx = {
          codigo: headers.indexOf("codigo"),
          cliente: headers.indexOf("cliente"),
          promotor: headers.indexOf("promotor"),
          dia: headers.indexOf("dia"),
        };

        const cnc = rows
          .slice(headerIndex + 1)
          .map((r) => {
            if (
              !r[idx.codigo] ||
              !r[idx.cliente] ||
              !r[idx.promotor] ||
              !r[idx.dia]
            )
              return null;

            const dias = normalizeDays(r[idx.dia]);
            if (!dias.includes(todayCode)) return null;

            return {
              codigo: r[idx.codigo],
              cliente: r[idx.cliente],
              promotor: r[idx.promotor],
              dias,
            };
          })
          .filter(Boolean);

        return new Response(
          JSON.stringify({
            dia: todayCode,
            total: cnc.length,
            cnc,
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Error CNC", details: err.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    /* =========================
       RANKING (GOOGLE SHEETS)
    ========================= */
    if (method === "GET" && path === "/ranking") {
      try {
        const sheetId = env.GOOGLE_SHEET_ID;
        const apiKey = env.GOOGLE_API_KEY;
        const sheetName = url.searchParams.get("sheet") || "RankingUng";

        const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;

        const pRes = await fetch(`${base}/${sheetName}!A1:F17?key=${apiKey}`);
        const sRes = await fetch(`${base}/${sheetName}!A19:F21?key=${apiKey}`);

        const pJson = await pRes.json();
        const sJson = await sRes.json();

        const parse = (values, rol) => {
          const [h, ...rows] = values;
          return rows.map((r) => {
            const o = {};
            h.forEach((c, i) => {
              o[c.toLowerCase().replace(/\s+/g, "")] = r[i];
            });
            return { ...o, rol };
          });
        };

        return new Response(
          JSON.stringify({
            promotores: parse(pJson.values, "promotor"),
            supervisores: parse(sJson.values, "supervisor"),
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: "Error ranking" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // =========================
    // PRODUCTS
    // =========================

    // PUBLIC GET ALL
    if (method === "GET" && path === "/products") {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/products?select=*`, {
        headers: sbHeaders,
      });

      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUBLIC GET BY ID
    if (method === "GET" && path.startsWith("/products/")) {
      const id = path.split("/")[2];

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`,
        { headers: sbHeaders }
      );

      const rows = await res.json();

      return new Response(JSON.stringify(rows?.[0] || null), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE PRODUCT (admin ONLY)
    if (method === "POST" && path === "/products") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin"])) {
        return new Response(
          JSON.stringify({ error: "Solo admin puede crear productos" }),
          {
            status: 403,
            headers: corsHeaders,
          }
        );
      }

      const body = await req.json();

      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/products`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "return=representation" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE (admin ONLY)
    if (method === "PUT" && path.startsWith("/products/")) {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin"])) {
        return new Response(
          JSON.stringify({ error: "Solo admin puede editar" }),
          {
            status: 403,
            headers: corsHeaders,
          }
        );
      }

      const id = path.split("/")[2];
      const body = await req.json();

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
        {
          method: "PATCH",
          headers: { ...sbHeaders, Prefer: "return=representation" },
          body: JSON.stringify(body),
        }
      );

      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE (admin ONLY)
    if (method === "DELETE" && path.startsWith("/products/")) {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin"])) {
        return new Response(
          JSON.stringify({ error: "Solo admin puede borrar" }),
          {
            status: 403,
            headers: corsHeaders,
          }
        );
      }

      const id = path.split("/")[2];

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
        {
          method: "DELETE",
          headers: { ...sbHeaders, Prefer: "return=representation" },
        }
      );

      return new Response(JSON.stringify({ deleted: res.ok }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================
    // STATS
    // =========================

    // PUBLIC: total products
    if (method === "GET" && path === "/stats/products") {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?select=id`,
        { headers: sbHeaders }
      );

      const rows = await res.json();

      return new Response(JSON.stringify({ totalProducts: rows.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET FLYERS COUNT (admin only)
    if (method === "GET" && path === "/stats/flyers") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin", "promotor"])) {
        return new Response(
          JSON.stringify({ error: "Solo admin y promotor" }),
          {
            status: 403,
            headers: corsHeaders,
          }
        );
      }

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/stats?select=flyers_generated&id=eq.1`,
        { headers: sbHeaders }
      );

      const rows = await res.json();

      return new Response(
        JSON.stringify({ flyersGenerated: rows?.[0]?.flyers_generated || 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // INCREMENT FLYERS (admin + promotor)
    if (method === "POST" && path === "/stats/flyers/increment") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin", "promotor"])) {
        return new Response(JSON.stringify({ error: "Solo admin o promotor" }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const getRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/stats?id=eq.1&select=id,flyers_generated`,
        { headers: sbHeaders }
      );

      const rows = await getRes.json();
      const current = rows?.[0]?.flyers_generated || 0;

      const updateRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/stats?id=eq.1`,
        {
          method: "PATCH",
          headers: sbHeaders,
          body: JSON.stringify({ flyers_generated: current + 1 }),
        }
      );

      return new Response(JSON.stringify({ success: true }), {
        status: updateRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================
    // FALLBACK
    // =========================
    return new Response("Not found", { status: 404, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Error interno",
        detail: err?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  },
};
