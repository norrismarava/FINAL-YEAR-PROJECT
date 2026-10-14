"""Remove the pasted WaitLess mark + tagline from BACKG.png's left wall.

Fills the region by interpolating clean boundary colours per row and then
relaxing it with directional diffusion (right + up + clean left rows only,
so the plant and carts can't bleed in).
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

IMG = r"C:\Users\norri\Videos\DIGITAL QUE SYSTEM\WAITLESS\frontend\src\assets\BACKG.png"
OUT = IMG

im = Image.open(IMG).convert("RGB")
W, H = im.size

x0, y0, x1, y1 = 148, 360, 530, 568          # mark + tagline region
mask = np.zeros((H, W), dtype=np.uint8)
mask[y0:y1, x0:x1] = 255

# proper inpaint — Telea propagates the wall's texture/gradient inward
bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
out = cv2.inpaint(bgr, mask, 12, cv2.INPAINT_TELEA)
im = Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))

# add fine grain matching the wall's texture — inpainting is too smooth
rng = np.random.default_rng(7)
arr = np.asarray(im).astype(np.float64)
# measure the wall's noise level on a clean strip beside the patch
sample = np.asarray(im.crop((x1 + 30, y0 + 40, x1 + 120, y0 + 160))).astype(np.float64)
sigma = min(4.0, max(1.5, sample.std(axis=(0, 1)).mean() * 0.55))
arr[y0:y1, x0:x1] += rng.normal(0, sigma, (y1 - y0, x1 - x0, 1))
im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

# soften patch edges so the blend hides any residual seam
patch = im.crop((x0 - 6, y0 - 6, x1 + 6, y1 + 6)).filter(ImageFilter.GaussianBlur(5))
m = Image.new("L", (x1 - x0 + 12, y1 - y0 + 12), 0)
ImageDraw.Draw(m).rectangle((6, 6, x1 - x0 + 5, y1 - y0 + 5), fill=255)
im.paste(patch, (x0 - 6, y0 - 6), m.filter(ImageFilter.GaussianBlur(5)))

im.save(OUT)
print("saved", OUT)
