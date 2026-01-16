/**
 * Joining Form Routes
 * API endpoints for employee onboarding form
 */

import express from 'express';
import { authenticate } from '../../../core/auth/authMiddleware.js';
import * as joiningFormController from '../controllers/joining-form.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all joining forms
router.get('/', joiningFormController.getAllJoiningForms);

// Get pending onboarding list
router.get('/pending', joiningFormController.getPendingOnboarding);

// Get joining form by employee ID
router.get('/:id', joiningFormController.getJoiningFormById);

// Save complete joining form
router.post('/:id', express.json(), joiningFormController.saveJoiningForm);

// Update employee info only
router.put('/:id/employee-info', express.json(), joiningFormController.updateEmployeeInfo);

// Family members
router.post('/:id/family', express.json(), joiningFormController.addFamilyMember);
router.put('/:id/family/:memberId', express.json(), joiningFormController.updateFamilyMember);
router.delete('/:id/family/:memberId', joiningFormController.deleteFamilyMember);

// Academic info
router.post('/:id/academic', express.json(), joiningFormController.addAcademicInfo);
router.put('/:id/academic/:academicId', express.json(), joiningFormController.updateAcademicInfo);
router.delete('/:id/academic/:academicId', joiningFormController.deleteAcademicInfo);

// Previous employment
router.post('/:id/employment', express.json(), joiningFormController.addPreviousEmployment);
router.put('/:id/employment/:employmentId', express.json(), joiningFormController.updatePreviousEmployment);
router.delete('/:id/employment/:employmentId', joiningFormController.deletePreviousEmployment);

// Complete onboarding
router.post('/:id/complete', joiningFormController.completeOnboarding);

export default router;
