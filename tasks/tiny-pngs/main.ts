import type { Context } from "@oomol/types/oocana";
import tinify from "tinify";
import path from "path";
import fs from "fs";

type Inputs = {
  images: string[];
  key: string;
  save_address: string | null;
};
type Outputs = {
  addresses: string[];
};

export default async function (
  params: Inputs,
  context: Context<Inputs, Outputs>
): Promise<Outputs> {
  const { key, images, save_address } = params;
  const addresses: string[] = [];
  let totalOriginalSizeBytes = 0;
  let totalCompressedSizeBytes = 0;

  tinify.key = key;
  const sizeComparison: { imageName: string; originalSize: string; compressedSize: string, compressionRate: string }[] = [];

  for (const image of images) {
    if (!isImage(image)) {
      console.warn(`${image} 不是图片文件，已跳过`);
      continue;
    }

    const mySavePath = getSavePath(image, save_address, context.sessionDir);
    const originalSizeBytes = fs.statSync(image).size;
    const imageName = path.basename(image);
    const source = tinify.fromFile(image);
    await source.toFile(mySavePath);
    const compressedSizeBytes = fs.statSync(mySavePath).size;
    const compressionRate = calculateCompressionRate(originalSizeBytes, compressedSizeBytes);
    totalOriginalSizeBytes += originalSizeBytes;
    totalCompressedSizeBytes += compressedSizeBytes;
    const originalSize = formatFileSize(originalSizeBytes);
    const compressedSize = formatFileSize(compressedSizeBytes);
    addresses.push(mySavePath);
    sizeComparison.push({ imageName, originalSize, compressedSize, compressionRate });
  }
  const totalSavedBytes = totalOriginalSizeBytes - totalCompressedSizeBytes;
  const totalSavedFormatted = formatFileSize(totalSavedBytes);
  const markdownTable = generateMarkdownTable(sizeComparison, totalSavedFormatted);
  context.preview({
    type: "markdown",
    data: markdownTable
  })
  return { addresses };
};

function getSavePath(image: string, save_address: string | null, sessionDir: string): string {
  const fileName = path.basename(image);
  const saveDir = save_address ? save_address : sessionDir;
  return `${saveDir}/${fileName}`;
}
function generateMarkdownTable(
  sizeComparison: { imageName: string; originalSize: string; compressedSize: string, compressionRate: string; }[],
  totalSavedFormatted: string
): string {
  let table = "| Name | Original Size | Compressed Size| Compression Rate|\n";
  table += "|----------|--------|------------|--------|\n";

  for (const item of sizeComparison) {
    const truncatedImageName = truncateString(item.imageName, 20); 
    table += `| ${truncatedImageName} | ${item.originalSize} | ${item.compressedSize} | ${item.compressionRate} |\n`;
  }
  table += `| Total Save: **${totalSavedFormatted}** |\n`;

  return table;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

function calculateCompressionRate(originalSizeBytes: number, compressedSizeBytes: number): string {
  const compressionRate = (1 - compressedSizeBytes / originalSizeBytes) * 100;
  return `${compressionRate.toFixed(2)}%`;
}

function truncateString(str: string, maxLength: number): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + "...";
  }
  return str;
}

function isImage(filePath: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
  const ext = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(ext);
}