import {
  ShaderMount,
  paperTextureFragmentShader,
  getShaderColorFromString,
  getShaderNoiseTexture,
} from "https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.80/+esm";

const host = document.querySelector(".paper-bg");
const noise = getShaderNoiseTexture();
if (host && !noise.complete) await new Promise((r) => (noise.onload = r));
if (host) {
  new ShaderMount(
    host,
    paperTextureFragmentShader,
    {
      u_colorFront: getShaderColorFromString("#e9e1d6"),
      u_colorBack: getShaderColorFromString("#ffffff"),
      u_contrast: 0.22,
      u_roughness: 0.3,
      u_fiber: 0.3,
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
