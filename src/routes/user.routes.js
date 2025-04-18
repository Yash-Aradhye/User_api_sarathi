import express from 'express';
import UserController from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.js';
import cacheMiddleware from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.post('/send-otp', UserController.sendOTP);
router.post('/login', UserController.login);
router.post('/ispremium', UserController.checkPremiumStatusByPhone);
router.post('/', UserController.createUser);

// Protected routes (require authentication)
router.use(authMiddleware);
router.post('/logout', UserController.logout);

// Cached routes
router.get("/lists", cacheMiddleware('user'), UserController.getUserLists);
router.get("/registrationForm", cacheMiddleware('registration'), UserController.getRegistrationForm);

// User registration and retrieval
router.get('/:id', UserController.getUserById);
router.get('/phone/:phone', UserController.getUserByPhone);

// Premium plan management
router.patch('/:id/premium', UserController.updatePremiumPlan);
router.put('/:id/updateCounsellingData', UserController.updateCounsellingData);
router.get('/:id/premium-status', UserController.checkPremiumStatus);

//formsteps
router.post('/formsteps', UserController.createFormSteps);
router.get('/formsteps', cacheMiddleware('formsteps'), UserController.getFormSteps);
router.get('/formsteps/:id', cacheMiddleware('formsteps'), UserController.getFormStepsById);
router.patch('/formsteps/:id', UserController.updateFormSteps);
router.delete('/formsteps/:id', UserController.deleteFormSteps);

// User-specific form data
router.get('/formdata/:phone/:formId', cacheMiddleware('formdata'), UserController.getUserFormData);
router.post('/formdata/:phone/:formId', UserController.updateUserFormData);

export default router;
