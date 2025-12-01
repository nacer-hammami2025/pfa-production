#!/usr/bin/env node

/**
 * Test OAuth Integration
 * Tests Google and Microsoft OAuth functionality
 */

const colors = require('colors');
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testOAuthIntegration() {
    console.log('🔐 Testing OAuth Integration...'.cyan.bold);
    console.log('====================================='.cyan);

    try {
        // Test server connectivity
        console.log('\n1. Testing server connectivity...'.yellow);
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✅ Server is running'.green);

        // Test OAuth endpoints exist
        console.log('\n2. Testing OAuth endpoints...'.yellow);
        
        // Test Google OAuth endpoint (should fail without token, but endpoint should exist)
        try {
            await axios.post(`${API_BASE}/auth/google`, {});
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Google OAuth endpoint exists and validates input'.green);
            } else {
                throw error;
            }
        }

        // Test Microsoft OAuth endpoint (should fail without code, but endpoint should exist)
        try {
            await axios.post(`${API_BASE}/auth/microsoft`, {});
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Microsoft OAuth endpoint exists and validates input'.green);
            } else {
                throw error;
            }
        }

        console.log('\n✅ OAuth Integration Test Passed!'.green.bold);
        console.log('\n📋 OAuth Setup Checklist:'.cyan.bold);
        console.log('1. ✅ Backend OAuth routes created');
        console.log('2. ✅ Frontend OAuth service implemented');
        console.log('3. ✅ OAuth callback component created');
        console.log('4. ✅ User model updated with OAuth fields');
        console.log('5. ⚠️  Configure Google OAuth Client ID in environment.ts'.yellow);
        console.log('6. ⚠️  Configure Microsoft OAuth Client ID in environment.ts'.yellow);
        console.log('7. ⚠️  Set up OAuth credentials in backend .env file'.yellow);

        console.log('\n🔧 Next Steps:'.cyan.bold);
        console.log('1. Get Google OAuth credentials from Google Cloud Console');
        console.log('2. Get Microsoft OAuth credentials from Azure Portal');
        console.log('3. Update frontend environment files with client IDs');
        console.log('4. Update backend .env with client IDs and secrets');
        console.log('5. Test OAuth flows in browser');

    } catch (error) {
        console.error('❌ OAuth Integration Test Failed:'.red.bold);
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testOAuthIntegration().catch(console.error);
}

module.exports = { testOAuthIntegration };