import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db';

const SESSION_DAYS = 7;
const SESSION_COOKIE = 'sid';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`).run(token, userId, expiresAt);
  return token;
}

export function destroySession(token: string) {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(token);
}

export function sessionUser(token: string): { id: string; username: string } | null {
  const session: any = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(token);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  const user: any = db.prepare(`SELECT id, username FROM users WHERE id = ?`).get(session.user_id);
  return user || null;
}

export function authRequired(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  const user = token ? sessionUser(token) : null;
  if (!user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  (req as any).user = user;
  next();
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}
