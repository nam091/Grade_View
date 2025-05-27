import { sequelize } from './database';

async function addIndexes() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully!');

    const queryInterface = sequelize.getQueryInterface();

    // Add indexes for better performance
    console.log('Adding indexes...');
    
    try {
      await queryInterface.addIndex('registration_requests', ['studentId']);
      console.log('Added studentId index');
    } catch (error) {
      console.log('studentId index already exists or error:', (error as Error).message);
    }
    
    try {
      await queryInterface.addIndex('registration_requests', ['subjectId']);
      console.log('Added subjectId index');
    } catch (error) {
      console.log('subjectId index already exists or error:', (error as Error).message);
    }
    
    try {
      await queryInterface.addIndex('registration_requests', ['status']);
      console.log('Added status index');
    } catch (error) {
      console.log('status index already exists or error:', (error as Error).message);
    }
    
    try {
      await queryInterface.addIndex('registration_requests', ['academicYear']);
      console.log('Added academicYear index');
    } catch (error) {
      console.log('academicYear index already exists or error:', (error as Error).message);
    }

    console.log('Index addition process completed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addIndexes().catch(console.error); 