#region generated meta
import typing
class Inputs(typing.TypedDict):
    image_url: str
class Outputs(typing.TypedDict):
    compressed_image_url: typing.NotRequired[str]
    original_size: typing.NotRequired[float]
    compressed_size: typing.NotRequired[float]
    compression_ratio: typing.NotRequired[float]
#endregion

from oocana import Context
import requests

async def main(params: Inputs, context: Context) -> Outputs:
    """
    Compress image using TinyPNG API service.

    Args:
        params: Input parameters containing image_url
        context: OOMOL context

    Returns:
        Compression result data
    """
    image_url = params["image_url"]

    # Get OOMOL token for oomol.com domain
    token = await context.oomol_token()

    # API endpoint
    api_url = "https://fusion-api.oomol.com/v1/tinify-png-shrink/action/compress"

    # Prepare headers
    headers = {
        "Authorization": token,
        "Content-Type": "application/json"
    }

    # Prepare request body
    payload = {
        "imageURL": image_url
    }

    # Make POST request
    response = requests.post(
        api_url,
        headers=headers,
        json=payload,
        timeout=30.0
    )

    # Check if request was successful
    response.raise_for_status()

    # Parse response
    result = response.json()

    # Extract compressed image URL from response
    compressed_url = result.get("compressedImageURL", "")

    # Get original image size
    original_response = requests.head(image_url, timeout=10.0)
    original_size = int(original_response.headers.get("Content-Length", 0))

    # Get compressed image size
    compressed_response = requests.head(compressed_url, timeout=10.0)
    compressed_size = int(compressed_response.headers.get("Content-Length", 0))

    # Calculate compression ratio
    compression_ratio = 0.0
    if original_size > 0:
        compression_ratio = ((original_size - compressed_size) / original_size) * 100

    # Display compression results
    context.preview({
        "type": "markdown",
        "data": f"""## Image Compression Results

- **Original Size**: {original_size / 1024:.2f} KB
- **Compressed Size**: {compressed_size / 1024:.2f} KB
- **Compression Ratio**: {compression_ratio:.2f}%
- **Space Saved**: {(original_size - compressed_size) / 1024:.2f} KB

**Compressed Image URL**: {compressed_url}"""
    })

    return {
        "compressed_image_url": compressed_url,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "compression_ratio": compression_ratio
    }
