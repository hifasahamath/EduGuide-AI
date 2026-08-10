const { supabaseAdmin } = require('./config/supabase');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listUsers() {
  console.log('Fetching users from profiles table...');
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, display_name');

  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }

  console.log(`Found ${data.length} users:`);
  data.forEach(user => {
    console.log(`- ${user.email} | Role: ${user.role} | Name: ${user.display_name}`);
  });
}

listUsers();
