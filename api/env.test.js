export default async function handler(req, res) {
    res.status(200).json({
      SUPABASE_URL: process.env.SUPABASE_URL || "undefined",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Loaded" : "❌ Missing",
      NODE_ENV: process.env.NODE_ENV,
    });
  }
  