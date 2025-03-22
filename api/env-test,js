export default function handler(req, res) {
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Defined' : '❌ Undefined',
    NODE_ENV: process.env.NODE_ENV,
  });
}
