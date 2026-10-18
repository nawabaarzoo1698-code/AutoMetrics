import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models';
import { env } from '../config/env';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ name: user.name }, env.jwtSecret, {
    subject: String(user._id),
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
  res.json({ token, user: { name: user.name, email: user.email } });
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => res.json(req.user));
