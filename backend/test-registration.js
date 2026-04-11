// Test registration endpoint
const axios = require('axios');

async function testRegistration() {
  try {
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'Test123456', // Contains uppercase, lowercase, and numbers
      role: 'student'
    };

    console.log('Testing registration with:', { ...testData, password: '***' });

    const response = await axios.post('http://localhost:5000/api/auth/register', testData);
    
    console.log('Registration successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRegistration();
