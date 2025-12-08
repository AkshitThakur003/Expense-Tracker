// Test MongoDB Connection Script
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('   Check your backend/.env file');
    process.exit(1);
  }

  console.log('🔍 Testing MongoDB Connection...\n');
  console.log('📋 Connection Details:');
  console.log(`   URI: ${mongoURI.substring(0, 30)}...`);
  console.log(`   URI Length: ${mongoURI.length} characters\n`);

  try {
    // Connect with timeout options
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Name: ${error.name}`);
    
    // Provide specific troubleshooting based on error
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n🔍 Issue: DNS Resolution Failed');
      console.error('   Possible causes:');
      console.error('   - Internet connection issue');
      console.error('   - MongoDB Atlas cluster URL is incorrect');
      console.error('   - DNS server issues');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n🔍 Issue: Authentication Failed');
      console.error('   Possible causes:');
      console.error('   - Wrong username or password in connection string');
      console.error('   - Database user doesn\'t exist');
      console.error('   - User doesn\'t have required permissions');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('\n🔍 Issue: IP Address Not Whitelisted');
      console.error('   Solution:');
      console.error('   1. Go to MongoDB Atlas → Network Access');
      console.error('   2. Click "Add IP Address"');
      console.error('   3. Add your current IP or use 0.0.0.0/0 (development only)');
    } else if (error.message.includes('timeout') || error.message.includes('serverSelectionTimeoutMS')) {
      console.error('\n🔍 Issue: Connection Timeout');
      console.error('   Possible causes:');
      console.error('   - Network firewall blocking connection');
      console.error('   - IP address not whitelisted');
      console.error('   - MongoDB Atlas cluster is paused');
      console.error('   - Internet connection issues');
    }
    
    console.error('\n📝 General Troubleshooting:');
    console.error('   1. Check your MONGODB_URI in backend/.env');
    console.error('   2. Verify connection string format: mongodb+srv://user:pass@cluster.mongodb.net/database');
    console.error('   3. Ensure database name is included in connection string');
    console.error('   4. Check MongoDB Atlas dashboard for cluster status');
    console.error('   5. Verify your IP is whitelisted in Network Access');
    
    process.exit(1);
  }
};

testConnection();

