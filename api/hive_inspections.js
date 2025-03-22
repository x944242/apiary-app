export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log("📥 Received inspection data:", req.body);
    return res.status(200).json({ message: 'Mock: Inspection saved successfully' });
  } else if (req.method === 'GET') {
    return res.status(200).json([
      {
        id: 1,
        hive_id: 33,
        inspection_date: "2024-04-01",
        notes: "Mock inspection record",
        status: "Good",
      }
    ]);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
