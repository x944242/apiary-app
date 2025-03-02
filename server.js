const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'apiary_db',
  password: '',
  port: 5432,
});

app.post('/inspections', async (req, res) => {
  const { apiary, hiveNumber, hiveName, date, queenStatus, foodStores, temperature, rain, broodPattern, notes, followUpActions } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO "HiveInspection" ("apiary", "hiveNumber", "hiveName", "date", "queenStatus", "foodStores", "temperature", "rain", "broodPattern", "notes", "followUpActions") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [apiary, hiveNumber, hiveName, date, queenStatus, foodStores, temperature, rain, broodPattern, notes, followUpActions]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.get('/inspections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "HiveInspection" ORDER BY "date" DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.put('/inspections/:id', async (req, res) => {
  const { id } = req.params;
  const { apiary, hiveNumber, hiveName, date, queenStatus, foodStores, temperature, rain, broodPattern, notes, followUpActions } = req.body;
  try {
    const result = await pool.query(
      'UPDATE "HiveInspection" SET "apiary" = $1, "hiveNumber" = $2, "hiveName" = $3, "date" = $4, "queenStatus" = $5, "foodStores" = $6, "temperature" = $7, "rain" = $8, "broodPattern" = $9, "notes" = $10, "followUpActions" = $11 WHERE "id" = $12 RETURNING *',
      [apiary, hiveNumber, hiveName, date, queenStatus, foodStores, temperature, rain, broodPattern, notes, followUpActions, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.delete('/inspections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM "HiveInspection" WHERE "id" = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.get('/apiaries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Apiaries"');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.post('/apiaries', async (req, res) => {
  const { name, postcode } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO "Apiaries" ("name", "postcode") VALUES ($1, $2) RETURNING *',
      [name, postcode || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.put('/apiaries/:name', async (req, res) => {
  const { name } = req.params;
  const { postcode } = req.body;
  try {
    const result = await pool.query(
      'UPDATE "Apiaries" SET "postcode" = $1 WHERE "name" = $2 RETURNING *',
      [postcode || null, name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.delete('/apiaries/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await pool.query('UPDATE "Hives" SET "currentApiary" = NULL WHERE "currentApiary" = $1', [name]);
    await pool.query('DELETE FROM "Apiaries" WHERE "name" = $1', [name]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.get('/hives', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Hives"');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.post('/hives', async (req, res) => {
  const { hiveNumber, name, currentApiary, type } = req.body;
  if (!Number.isInteger(hiveNumber)) {
    return res.status(400).send('Invalid hiveNumber: must be an integer');
  }
  try {
    const result = await pool.query(
      'INSERT INTO "Hives" ("hiveNumber", "name", "currentApiary", "type") VALUES ($1, $2, $3, $4) RETURNING *',
      [hiveNumber, name || '', currentApiary || null, type || 'Full size']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.put('/hives/:hiveNumber', async (req, res) => {
  const { hiveNumber } = req.params;
  const { name, currentApiary, type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE "Hives" SET "name" = $1, "currentApiary" = $2, "type" = $3 WHERE "hiveNumber" = $4 RETURNING *',
      [name, currentApiary, type, Number(hiveNumber)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.stack);
    res.status(500).send('Server error');
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));