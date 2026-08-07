
const { createClient } = require('@supabase/supabase-js');

// These will be set in Vercel environment variables
const supabase = createClient(
  process.env.https://https://vtpejwzckzimtesevbps.supabase.co/rest/v1/,
  process.env.sb_publishable__k0Ecw-bMjIfxADPmKPMtQ_PZ0fvK3q
);

const TABLE = 'school_data';
const ROW_ID = 1; // We store everything in this one row

module.exports = async (req, res) => {
  // Enable CORS so your website can talk to this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests (browser safety check)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET request: Pull data from Supabase
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(TABLE)
        .select('data')
        .eq('id', ROW_ID)
        .single();

      if (error) throw error;
      // Send back the JSON blob (or empty object if nothing found)
      return res.status(200).json(data?.data || {});
    }

    // PUT request: Push data to Supabase
    if (req.method === 'PUT') {
      const payload = req.body; // This is your full school database

      const { error } = await supabase
        .from(TABLE)
        .upsert({ id: ROW_ID, data: payload, updated_at: new Date().toISOString() });

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Data saved to Supabase' });
    }

    // If any other method is used
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Supabase bridge error:', error);
    res.status(500).json({ error: error.message });
  }
};
