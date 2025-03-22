export default function handler(req, res) {
    console.log("✅ /api/test hit");
    res.status(200).json({ message: "Test route working!" });
  }
  

  console.log("🧪 TEST ROUTE LOADED");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);
