import {
  ShaderMount,
  paperTextureFragmentShader,
  getShaderColorFromString,
  getShaderNoiseTexture,
  emptyPixel,
} from "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.80/+esm";

const host = document.querySelector(".paper-bg-mount");
if (host) {
  // the paper-texture shader only draws once an image uniform is bound, so feed it a transparent pixel
  const blank = new Image();
  blank.src = emptyPixel;
  const noise = getShaderNoiseTexture();
  await Promise.all([blank.decode(), noise.complete ? null : new Promise((r) => (noise.onload = r))]);

  window.__paperShader = new ShaderMount(
    host,
    paperTextureFragmentShader,
    {
      u_image: blank,
      u_colorFront: getShaderColorFromString("#e6ddd0"),
      u_colorBack: getShaderColorFromString("#ffffff"),
      u_contrast: 0.35,
      u_roughness: 0.45,
      u_fiber: 0.4,
      u_fiberSize: 0.2,
      u_crumples: 0.12,
      u_crumpleSize: 0.35,
      u_foldCount: 3,
      u_folds: 0.3,
      u_fade: 0,
      u_drops: 0.08,
      u_seed: 5.8,
      u_noiseTexture: noise,
      u_fit: 2,
      u_scale: 0.6,
      u_rotation: 0,
      u_offsetX: 0,
      u_offsetY: 0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_worldWidth: 0,
      u_worldHeight: 0,
    },
    undefined,
    0
  );
}
