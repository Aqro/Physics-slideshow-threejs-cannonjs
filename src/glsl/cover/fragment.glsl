#pragma glslify: cover = require(./bgcover.glsl);
#pragma glslify: rotateUV = require(./rotateUV.glsl);
#pragma glslify: scaleUV = require(./scaleUV.glsl);

varying vec2 vUv;

uniform sampler2D uTexture;
uniform vec2 uMeshSize;
uniform vec2 uImageSize;
uniform float uScale;
uniform float uAngle;
uniform float uAlpha;

void main() {

    vec2 uv = vUv;
    // uv = scaleUV(uv, 0.7);
    uv -= 0.5;
    uv *= uScale;
    uv += 0.5;
    uv = cover(uMeshSize, uImageSize, uv);

    vec2 texUv = rotateUV(uv, -uAngle);
    vec4 img = texture2D(uTexture, texUv);
    gl_FragColor = vec4(img.rgb, uAlpha);
}
