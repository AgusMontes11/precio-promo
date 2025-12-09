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

    // Headers para Supabase REST
    const sbHeaders = {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };

    // =========================
    // PRODUCTS
    // =========================

    // GET ALL PRODUCTS
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

    // GET PRODUCT BY ID
    if (method === "GET" && path.startsWith("/products/")) {
      const id = path.split("/")[2];

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`,
        { headers: sbHeaders }
      );

      const data = await res.json();

      return new Response(JSON.stringify(data?.[0] || null), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE PRODUCT
    if (method === "POST" && path === "/products") {
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

    // UPDATE PRODUCT
    if (method === "PUT" && path.startsWith("/products/")) {
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

    // DELETE PRODUCT
    if (method === "DELETE" && path.startsWith("/products/")) {
      const id = path.split("/")[2];

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
        {
          method: "DELETE",
          headers: { ...sbHeaders, Prefer: "return=representation" },
        }
      );

      const data = await res.text();

      return new Response(
        JSON.stringify({ deleted: res.ok }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================
    // STATS
    // =========================

    // TOTAL PRODUCTS
    if (method === "GET" && path === "/stats/products") {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/products?select=id`,
        { headers: sbHeaders }
      );

      const data = await res.json();

      return new Response(
        JSON.stringify({
          totalProducts: Array.isArray(data) ? data.length : 0,
        }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET FLYER COUNT
    if (method === "GET" && path === "/stats/flyers") {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/stats?select=flyers_generated&id=eq.1`,
        { headers: sbHeaders }
      );

      const data = await res.json();

      return new Response(
        JSON.stringify({
          flyersGenerated: data?.[0]?.flyers_generated || 0,
        }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // INCREMENT FLYER COUNTER
    if (method === "POST" && path === "/stats/flyers/increment") {
      const getRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/stats?select=id,flyers_generated&id=eq.1`,
        { headers: sbHeaders }
      );

      const data = await getRes.json();
      const current = data?.[0]?.flyers_generated || 0;

      const updateRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/stats?id=eq.1`,
        {
          method: "PATCH",
          headers: sbHeaders,
          body: JSON.stringify({
            flyers_generated: current + 1,
          }),
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
    return new Response("Not found", {
      status: 404,
      headers: corsHeaders,
    });
  },
};
