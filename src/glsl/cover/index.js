import { ShaderMaterial, Vector2 } from 'three'
import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

export default class CoverMaterial extends ShaderMaterial {

    constructor({ meshSize }) {
        super({
            vertexShader,
            fragmentShader,
            transparent: true,
        })

        this.uniforms = {
            uTime: { value: 0 },
            uAlpha: { value: 1 },
            uTexture: { value: 0 },
            uMeshSize: { value: new Vector2(meshSize.width, meshSize.height) },
            uImageSize: { value: new Vector2(0, 0) },
            uScale: { value: 1 },
            uVelo: { value: 0 },
            uAngle: { value: APP.Store.ANGLE },
        }
    }

}
