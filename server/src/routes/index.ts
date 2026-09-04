import { Router } from 'express';
import authRoutes from './auth';
import emailRoutes from './emails';
import slackRoutes from './slack';

const router = Router();

router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/slack', slackRoutes);

export default router;
