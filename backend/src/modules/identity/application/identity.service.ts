import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IdentityRepository } from '../infrastructure/identity.repository';
import { User, UserRole } from '../domain/user.entity';
import { JWT_SECRET } from '../../../shared/middleware/auth.middleware';

export class IdentityService {
  constructor(private repo: IdentityRepository) {}

  public async register(
    code: string,
    name: string,
    email: string,
    password: string,
    role: UserRole,
    department: string
  ): Promise<{ token: string; user: any }> {
    const existing = this.repo.findByEmail(email);
    if (existing) {
      throw new Error('Email này đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User(uuidv4(), code, name, email, passwordHash, role, department, new Date());
    this.repo.save(user);

    const token = this.generateToken(user);
    return { token, user: this.sanitize(user) };
  }

  public async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const user = this.repo.findByEmail(email);
    if (!user) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user);
    return { token, user: this.sanitize(user) };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  private sanitize(user: User) {
    return {
      id: user.id,
      code: user.code,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };
  }
}
