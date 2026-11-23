// Dust gathers from the edges into the flower. uProgress drives the gather, uExplode the exit.
export const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uExplode;
  uniform float uScale;
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute vec4 aRand;
  varying float vAlpha;
  varying float vHeat;

  mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  void main() {
    float p = clamp((uProgress - aRand.x * 0.45) / 0.55, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - p, 3.0);

    vec3 pos = mix(aStart, aTarget, e);
    pos.xy = rot((1.0 - e) * (aRand.y * 2.0 - 1.0) * 3.2) * pos.xy;

    float breathe = 1.0 + 0.018 * sin(uTime * 1.2 + aRand.w * 6.2831);
    pos.xy *= mix(1.0, breathe, e);
    pos.z += sin(uTime * 0.8 + aRand.w * 6.2831) * 0.012 * e;
    pos.xy = rot(uTime * 0.045 * e) * pos.xy;

    pos += normalize(pos + vec3(0.0001)) * uExplode * (1.4 + aRand.y * 3.2);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float tw = 0.62 + 0.38 * sin(uTime * 2.0 + aRand.w * 40.0);
    float world = 0.006 + aRand.z * 0.017;
    gl_PointSize = world * uScale / -mv.z * (1.0 + (1.0 - e) * 0.6);
    vAlpha = (0.2 + 0.8 * e) * (0.7 + 0.3 * tw) * (1.0 - uExplode);
    vHeat = aRand.z;
  }
`;

export const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHi;
  varying float vAlpha;
  varying float vHeat;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.6);
    vec3 col = mix(uColor, uHi, vHeat * 0.75);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;
