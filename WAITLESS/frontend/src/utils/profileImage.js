import { buildApiUrl } from "@/services/api";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const AVATAR_SIZE = 640;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened."));
    image.src = source;
  });
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("This image could not be prepared."));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result);
          resolve({
            base64: dataUrl.split(",")[1],
            dataUrl,
          });
        };
        reader.onerror = () => reject(new Error("This image could not be prepared."));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.84,
    );
  });
}

export async function prepareProfileImage(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Choose an image smaller than 8 MB.");
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - cropSize) / 2;
    const sourceY = (image.naturalHeight - cropSize) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser cannot prepare the selected image.");
    }
    context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    return await canvasToJpeg(canvas);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function resolveProfileImageUrl(value) {
  if (!value || value.startsWith("data:") || /^https?:\/\//i.test(value)) {
    return value ?? "";
  }

  return buildApiUrl(value);
}
