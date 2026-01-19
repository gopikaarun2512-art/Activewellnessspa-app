// Quick test script to verify API clients work
// Run with: node test-api.js

require('dotenv').config({ path: '.env.local' });

async function testN8NClient() {
  console.log('Testing n8n API connection...');
  const apiUrl = process.env.N8N_API_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error('❌ Missing N8N_API_URL or N8N_API_KEY');
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/executions?limit=1`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ n8n API connection successful');
    console.log(`   Found ${data.data?.length || 0} executions`);
    return true;
  } catch (error) {
    console.error('❌ n8n API error:', error.message);
    return false;
  }
}

async function testVAPIClient() {
  console.log('\nTesting VAPI API connection...');
  const privateKey = process.env.VAPI_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Missing VAPI_PRIVATE_KEY');
    return false;
  }

  try {
    const response = await fetch('https://api.vapi.ai/call?limit=1', {
      headers: {
        'Authorization': `Bearer ${privateKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ VAPI API connection successful');
    console.log(`   Found ${Array.isArray(data) ? data.length : 0} calls`);
    return true;
  } catch (error) {
    console.error('❌ VAPI API error:', error.message);
    return false;
  }
}

async function testEnvironment() {
  console.log('=== Environment Variables Check ===\n');

  const requiredVars = [
    'N8N_API_URL',
    'N8N_API_KEY',
    'VAPI_PUBLIC_KEY',
    'VAPI_PRIVATE_KEY',
    'GHL_API_KEY',
    'GHL_LOCATION_ID',
  ];

  let allPresent = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allPresent = false;
    }
  });

  return allPresent;
}

async function main() {
  console.log('=== Dashboard API Test ===\n');

  const envOk = await testEnvironment();
  if (!envOk) {
    console.log('\n⚠️  Some environment variables are missing');
  }

  console.log('\n=== API Connection Tests ===\n');

  const n8nOk = await testN8NClient();
  const vapiOk = await testVAPIClient();

  console.log('\n=== Summary ===');
  console.log(`Environment: ${envOk ? '✅' : '❌'}`);
  console.log(`n8n API: ${n8nOk ? '✅' : '❌'}`);
  console.log(`VAPI API: ${vapiOk ? '✅' : '❌'}`);

  if (n8nOk && vapiOk) {
    console.log('\n🎉 All systems ready! Dashboard should work correctly.');
  } else {
    console.log('\n⚠️  Some systems need attention. Check errors above.');
  }
}

main().catch(console.error);
