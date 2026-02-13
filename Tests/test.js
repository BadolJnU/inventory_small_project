const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log("Starting System Test...");

  try {
    // 1. Test Fetch Items
    const items = await axios.get(`${API_URL}/items`);
    console.log(`Items fetched: ${items.data.length} found.`);
    const testItemId = items.data[0].id;

    // 2. Test Reservation (Using a dummy userId 1)
    const reserveRes = await axios.post(`${API_URL}/reserve`, {
      itemId: testItemId,
      userId: 1,
      quantity: 1
    });
    console.log("Reservation successful:", reserveRes.data.message);

    // 3. Test Purchase Confirmation
    const confirmRes = await axios.post(`${API_URL}/purchase-confirm`, {
      itemId: testItemId,
      userId: 1
    });
    console.log("Purchase confirmed:", confirmRes.data.message);

    console.log("\n ALL TESTS PASSED SUCCESSFULLY ");
  } catch (error) {
    console.error("Test Failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

runTest();