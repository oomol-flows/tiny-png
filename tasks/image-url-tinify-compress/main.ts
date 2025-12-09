//#region generated meta
type Inputs = {
  image_url: string;
  save_path: string | null;
};
type Outputs = {
  compressed_url: string;
  compressed_file: string;
};
//#endregion
import type { Context } from "@oomol/types/oocana";
import * as fs from "fs";
import * as path from "path";

export default async function(
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void>  {
  const apiUrl = "https://fusion-api.oomol.com/v1/tinify-png-shrink/action/compress";
  const token = await context.getOomolToken();

  const imageURL = params.image_url;

  // Validate input URL
  if (!imageURL || imageURL.trim() === "") {
    throw new Error("Image URL cannot be empty");
  }

  try {
    // Report progress
    await context.reportProgress(10);

    // Send compression request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageURL: imageURL
      }),
    });

    await context.reportProgress(50);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Image compression failed: ${response.status} - ${errorData}`);
    }

    const responseData = await response.json();

    await context.reportProgress(60);

    // Extract compressed image URL from response
    // API returns: { success: true, data: { compressedImageUrl: "...", width, height, contentType, outputId } }
    const compressedUrl = responseData.data?.compressedImageUrl || "";

    if (!compressedUrl) {
      throw new Error(`Failed to get compressed image URL from API response. Response data: ${JSON.stringify(responseData)}`);
    }

    // Download the compressed image
    const downloadResponse = await fetch(compressedUrl, {
      headers: {
        'Authorization': token,
      },
    });

    await context.reportProgress(80);

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download compressed image: ${downloadResponse.status}`);
    }

    // Get the image buffer
    const imageBuffer = await downloadResponse.arrayBuffer();

    // Determine file extension from content type or URL
    const contentType = responseData.data?.contentType || downloadResponse.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : '.jpg';

    // Determine output path
    let outputPath: string;
    if (params.save_path && params.save_path.trim() !== "") {
      // Use user-specified path
      outputPath = params.save_path;
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      await fs.promises.mkdir(dir, { recursive: true });
    } else {
      // Auto-generate path in oomol-storage
      const filename = `compressed_${Date.now()}${ext}`;
      outputPath = path.join('/oomol-driver/oomol-storage', filename);
    }

    // Save the file
    await fs.promises.writeFile(outputPath, Buffer.from(imageBuffer));

    await context.reportProgress(100);

    return {
      compressed_url: compressedUrl,
      compressed_file: outputPath
    };

  } catch (error: any) {
    throw new Error(`Error compressing image: ${error.message}`);
  }
}
