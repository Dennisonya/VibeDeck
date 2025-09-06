// Utility function to extract dominant colors from album cover images
export const extractDominantColor = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to a smaller size for performance
        canvas.width = 50;
        canvas.height = 50;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate average color
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          pixelCount++;
        }
        
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);
        
        // Convert to HSL for better color manipulation
        const hsl = rgbToHsl(r, g, b);
        
        // Adjust saturation and lightness for better backgrounds
        const adjustedHsl = {
          h: hsl.h,
          s: Math.min(hsl.s * 1.2, 100), // Increase saturation slightly
          l: Math.max(hsl.l * 0.7, 20)   // Darken for better text contrast
        };
        
        const adjustedRgb = hslToRgb(adjustedHsl.h, adjustedHsl.s, adjustedHsl.l);
        
        resolve({
          rgb: `rgb(${adjustedRgb.r}, ${adjustedRgb.g}, ${adjustedRgb.b})`,
          hex: rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b),
          hsl: adjustedHsl
        });
      } catch (error) {
        console.error('Error extracting color:', error);
        // Fallback to a default color
        resolve({
          rgb: 'rgb(29, 185, 84)',
          hex: '#1db954',
          hsl: { h: 141, s: 73, l: 42 }
        });
      }
    };
    
    img.onerror = () => {
      // Fallback to default Spotify green
      resolve({
        rgb: 'rgb(29, 185, 84)',
        hex: '#1db954',
        hsl: { h: 141, s: 73, l: 42 }
      });
    };
    
    img.src = imageUrl;
  });
};

// Helper function to convert RGB to HSL
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// Helper function to convert HSL to RGB
const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

// Helper function to convert RGB to hex
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
