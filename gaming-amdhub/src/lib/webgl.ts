/** WebGL checks without importing three.js (keeps the main bundle free of it). */
export function webglAvailable(): boolean {
  return webglTier() !== 'none';
}

export type WebglTier = 'none' | 'software' | 'hardware';

let cached: WebglTier | null = null;

/**
 * "software" = WebGL drawn by the CPU (SwiftShader, llvmpipe…): a 3D scene would block the
 * page for seconds on such a device, so pages show the flat drawing and offer 3D on request.
 * Add ?3d=1 to the URL to force 3D (testing).
 */
export function webglTier(): WebglTier {
  if (cached) return cached;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return (cached = 'none');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const forced = /[?&]3d=1\b/.test(window.location.search);
    cached = !forced && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer) ? 'software' : 'hardware';
  } catch {
    cached = 'none';
  }
  return cached;
}
