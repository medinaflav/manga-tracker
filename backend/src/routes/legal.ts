import { Router } from 'express';

const router = Router();

router.get('/privacy', (_req, res) => {
  res.send('Nous ne collectons que les données nécessaires au fonctionnement de l\'application. Vos données peuvent être supprimées via DELETE /me.');
});

export default router;
