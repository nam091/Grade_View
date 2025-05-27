import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { sequelize, syncModels } from './models';
import userRoutes from './routes/userRoutes';
import subjectRoutes from './routes/subjectRoutes';
import gradeRoutes from './routes/gradeRoutes';
import registrationRoutes from './routes/registrationRoutes';
import { initKeycloak } from './middleware/keycloakMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Session configuration for Keycloak
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: process.env.SESSION_SECRET || 'g8ldPzzKLhS9lhVAxtb0l64Hv38bF94X',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Override Keycloak URL if needed
process.env.KEYCLOAK_URL = 'http://localhost:8080';

// Initialize Keycloak
const keycloak = initKeycloak(memoryStore);
app.use(keycloak.middleware());

// Log Keycloak configuration for debugging
console.log('Keycloak URL:', process.env.KEYCLOAK_URL);
console.log('Keycloak Realm:', process.env.KEYCLOAK_REALM || 'gradeview');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/registrations', registrationRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'GradeView API đang chạy' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server chạy trên cổng ${PORT}`);
  
  try {
    // Authenticate to check database connection
    await sequelize.authenticate();
    console.log('Kết nối cơ sở dữ liệu đã được thiết lập thành công.');
    
    // Sync models with database
    await syncModels();
  } catch (error) {
    console.error('Không thể kết nối đến cơ sở dữ liệu:', error);
  }
});

export default app; 