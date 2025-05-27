import express from 'express';
import {
  createUser,
  getAllUsers,
  getUsersByRole,
  getUserById,
  getUserByKeycloakId,
  updateUser,
  deleteUser
} from '../controllers/userController';

const router = express.Router();

// Create a new user
router.post('/', createUser);

// Get all users
router.get('/', getAllUsers);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Get user by Keycloak ID
router.get('/keycloak/:keycloakId', getUserByKeycloakId);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

export default router;