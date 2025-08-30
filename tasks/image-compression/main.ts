//#region generated meta
type Inputs = {
  input_image: string;
  output_image: string | null;
};
type Outputs = {
  compressed_image: string;
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
};
//#endregion
import type { Context } from "@oomol/types/oocana";
import fs from "fs";
import path from "path";

export default async function(
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void>  {
  const consoleApiUrl = context.OOMOL_LLM_ENV.baseUrl;
  const apiKey = context.OOMOL_LLM_ENV.apiKey;

  const inputPath = params.input_image;
  const outputPath = params.output_image;

  // Validate input file
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file does not exist: ${inputPath}`);
  }

  // Set output path
  const inputFile = path.parse(inputPath);
  let finalOutputPath: string;
  
  if (outputPath === null) {
    const outputFilename = `${inputFile.name}_compressed${inputFile.ext}`;
    finalOutputPath = path.join(context.sessionDir, context.jobId, outputFilename);
  } else {
    // 即使outputPath不为空，也在文件名中添加 _compressed 后缀
    const outputFile = path.parse(outputPath);
    const outputFilename = `${outputFile.name}_compressed${outputFile.ext}`;
    finalOutputPath = path.join(outputFile.dir, outputFilename);
  }

  // Read input image size
  const inputSize = fs.statSync(inputPath).size;

  try {
    // Prepare file upload
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(inputPath);
    const fileName = path.basename(inputPath);
    
    // 创建 Blob 对象
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, fileName);
    // 发送压缩请求
    const response = await fetch(
      `${consoleApiUrl}/api/tasks/images/compressions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Image compression failed: ${errorData}`);
    }

    const responseData = await response.json();

    // Get compressed image URL
    const compressedUrl = responseData.data.output.url;
    
    // Download compressed image
    const downloadResponse = await fetch(compressedUrl);
    
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download compressed image: ${downloadResponse.statusText}`);
    }
    
    const arrayBuffer = await downloadResponse.arrayBuffer();
    
    // Ensure output directory exists
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save compressed image
    fs.writeFileSync(finalOutputPath, Buffer.from(arrayBuffer));
    
    // Get compressed file size
    const compressedSize = fs.statSync(finalOutputPath).size;
    
    // Calculate compression ratio
    const compressionRatio = ((inputSize - compressedSize) / inputSize) * 100;
    
    // Display compression results
    context.preview({
      type: "markdown",
      data: `## Image Compression Results

- **Original Size**: ${(inputSize / 1024).toFixed(2)} KB
- **Compressed Size**: ${(compressedSize / 1024).toFixed(2)} KB
- **Compression Ratio**: ${compressionRatio.toFixed(2)}%
- **Space Saved**: ${((inputSize - compressedSize) / 1024).toFixed(2)} KB

**File Location**: ${finalOutputPath}`
    });
    
    return {
      compressed_image: finalOutputPath,
      original_size: inputSize,
      compressed_size: compressedSize,
      compression_ratio: compressionRatio
    };
    
  } catch (error: any) {
    throw new Error(`Error compressing image: ${error.message}`);
  }
}