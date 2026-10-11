import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticateLogin, issueTokens, requireAuth, requireRole, type AuthUser } from '../middleware/auth';
import { registerSchema } from '../validation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AppError } from '../constants';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') throw new AppError('Email và mật khẩu là bắt buộc.', 400, 'INVALID_INPUT');
    const { authUser, mustChangePassword } = await authenticateLogin(email, password);
    const tokens = await issueTokens(authUser, req);
    res.json({ user: authUser, mustChangePassword, ...tokens });
  } catch (error) { next(error); }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thông tin chưa hợp lệ.', issues: parsed.error.issues });
      return;
    }
    const { fullName, email, phone, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) throw new AppError('Email đã được sử dụng.', 409, 'EMAIL_TAKEN');
    const existingCustomer = await prisma.customer.findFirst({ where: { OR: [{ email: email.toLowerCase() }, { phone }] } });
    if (existingCustomer) throw new AppError('Số điện thoại hoặc email đã tồn tại.', 409, 'CUSTOMER_EXISTS');

    const role = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!role) throw new AppError('Hệ thống chưa cấu hình vai trò khách hàng.', 500, 'ROLE_MISSING');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email: email.toLowerCase(), fullName, passwordHash, roleId: role.id }, include: { role: true } });
    const customer = await prisma.customer.create({ data: { email: email.toLowerCase(), fullName, phone, userId: user.id } });

    const authUser: AuthUser = { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name, customerId: customer.id };
    const tokens = await issueTokens(authUser, req);
    res.status(201).json({ user: authUser, ...tokens });
  } catch (error) { next(error); }
});

authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) throw new AppError('Mật khẩu mới tối thiểu 8 ký tự.', 400, 'INVALID_INPUT');

    const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
    if (!user) throw new AppError('Không tìm thấy người dùng.', 404, 'USER_NOT_FOUND');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Mật khẩu hiện tại không đúng.', 401, 'INVALID_CREDENTIALS');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.authUser!.id }, include: { role: { include: { permissions: { include: { permission: true } } } }, customer: true } });
    if (!user) throw new AppError('Không tìm thấy người dùng.', 404, 'USER_NOT_FOUND');
    res.json({
      id: user.id, email: user.email, fullName: user.fullName, role: user.role.name,
      mustChangePassword: user.mustChangePassword, customerId: user.customer?.id,
      permissions: user.role.permissions.map((rp) => rp.permission.code),
    });
  } catch (error) { next(error); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (typeof refreshToken !== 'string') throw new AppError('Thiếu refreshToken.', 400, 'INVALID_INPUT');
    const jwt = await import('jsonwebtoken');
    let payload: { userId: string };
    try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET ?? 'dev-only-change-this-refresh-secret') as { userId: string }; }
    catch { throw new AppError('Refresh token không hợp lệ.', 401, 'INVALID_REFRESH_TOKEN'); }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await prisma.refreshToken.findUnique({ where: { token: hash }, include: { user: { include: { role: true, customer: true } } } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new AppError('Refresh token đã hết hạn.', 401, 'REFRESH_EXPIRED');

    const authUser: AuthUser = { id: stored.user.id, email: stored.user.email, fullName: stored.user.fullName, role: stored.user.role.name, ...(stored.user.customer ? { customerId: stored.user.customer.id } : {}) };
    const tokens = await issueTokens(authUser, req);
    res.json({ user: authUser, ...tokens });
  } catch (error) { next(error); }
});
