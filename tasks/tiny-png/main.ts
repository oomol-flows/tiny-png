import type { Context } from "@oomol/types/oocana";
import tinify from "tinify";
import path from "path";
import fs from "fs";

type Inputs = {
  image: string;
  key: string;
  save_address: string | null;
};

type Outputs = {
  address: string;
};

export default async function (
  params: Inputs,
  context: Context<Inputs, Outputs>
): Promise<Outputs> {
  const { key, image, save_address } = params;

  // 获取原始图片大小
  const originalSizeBytes = fs.statSync(image).size;
  const originalSize = formatFileSize(originalSizeBytes);

  // 设置 TinyPNG API 密钥
  tinify.key = key;

  // 生成保存路径
  const mySavePath = getSavePath(image, save_address, context.sessionDir);

  // 使用 TinyPNG 压缩图片
  const source = tinify.fromFile(image);
  await source.toFile(mySavePath);

  // 获取压缩后图片大小
  const compressedSizeBytes = fs.statSync(mySavePath).size;
  const compressedSize = formatFileSize(compressedSizeBytes);

  // 计算压缩率
  const compressionRate = calculateCompressionRate(originalSizeBytes, compressedSizeBytes);

  // 生成 Markdown 表格
  const markdownTable = generateMarkdownTable({
    imageName: path.basename(image),
    originalSize,
    compressedSize,
    compressionRate,
  });
  context.preview({
    type: "markdown",
    data: markdownTable,
  })
  // 返回结果
  return {
    address: mySavePath,
  };
};

// 生成保存路径
function getSavePath(image: string, save_address: string | null, sessionDir: string): string {
  const fileName = path.basename(image);
  const saveDir = save_address ? save_address : sessionDir;
  return `${saveDir}/tiny_${fileName}`;
}

// 将字节大小转换为更友好的格式（KB 或 MB）
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`; // 字节
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`; // KB
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`; // MB
  }
}

// 计算压缩率
function calculateCompressionRate(originalSizeBytes: number, compressedSizeBytes: number): string {
  const compressionRate = (1 - compressedSizeBytes / originalSizeBytes) * 100;
  return `${compressionRate.toFixed(2)}%`;
}

// 生成 Markdown 表格
function generateMarkdownTable({
  imageName,
  originalSize,
  compressedSize,
  compressionRate,
}: {
  imageName: string;
  originalSize: string;
  compressedSize: string;
  compressionRate: string;
}): string {
  const truncatedImageName = truncateString(imageName, 20); 
  const table = `
| Name       | Original     | Compressed | Compression Rate  |
|----------------|------------|------------|---------|
| ${truncatedImageName}   | ${originalSize} | ${compressedSize} | ${compressionRate} |
`;

  return table;
}

// 限制字符串长度
function truncateString(str: string, maxLength: number): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + "...";
  }
  return str;
}