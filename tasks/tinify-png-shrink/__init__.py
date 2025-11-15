#region generated meta
import typing
class Inputs(typing.TypedDict):
    image_url: str
class Outputs(typing.TypedDict):
    compressed_image_url: typing.NotRequired[str]
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

    return {"compressed_image_url": compressed_url}
