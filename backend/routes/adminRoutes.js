

import express from 'express';
import * as  adminController from '../controller/adminController.js';
import multer from 'multer';
const upload = multer({ dest: '/tmp/' });

const router = express.Router();


// const authMiddleware = require('../middleware/authMiddleware');

// Protect all admin routes with authentication middleware
// router.use(authMiddleware.requireAuth);
// router.use(authMiddleware.requireAdmin);

router.post('/import-data', upload.single('parkingData'), adminController.importData);
// router.get('/parking-spots', adminController.getAllParkingSpots);
router.post('/parking-spots', adminController.createParkingSpot);
router.put('/parking-spots/:id', adminController.updateParkingSpot);
router.delete('/parking-spots/:id', adminController.deleteParkingSpot);

export default router;
