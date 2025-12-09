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

  if (!data.secure_url) {
    throw new Error("Cloudinary no devolvió URL");
  }

  return data.secure_url;
}
