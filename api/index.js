// IMPORTANT: Install @supabase/supabase-js in your Vercel project
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (set these in Vercel Environment Variables)
const supabaseUrl = process.env.https://vtpejwzckzimtesevbps.supabase.co/rest/v1/;
const supabaseKey = process.env.sb_publishable__k0Ecw-bMjIfxADPmKPMtQ_PZ0fvK3q;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // 1. Always set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 3. Handle GET (Pull data from Supabase)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('schools')   // Change this to your actual table name
        .select('*');

      if (error) throw error;

      // Return the data in the structure your frontend expects
      return res.status(200).json({
        success: true,
        schools: data, // Frontend expects an array here
        totals: {
          students: data.reduce((sum, s) => sum + (s.students || 0), 0),
          teachers: data.reduce((sum, s) => sum + (s.teachers || 0), 0),
          // ... add other totals
        }
      });
    }

    // 4. Handle PUT (Push data from frontend to Supabase)
    if (req.method === 'PUT') {
      const body = req.body; // The frontend sends the full school data here

      // Example: Upsert (update or insert) the school data
      const { data, error } = await supabase
        .from('schools')
        .upsert(body.schools, { onConflict: 'id' }); // Adjust to your schema

      if (error) throw error;

      return res.status(200).json({ 
        success: true, 
        message: 'Data saved successfully!' 
      });
    }

    // 5. Method not allowed
    res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
};
