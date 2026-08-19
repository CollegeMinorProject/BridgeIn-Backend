import multer, { StorageEngine, FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const allowedExtensions = /jpeg|jpg|png/;
  const allowedMimeTypes = /^image\/(jpeg|png)$/;
  const isExtensionValid = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const isMimeTypeValid = allowedMimeTypes.test(file.mimetype);

  if (isExtensionValid && isMimeTypeValid) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, and PNG images are allowed!"));
  }
};
const storage: StorageEngine = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ): void => {
    cb(null, "./public/temp");
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ): void => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  fileFilter,
});
