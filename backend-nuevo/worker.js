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

    function normalizeDays(raw) {
      return raw
        .toString()
        .split(",")
        .map((d) => d.trim().toUpperCase());
    }

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

    const PLAN_PROMOTOR_KEYS = [
      "promotor",
      "promotora",
      "vendedor",
      "usuario",
      "responsable",
      "nombrepromotor",
      "nombrepromotora",
    ];

    const PLAN_DAY_KEYS = [
      "dia",
      "dias",
      "diasemana",
      "diadelasemana",
      "day",
      "weekday",
    ];

    function rowHasValues(row = []) {
      return row.some((cell) => {
        const value = cell?.toString?.().trim?.() ?? "";
        return value !== "";
      });
    }

    function findHeaderRowIndex(raw = []) {
      return raw.findIndex((row) => {
        const nonEmpty = row.filter((cell) => {
          const value = cell?.toString?.().trim?.() ?? "";
          return value !== "";
        });
        return nonEmpty.length >= 2;
      });
    }

    function buildRowJson(headersOriginal, row) {
      const rowJson = {};

      headersOriginal.forEach((header, index) => {
        const key = header?.toString?.().trim?.() || "";
        if (!key) return;
        rowJson[key] = row?.[index] ?? "";
      });

      return rowJson;
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
       PLAN COMERCIAL UPLOADS
    ========================= */
    if (method === "POST" && path === "/plan-comercial/upload") {
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
        const sheet = workbook.Sheets[sheetName];

        const raw = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        const headerRowIndex = findHeaderRowIndex(raw);
        if (headerRowIndex === -1) return;

        const headersOriginal = raw[headerRowIndex].map((h) =>
          h?.toString?.().trim?.()
        );
        const normalizedHeaders = headersOriginal.map((h) =>
          normalizeKey(h || "")
        );

        const promotorIndex = normalizedHeaders.findIndex((h) =>
          PLAN_PROMOTOR_KEYS.includes(h)
        );
        const dayIndex = normalizedHeaders.findIndex((h) =>
          PLAN_DAY_KEYS.includes(h)
        );

        raw.slice(headerRowIndex + 1).forEach((row) => {
          if (!rowHasValues(row)) return;

          const rowJson = buildRowJson(headersOriginal, row);

          const promotorValue =
            promotorIndex >= 0 ? row[promotorIndex] : null;
          const dayValue = dayIndex >= 0 ? row[dayIndex] : null;

          const dias = dayValue ? normalizeDays(dayValue) : DAY_MAP;

          inserts.push({
            sheet_name: sheetName,
            uploaded_month: uploadedMonth,
            promotor_nombre: normalizeText(promotorValue),
            dias,
            row_json: rowJson,
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
        `${env.SUPABASE_URL}/rest/v1/plan_comercial_records?uploaded_month=eq.${uploadedMonth}`,
        {
          method: "DELETE",
          headers: sbHeaders,
        }
      );

      if (!deleteRes.ok) {
        const err = await deleteRes.text();
        return new Response(
          JSON.stringify({
            error: "Error limpiando Plan Comercial del mes",
            detail: err,
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/plan_comercial_records`,
        {
          method: "POST",
          headers: { ...sbHeaders, Prefer: "return=minimal" },
          body: JSON.stringify(inserts),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        return new Response(
          JSON.stringify({
            error: "Error guardando Plan Comercial",
            detail: err,
          }),
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
       PLAN COMERCIAL SHEETS
    ========================= */
    if (method === "GET" && path === "/plan-comercial/sheets") {
      const user = await requireAuth(req);
      if (!user) {
        return new Response(JSON.stringify({ error: "No autorizado" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const month = getCurrentMonth();

      let query =
        `${env.SUPABASE_URL}/rest/v1/plan_comercial_records` +
        `?select=sheet_name&uploaded_month=eq.${month}`;

      if (user.role !== "admin") {
        query += `&promotor_nombre=eq.${encodeURIComponent(
          user.nombre_promotor
        )}`;
      }

      const res = await fetch(query, { headers: sbHeaders });
      const rows = await res.json();

      const sheets = Array.from(
        new Set(rows.map((row) => row.sheet_name).filter(Boolean))
      );

      return new Response(JSON.stringify({ sheets }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    /* =========================
       PLAN COMERCIAL DATA
    ========================= */
    if (method === "GET" && path === "/plan-comercial/data") {
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
          { status: 400, headers: corsHeaders }
        );
      }

      const month = getCurrentMonth();

      let query =
        `${env.SUPABASE_URL}/rest/v1/plan_comercial_records` +
        `?sheet_name=eq.${encodeURIComponent(sheet)}` +
        `&uploaded_month=eq.${month}`;

      if (user.role !== "admin") {
        query += `&promotor_nombre=eq.${encodeURIComponent(
          user.nombre_promotor
        )}`;
      }

      const res = await fetch(query, { headers: sbHeaders });
      const rows = await res.json();

      const filtered = rows.filter((r) => {
        if (Array.isArray(r.dias)) return r.dias.includes(todayCode);
        return true;
      });

      return new Response(
        JSON.stringify({
          sheet,
          dia: todayCode,
          total: filtered.length,
          rows: filtered,
        }),
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
  },
};
