import { sequelize } from './database';

async function checkTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully!');

    // Get all table names
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nTables in database:');
    console.log(results);

    // Check if registration_requests table exists
    const [regResults] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'registration_requests'
      ORDER BY ordinal_position;
    `);

    console.log('\nColumns in registration_requests table:');
    console.log(regResults);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkTables().catch(console.error); 