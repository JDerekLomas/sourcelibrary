from io import BytesIO
from PIL import Image
import aiohttp

# Disable DecompressionBombError for large images
# Image.MAX_IMAGE_PIXELS = None

class MockUploadFile:
    def __init__(self, file_obj, filename, content_type):
        self.file = file_obj
        self.filename = filename
        self.content_type = content_type

async def compress_image(file, max_width: int) -> BytesIO:
    # Handle both UploadFile and BytesIO objects
    if hasattr(file, 'file'):
        # It's an UploadFile or similar object
        # Ensure we can read from it
        file.file.seek(0)  # Reset to beginning
        image = Image.open(file.file)
    else:
        # It's already a BytesIO object
        file.seek(0)  # Reset to beginning
        image = Image.open(file)
    
    return await _get_compressed_jpeg(image, max_width)    

async def get_compressed_image_from_url(image_url: str, max_width: int) -> BytesIO:
    """Generate a compressed thumbnail from an existing image URL"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(image_url) as response:
                response.raise_for_status()
                content = await response.read()
        
        image = Image.open(BytesIO(content))
        return await _get_compressed_jpeg(image, max_width)                
        
    except Exception as e:
        raise Exception(f"Failed to generate thumbnail: {str(e)}")
    
async def _get_compressed_jpeg(image: Image.Image, max_width: int, quality: int = 85) -> BytesIO:
    """Helper function to process and compress a PIL Image object."""
    # Check for EXIF orientation and rotate if needed
    try:
        exif = image.getexif()
        if exif:
            orientation = exif.get(274)  # 274 is the orientation tag
            if orientation == 3:
                image = image.rotate(180, expand=True)
            elif orientation == 6:
                image = image.rotate(270, expand=True)
            elif orientation == 8:
                image = image.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        pass
    
    # Calculate new height maintaining aspect ratio
    aspect_ratio = image.height / image.width
    new_width = max_width
    new_height = int(max_width * aspect_ratio)
    
    # Resize image
    resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Convert RGBA to RGB if necessary (for JPEG compatibility)
    if resized_image.mode == 'RGBA':
        # Create a white background
        rgb_image = Image.new('RGB', resized_image.size, (255, 255, 255))
        rgb_image.paste(resized_image, mask=resized_image.split()[-1])  # Use alpha channel as mask
        resized_image = rgb_image
    
    # Save to BytesIO
    output = BytesIO()
    resized_image.save(output, format='JPEG', quality=quality)
    output.seek(0)
    return output