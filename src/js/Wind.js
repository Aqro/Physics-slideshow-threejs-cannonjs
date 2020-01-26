import SimplexNoise from 'simplex-noise'
import { Clock, Vector3 } from 'three'
import gsap from 'gsap'

import { map } from './utils'

const noise = new SimplexNoise()
const subdivision = 1
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

            subCols: Math.floor((this.activeTile.geo.parameters.widthSegments + 1) / subdivision),
            subRows: Math.floor((this.activeTile.geo.parameters.heightSegments + 1) / subdivision),
        }

        this.flowfield = new Array(this.sizes.subCols * this.sizes.subRows)

        this.isBlowing = false

        this.update()

        this.bindEvents()
    }


    bindEvents() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        document.addEventListener('windBlowing', this.onWindChange.bind(this))
    }



    /* Handlers
    --------------------------------------------------------- */

    onMouseMove({ clientX: x, clientY: y }) {
        const { W, H, isMobile } = APP.Layout

        if (isMobile) return

        gsap.to(this.direction, {
            duration: 0.3,
            x: (x / W) - 0.5,
            y: -(y / H) + 0.5,
        })
    }

    onWindChange({ detail: { windBlowing } }) {
        this.isBlowing = windBlowing

        gsap.to(this, {
            duration: windBlowing ? 2 : 0,
            force: windBlowing ? baseForce : 0,
        })
    }


    /* Actions
    --------------------------------------------------------- */



    /* Values
    --------------------------------------------------------- */


    update() {
        // if (!this.isBlowing) return

        const time = this.clock.getElapsedTime() * 2

        const { position } = this.activeTile.geo.attributes
        const { subRows: rows, subCols: cols } = this.sizes


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
