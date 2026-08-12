import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;

      res.status(statusCode).json({
        statusCode: statusCode,
        success: false,
        message: error?.message || "Internal Server Error",
      });
    }
  };
};
