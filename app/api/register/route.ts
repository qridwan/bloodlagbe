// src/app/api/register/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const saltRounds = 10; // Cost factor for bcrypt hashing

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // --- Basic Validation ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields (name, email, password)' },
        { status: 400 } // Bad Request
      );
    }

    // --- Check if user already exists ---
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 } // Conflict
      );
    }

    // --- Hash Password ---
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- Create User ---
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        hashedPassword: hashedPassword,
        // Role defaults to USER as defined in the schema
      },
      // Select only non-sensitive fields to return
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    console.log(`User created successfully: ${newUser.email}`);
    return NextResponse.json(newUser, { status: 201 }); // Created

  } catch (error) {
    console.error('Registration Error:', error);
    // Generic error for security
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 } // Internal Server Error
    );
  } finally {
    // Ensure Prisma Client disconnects after the request (optional but good practice)
     await prisma.$disconnect();
  }
}