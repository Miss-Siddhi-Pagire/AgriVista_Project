const axios = require("axios");

const BASE_URL = "http://localhost:7000";

async function testAdminFlow() {
    try {
        console.log("1. Logging in as Admin...");
        let token;
        try {
            const loginRes = await axios.post(`${BASE_URL}/api/admin/login`, {
                email: "admin@agrivista.com",
                password: "adminpassword123",
            });

            if (loginRes.data.success) {
                token = loginRes.data.token;
                console.log("Login Success. Token:", token ? "Present" : "Missing");
            } else {
                console.log("Login Failed:", loginRes.data.message);
                return;
            }
        } catch (e) {
            console.error("Login Error:", e.message);
            if (e.response) console.error(e.response.data);
            return;
        }

        if (token) {
            console.log("2. Accessing Protected Route (Stats)...");
            try {
                const statsRes = await axios.get(`${BASE_URL}/api/admin/stats`, {
                    headers: {
                        // Emulate cookie sent by browser
                        Cookie: `token=${token}; admin_token=${token}`
                    },
                    withCredentials: true
                });
                console.log("Stats Access:", statsRes.data.success ? "SUCCESS" : "FAILURE");
                console.log("Stats Data Keys:", Object.keys(statsRes.data.stats));
            } catch (e) {
                console.error("Stats Access Error:", e.message);
                if (e.response) {
                    console.error("Status:", e.response.status);
                    console.error("Data:", e.response.data);
                }
            }
        }

    } catch (error) {
        console.error("Unexpected Error:", error);
    }
}

testAdminFlow();
