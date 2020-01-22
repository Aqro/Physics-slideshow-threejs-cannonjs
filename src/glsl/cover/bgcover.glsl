vec2 cover(vec2 sz, vec2 is, vec2 uv) {
  float screenRatio = sz.x / sz.y;
  float imageRatio = is.x / is.y;

  vec2 newSize = screenRatio < imageRatio
      ? vec2(is.x * sz.y / is.y, sz.y)
      : vec2(sz.x, is.y * sz.x / is.x);

  vec2 newOffset = (screenRatio < imageRatio
      ? vec2((newSize.x - sz.x) / 2.0, 0.0)
      : vec2(0.0, (newSize.y - sz.y) / 2.0)) / newSize;

  return uv * sz / newSize + newOffset;
}

#pragma glslify: export(cover);
