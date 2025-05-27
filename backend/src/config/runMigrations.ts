import { sequelize } from './database';
import { up as createRegistrationRequests } from '../migrations/create-registration-requests';

const runMigrations = async () => {
  try {
    console.log('Starting migrations...');
    
    // Create migration tracking table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migration_tracking (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check if registration requests migration has been run
    const [results] = await sequelize.query(
      `SELECT * FROM migration_tracking WHERE migration_name = 'create-registration-requests'`
    );
    
    if ((results as any[]).length === 0) {
      console.log('Running create-registration-requests migration...');
      await createRegistrationRequests(sequelize.getQueryInterface());
      
      // Record the migration
      await sequelize.query(
        `INSERT INTO migration_tracking (migration_name) VALUES ('create-registration-requests')`
      );
      
      console.log('✅ create-registration-requests migration completed successfully');
    } else {
      console.log('⏭️ create-registration-requests migration already executed');
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

runMigrations();