import { Router, Request, Response } from 'express';
import { IdentityService } from '../application/identity.service';
import { IdentityRepository } from '../infrastructure/identity.repository';
import { authMiddleware, AuthenticatedRequest } from '../../../shared/middleware/auth.middleware';

const router = Router();
const repo = new IdentityRepository();
const service = new IdentityService(repo);

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { code, name, email, password, role, department } = req.body;
    if (!code || !name || !email || !password || !role) {
      res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin' });
      return;
    }
    const result = await service.register(code, name, email, password, role, department || 'Khoa CNTT');
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
      return;
    }
    const result = await service.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export const identityRouter = router;
