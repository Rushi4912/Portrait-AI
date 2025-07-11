import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { prismaClient } from "../../packages/db";
import dotenv from "dotenv";
dotenv.config();
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        email: string;
      };
    }
  }
}
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Get the JWT verification key from environment variable
    const publicKey = process.env.CLERK_JWT_PUBLIC_KEY;

    if (!publicKey) {
      console.error("Missing CLERK_JWT_PUBLIC_KEY in environment variables");
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    // Properly format the key with correct PEM format
    const formattedKey = `-----BEGIN PUBLIC KEY-----\n${publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\\n/g, "")
      .trim()}\n-----END PUBLIC KEY-----`;

    const decoded = jwt.verify(token, formattedKey, {
      algorithms: ["RS256"],
    });

    // Extract user ID from the decoded token
    const userId = (decoded as any).sub;

    if (!userId) {
      console.error("No user ID in token payload");
      res.status(403).json({ message: "Invalid token payload" });
      return;
    }

    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      console.error("No email found for user");
      res.status(400).json({ message: "User email not found" });
      return;
    }

    // Attach the user ID and email to the request
    req.userId = userId;
    req.user = {
      email: primaryEmail.emailAddress,
    };

    await prismaClient.userCredit.upsert({
      where: { userId: req.userId! },
      update: {},
      create: {
        userId: req.userId!,
        amount: 20,
      },
    });

    next();
  } catch (error: any) {
    console.error("Auth error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        message: "Invalid token",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
      return;
    }
    res.status(500).json({
      message: "Error processing authentication",
      details:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
    return;
  }
}
