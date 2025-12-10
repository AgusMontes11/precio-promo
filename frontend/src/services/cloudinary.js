export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  fd.append("e_background_removal", "cloudinary_ai");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: fd,
    }
  );

  const data = await res.json();

  console.log("Cloudinary response:", data);

  // PRIORIDAD 1: imagen sin fondo si existe
  if (data.eager?.length > 0 && data.eager[0].secure_url) {
    return data.eager[0].secure_url;
  }

  // PRIORIDAD 2: fallback a la imagen original si algo falló
  if (data.secure_url) {
    return data.secure_url;
  }

  throw new Error("Cloudinary no devolvió una URL válida");
}
