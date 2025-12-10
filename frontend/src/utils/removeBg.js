import removeBackground from "@imgly/background-removal";

export async function removeBgFromFile(inputFile) {
  try {
    const outputBlob = await removeBackground(inputFile, {
      publicPath: "/",
      progress: (p) => console.log("BG remove:", p),
    });

    return new File([outputBlob], inputFile.name.replace(/\.[^.]+$/, "") + "_nobg.png", {
      type: "image/png",
    });
  } catch (err) {
    console.error("Error quitando fondo:", err);
    return inputFile; // fallback
  }
}
