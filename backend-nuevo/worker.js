export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // =========================
    // CORS
    // =========================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Supabase headers
    const sbHeaders = {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };

    // =========================
    // AUTH HELPERS
    // =========================
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
        `${env.SUPABASE_URL}/rest/v1/usuarios?id=eq.${id}&select=id,email,role`,
        { headers: sbHeaders }
      );

      const rows = await res.json();
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
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

    // =========================
    // LOGIN
    // =========================
    if (method === "POST" && path === "/auth/login") {
      const { email, password } = await req.json();

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email y contraseña obligatorios" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/usuarios?select=id,email,password,role&email=eq.${encodeURIComponent(email)}&limit=1`,
        { headers: sbHeaders }
      );

      const rows = await res.json();
      const user = rows?.[0] || null;

      if (!user || user.password !== password) {
        return new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const token = `dummy-${user.id}-${Date.now()}`;

      return new Response(
        JSON.stringify({
          token,
          usuario: {
            id: user.id,
            email: user.email,
            role: user.role || "promotor",
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================
    // PRODUCTS
    // =========================

    // PUBLIC GET ALL
    if (method === "GET" && path === "/products") {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?select=*`,
        { headers: sbHeaders }
      );

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
        return new Response(JSON.stringify({ error: "Solo admin puede crear productos" }), {
          status: 403,
          headers: corsHeaders,
        });
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
        return new Response(JSON.stringify({ error: "Solo admin puede editar" }), {
          status: 403,
          headers: corsHeaders,
        });
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
        return new Response(JSON.stringify({ error: "Solo admin puede borrar" }), {
          status: 403,
          headers: corsHeaders,
        });
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

      return new Response(
        JSON.stringify({ totalProducts: rows.length }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET FLYERS COUNT (admin only)
    if (method === "GET" && path === "/stats/flyers") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin", "promotor"])) {
        return new Response(JSON.stringify({ error: "Solo admin y promotor" }), {
          status: 403,
          headers: corsHeaders,
        });
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

    // INCREMENT FLYERS (admin only)
    if (method === "POST" && path === "/stats/flyers/increment") {
      const user = await requireAuth(req);
      if (!requireRole(user, ["admin"])) {
        return new Response(JSON.stringify({ error: "Solo admin" }), {
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

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: updateRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================
    // FALLBACK
    // =========================
    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
