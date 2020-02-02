import SimplexNoise from 'simplex-noise'
import { Clock, Vector3 } from 'three'
import gsap from 'gsap'

import { map } from './utils'

const noise = new SimplexNoise()
const off = 0.1
const baseForce = 40

export default class Wind {

    constructor(tile) {
        this.activeTile = tile
        this.clock = new Clock()

        this.force = APP.Layout.isMobile ? baseForce / 1000 : baseForce
        this.direction = new Vector3(0.5, 0, -1)

        this.sizes = {
            cols: this.activeTile.geo.parameters.widthSegments,
            rows: this.activeTile.geo.parameters.heightSegments,
        }

        this.flowfield = new Array(this.sizes.cols * this.sizes.rows)
        this.isBlowing = false

        this.update()

        this.bindEvents()
    }


    bindEvents() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        document.addEventListener('windBlowing', this.onWindChange.bind(this))
        document.addEventListener('stormIsCalmingDown', this.onWindChange.bind(this, false))
    }



    /* Handlers
    --------------------------------------------------------- */

    onMouseMove({ clientX: x, clientY: y }) {
        const { W, H, isMobile } = APP.Layout

        if (isMobile) return

        gsap.to(this.direction, {
            duration: 0.1,
            x: (x / W) - 0.5,
            y: -(y / H) + 0.5,
        })
    }

    onWindChange(ev) {
        this.isBlowing = !ev || ev.detail.windBlowing

        gsap.to(this, {
            duration: this.isBlowing ? 2 : 0,
            force: this.isBlowing ? baseForce : 0,
        })
    }


    /* Actions
    --------------------------------------------------------- */



    /* Values
    --------------------------------------------------------- */


    update() {
        const time = this.clock.getElapsedTime() * 2

        const { position } = this.activeTile.geo.attributes
        const { rows, cols } = this.sizes


        for (let i = 0; i < position.count; i++) {
            const col = (i % (cols))
            const row = Math.floor(i / (rows))

            const force = map(noise.noise3D(row * off, col * off, time), -1, 1, -this.force * 0.1, this.force)

            this.flowfield[i] = this.direction.clone().multiplyScalar(force)
        }
    }


}




/* CONSTANTS & HELPERS
---------------------------------------------------------------------------------------------------- */
