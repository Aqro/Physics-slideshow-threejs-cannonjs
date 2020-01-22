vec2 scaleUV(vec2 uv, float scl)
{
    float mid = 0.5;
    return vec2(
        uv.x * scl + mid,
        uv.y * scl + mid
    );
}

#pragma glslify: export(scaleUV)
