import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db';
import { AppError } from '../constants';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-this-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-only-change-this-refresh-secret';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  customerId?: string;
}

declare global {
  namespace Express {
    interface Request { authUser?: AuthUser; }
  }
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30m' });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, nonce: crypto.randomUUID() }, REFRESH_SECRET, { expiresIn: '30d' });
}

export async function issueTokens(user: AuthUser, req: Request) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      token: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    },
  });
  return { accessToken, refreshToken };
}

export function getBearerToken(req: Request): string | undefined {
  const value = req.headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
}

export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'WAREHOUSE', 'ACCOUNTANT'];

/** Ném lỗi nếu token sai/hết hạn. Dùng chung cho HTTP và Socket.IO. */
export function verifyAccessToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getBearerToken(req);
  if (!token) return next(new AppError('Vui lòng đăng nhập.', 401, 'UNAUTHORIZED'));
  try {
    req.authUser = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError('Phiên đăng nhập đã hết hạn.', 401, 'TOKEN_EXPIRED'));
  }
}

/** Gắn req.authUser nếu có token hợp lệ; không có hoặc token sai thì coi như khách vãng lai. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getBearerToken(req);
  if (token) {
    try { req.authUser = verifyAccessToken(token); } catch { req.authUser = undefined; }
  }
  next();
}

/** SĐT về dạng chỉ chữ số, đầu số quốc tế +84/84 đổi thành 0. */
export const normalizePhone = (value: string) => value.replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0');

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) return next(new AppError('Vui lòng đăng nhập.', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.authUser.role)) return next(new AppError('Bạn không có quyền thực hiện thao tác này.', 403, 'FORBIDDEN'));
    next();
  };
}

/** Đăng nhập bằng email hoặc số điện thoại (tài khoản khách đăng ký bằng SĐT). */
export async function authenticateLogin(identifier: string, password: string) {
  const login = identifier.trim();
  const include = { role: true, customer: true } as const;
  const user = login.includes('@')
    ? await prisma.user.findUnique({ where: { email: login.toLowerCase() }, include })
    : await prisma.user.findFirst({ where: { phone: normalizePhone(login) }, include });
  if (!user || !user.isActive) throw new AppError('Tài khoản hoặc mật khẩu không chính xác.', 401, 'INVALID_CREDENTIALS');
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new AppError('Tài khoản tạm khóa do đăng nhập sai nhiều lần.', 423, 'ACCOUNT_LOCKED');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
    throw new AppError('Tài khoản hoặc mật khẩu không chính xác.', 401, 'INVALID_CREDENTIALS');
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  const authUser: AuthUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name, ...(user.customer ? { customerId: user.customer.id } : {}) };
  return { authUser, mustChangePassword: user.mustChangePassword };
}
