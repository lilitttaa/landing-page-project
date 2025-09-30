import bcrypt from 'bcryptjs';
import { db, User } from './database';

export class UserService {
  static async createUser(email: string, name: string, password: string): Promise<User | null> {
    try {
      // 检查用户是否已存在
      const existingUser = this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser: User = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        name,
        password_hash: hashedPassword,
        provider: 'credentials',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const success = db.addUser(newUser);
      if (!success) {
        throw new Error('Failed to create user');
      }
      
      return this.findUserById(newUser.id);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static findUserByEmail(email: string): User | null {
    try {
      return db.findUserByEmail(email);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static findUserById(id: string): User | null {
    try {
      return db.findUserById(id);
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  static async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = this.findUserByEmail(email);
      if (!user || !user.password_hash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  static getAllUsers(): Omit<User, 'password_hash'>[] {
    try {
      const users = db.getUsers();
      return users.map(({ password_hash, ...user }) => user);
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // OAuth用户创建（Google登录）
  static async createOAuthUser(email: string, name: string, image?: string, provider: string = 'google'): Promise<User | null> {
    try {
      const existingUser = this.findUserByEmail(email);
      if (existingUser) {
        return existingUser;
      }

      const newUser: User = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        name,
        image_url: image,
        provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const success = db.addUser(newUser);
      if (!success) {
        throw new Error('Failed to create OAuth user');
      }
      
      return this.findUserById(newUser.id);
    } catch (error) {
      console.error('Error creating OAuth user:', error);
      throw error;
    }
  }
}