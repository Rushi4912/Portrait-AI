import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { prismaClient } from "../lib/prisma";
import { env } from "../config/env";
import { logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        email: string;
        isPremium?: boolean;
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
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Missing authorization token" });
      return;
    }

    if (!env.CLERK_JWT_PUBLIC_KEY) {
      logger.error("Missing CLERK_JWT_PUBLIC_KEY in environment variables");
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const formattedKey = [
      "-----BEGIN PUBLIC KEY-----",
      env.CLERK_JWT_PUBLIC_KEY.replace(/-----.*KEY-----/g, "").replace(/\\n/g, ""),
      "-----END PUBLIC KEY-----",
    ].join("\n");

    const decoded = jwt.verify(token, formattedKey, {
      algorithms: ["RS256"],
    }) as { sub?: string };

    if (!decoded?.sub) {
      res.status(403).json({ message: "Invalid token payload" });
      return;
    }

    const user = await clerkClient.users.getUser(decoded.sub);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      res.status(400).json({ message: "User email not found" });
      return;
    }

    req.userId = decoded.sub;
    req.user = {
      email: primaryEmail.emailAddress,
    };

    await prismaClient.userCredit.upsert({
      where: { userId: decoded.sub },
      update: {},
      create: {
        userId: decoded.sub,
        amount: 20,
      },
    });

    next();
  } catch (error) {
    logger.error({ error }, "Authentication error");
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }

    res.status(500).json({ message: "Error processing authentication" });
  }
}

