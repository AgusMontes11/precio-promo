import multer from "multer";
import cloudinary from "./cloudinary.js";
import streamifier from "streamifier";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export { upload };

// Middleware helper para subir a Cloudinary manualmente
export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "precio-promo",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
