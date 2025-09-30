import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  image?: string;
  createdAt: string;
}

let users: User[] = [];

export class UserService {
  static async createUser(email: string, name: string, password: string): Promise<User | null> {
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    return newUser;
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async findUserById(id: string): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  static async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  static getAllUsers(): Omit<User, 'password'>[] {
    return users.map(({ password, ...user }) => user);
  }
}