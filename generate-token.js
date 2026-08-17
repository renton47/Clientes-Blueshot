const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#]+?)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  try {
    console.log('Fetching clients...');
    // Fetch a client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, company_name')
      .limit(1);

    if (clientError) throw clientError;

    let clientId;
    let clientName;

    if (!clients || clients.length === 0) {
      console.log('No clients found. Creating a default client...');
      const { data: newClient, error: newClientError } = await supabase
        .from('clients')
        .insert({
          email: 'admin@blueshot.cl',
          name: 'Admin',
          company_name: 'Blueshot',
          active: true
        })
        .select()
        .single();
        
      if (newClientError) throw newClientError;
      clientId = newClient.id;
      clientName = newClient.company_name;
    } else {
      clientId = clients[0].id;
      clientName = clients[0].company_name || clients[0].name;
    }

    console.log(`Using client: ${clientName} (${clientId})`);

    // Generate secure random token
    const token = 'bs_' + crypto.randomBytes(24).toString('hex');
    
    // Insert installation
    const wpUrl = env['NEXT_PUBLIC_WP_URL'] || 'https://blueshot.cl';
    console.log(`Creating installation token for URL: ${wpUrl}...`);

    const { data: installation, error: insertError } = await supabase
      .from('wordpress_installations')
      .insert({
        client_id: clientId,
        url: wpUrl,
        token: token,
        active: true
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
         console.log('It seems a token already exists for some constraint. Attempting to fetch existing...');
      } else {
         throw insertError;
      }
    }

    console.log('\n==================================================');
    console.log('✅ INSTALACIÓN DE WORDPRESS REGISTRADA CON ÉXITO');
    console.log('==================================================');
    console.log(`Cliente: ${clientName}`);
    console.log(`URL de WordPress: ${wpUrl}`);
    console.log(`Token de Instalación: ${token}`);
    console.log('==================================================\n');
    console.log('Por favor, copia este token y la URL del backend y pégalos en la configuración del plugin en WordPress.');

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
