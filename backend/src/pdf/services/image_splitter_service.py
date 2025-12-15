from PIL import Image
from io import BytesIO
from typing import Tuple
from dataclasses import dataclass


@dataclass
class BoundingBox:
    xmin: float  # 0-100 percentage
    ymin: float
    xmax: float
    ymax: float


def crop_by_percentage(
    image: Image.Image,
    bbox: BoundingBox
) -> Image.Image:
    """
    Crop image using percentage-based coordinates (0-100).

    Args:
        image: PIL Image
        bbox: BoundingBox with xmin, ymin, xmax, ymax as percentages

    Returns:
        Cropped PIL Image
    """
    width, height = image.size
    left = int(width * bbox.xmin / 100)
    upper = int(height * bbox.ymin / 100)
    right = int(width * bbox.xmax / 100)
    lower = int(height * bbox.ymax / 100)

    # Ensure valid crop coordinates
    left = max(0, min(left, width))
    right = max(0, min(right, width))
    upper = max(0, min(upper, height))
    lower = max(0, min(lower, height))

    if right <= left or lower <= upper:
        raise ValueError(f"Invalid crop coordinates: left={left}, right={right}, upper={upper}, lower={lower}")

    return image.crop((left, upper, right, lower))


def image_to_bytes(
    image: Image.Image,
    format: str = "JPEG",
    quality: int = 90
) -> BytesIO:
    """
    Convert PIL Image to BytesIO.

    Args:
        image: PIL Image
        format: Output format (JPEG, PNG, etc.)
        quality: Compression quality for JPEG (1-100)

    Returns:
        BytesIO containing the image data
    """
    buffer = BytesIO()

    # Convert RGBA to RGB for JPEG compatibility
    if format.upper() == "JPEG" and image.mode == "RGBA":
        rgb_image = Image.new("RGB", image.size, (255, 255, 255))
        rgb_image.paste(image, mask=image.split()[-1])
        image = rgb_image
    elif format.upper() == "JPEG" and image.mode != "RGB":
        image = image.convert("RGB")

    image.save(buffer, format=format, quality=quality)
    buffer.seek(0)
    return buffer


def split_spread_image(
    image: Image.Image,
    left_bbox: BoundingBox,
    right_bbox: BoundingBox
) -> Tuple[Image.Image, Image.Image]:
    """
    Split a two-page spread into left and right pages.

    Args:
        image: PIL Image of the spread
        left_bbox: Bounding box for left page
        right_bbox: Bounding box for right page

    Returns:
        Tuple of (left_page_image, right_page_image)
    """
    left_page = crop_by_percentage(image, left_bbox)
    right_page = crop_by_percentage(image, right_bbox)
    return left_page, right_page
