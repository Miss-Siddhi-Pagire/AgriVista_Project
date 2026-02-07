const axios = require('axios');

const BASE_URL = 'http://localhost:7000';

async function testAuth() {
    try {
        const email = `test_${Date.now()}@example.com`;
        const password = 'password123';
        const name = 'Test User';

        console.log('1. Signing up...');
        const signupRes = await axios.post(`${BASE_URL}/signup`, { email, password, name, username: name });
        console.log('Signup Status:', signupRes.data.success ? 'SUCCESS' : 'FAILURE', signupRes.data.message);

        if (!signupRes.data.token) {
            console.error('No token received on signup');
            return;
        }
        const token = signupRes.data.token;
        console.log('Token received.');

        console.log('2. Verifying Token (via Body)...');
        const verifyBodyRes = await axios.post(`${BASE_URL}/`, { tok: token });
        console.log('Verification (Body):', verifyBodyRes.data.status ? 'SUCCESS' : 'FAILURE', verifyBodyRes.data.user);

        console.log('3. Verifying Token (via Cookie header emulation)...');
        const verifyCookieRes = await axios.post(`${BASE_URL}/`, {}, {
            headers: {
                Cookie: `token=${token}`
            }
        });
        console.log('Verification (Cookie):', verifyCookieRes.data.status ? 'SUCCESS' : 'FAILURE', verifyCookieRes.data.user);

    } catch (err) {
        console.error('Error during test:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

testAuth();
