const matches = (bytes, offset, signature) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

export async function supportedImage(file) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Избери PNG, JPEG или WebP до 10 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  let type;
  if (matches(bytes, 0, [137, 80, 78, 71, 13, 10, 26, 10])) type = 'image/png';
  else if (matches(bytes, 0, [255, 216, 255])) type = 'image/jpeg';
  else if (matches(bytes, 0, [82, 73, 70, 70]) && matches(bytes, 8, [87, 69, 66, 80])) type = 'image/webp';
  else throw new Error('Избери валидно PNG, JPEG или WebP изображение.');
  return file.type === type ? file : file.slice(0, file.size, type);
}
