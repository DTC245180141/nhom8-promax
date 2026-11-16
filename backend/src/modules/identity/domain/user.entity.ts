export type UserRole = 'STUDENT' | 'LECTURER' | 'ADMIN';

export class User {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly department: string,
    public readonly createdAt: Date
  ) {}
}
