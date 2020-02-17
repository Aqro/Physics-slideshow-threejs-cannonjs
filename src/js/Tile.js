import {
    PlaneBufferGeometry,
    Mesh,
    TextureLoader,
} from 'three'

import gsap from 'gsap'
import O from './O'
import CoverMaterial from '../glsl/cover'
import { clamp } from './utils'


const cols = 8
const rows = 8


export default class Tile extends O {

    init(el, { scene }) {
        super.init(el)

        const { width, height } = this.rect

        this.scene = scene
        this.geo = new PlaneBufferGeometry(1, 1, cols, rows)
        this.mat = new CoverMaterial({ meshSize: this.rect })
        this.img = this.el.querySelector('img')

        this.texture = loader.load(this.img.src, (texture) => {
            this.mat.uniforms.uTexture.value = texture
            this.mat.uniforms.uImageSize.value = [this.img.naturalWidth, this.img.naturalHeight]
        })

        this.mesh = new Mesh(this.geo, this.mat)
        this.mesh.scale.set(width, height, 1)

        this.mat.uniforms.uScale.value = Math.max(width, height) / Math.hypot(width, height)
        this.geo.attributes.initPos    = this.geo.attributes.position.clone()

        this.add(this.mesh)
        this.scene.add(this)

        this.bindEvents()
    }

    bindEvents() {
        document.addEventListener('rotateCam', this.onDistort.bind(this))
    }

    /* Handlers
    --------------------------------------------------------- */

    onDistort({ detail: { delta } }) {
        const { width, height } = this.rect
        const sclX = clamp(1 - Math.abs(delta), 0.8, 1)

        gsap.to(this.mesh.scale, {
            duration: 0.5,
            x: sclX * width,
            y: height,
            z: 1,
        })
    }

}


/* CONST & HELPERS
---------------------------------------------------------------------------------------------------- */

const loader = new TextureLoader()

