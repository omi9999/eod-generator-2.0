import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { ReportController } from '../controllers/reportController';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const controller = new ReportController();

// Rate limiting for report generation
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many report generation requests, please try again later.' }
});

// Validation rules
const generateValidation = [
  body('tasks').notEmpty().withMessage('Tasks are required'),
  body('employee_name').notEmpty().withMessage('Employee name is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('report_date').isISO8601().withMessage('Valid date is required'),
  body('provider').isIn(['Groq (Fastest)', 'OpenAI (ChatGPT)', 'Google Gemini', 'Ollama (local)'])
    .withMessage('Invalid provider selected'),
  body('api_key').optional().isString(),
  body('model_name').optional().isString(),
  body('template').optional().isString()
];

// Routes
router.post('/generate', generateLimiter, generateValidation, controller.generateReport);
router.get('/history', controller.getHistory);
router.get('/history/:employee', controller.getEmployeeHistory);
router.get('/history/date/:date', controller.getHistoryByDate);
router.delete('/history/:id', controller.deleteHistory);
router.post('/history/save', controller.saveHistory);
router.get('/employees', controller.getEmployees);
router.post('/employees', body('name').notEmpty(), body('position').notEmpty(), controller.addEmployee);
router.delete('/employees/:name', controller.deleteEmployee);
router.put('/employees/:name', body('position').notEmpty(), controller.updateEmployee);

export { router as reportRoutes };