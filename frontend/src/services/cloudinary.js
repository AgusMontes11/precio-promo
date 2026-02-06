export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: fd,
    }
  );

  const data = await res.json();

  console.log("Cloudinary response:", data);

  const originalUrl = data.secure_url || null;
  const removedBgUrl = originalUrl
    ? originalUrl.replace("/upload/", "/upload/e_background_removal/")
    : null;

  if (originalUrl) {
    return { originalUrl, removedBgUrl };
  }

  throw new Error("Cloudinary no devolvió una URL válida");
}
