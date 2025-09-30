import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    try {
      const user = await UserService.createUser(email, name, password);
      
      return NextResponse.json(
        { 
          message: 'User created successfully',
          user: {
            id: user!.id,
            email: user!.email,
            name: user!.name,
          }
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}