import C from 'cannon'
import { Vector3 } from 'three'
import gsap from 'gsap'
import { ev } from './utils'

export default class Cloth {

    constructor(tile, world) {
        this.activeTile = tile
        this.world = world
        this.totalMass = APP.Layout.isMobile ? 3 : 1

        const { widthSegments, heightSegments } = this.activeTile.geo.parameters

        this.mass = this.totalMass / (widthSegments * heightSegments)

        this.stitchesShape = new C.Particle()
        this.tempV         = new Vector3()
        this.isResting     = false
        this.isSlowingDown = false

        this.setStitches()

        this.bindEvents()
    }


    bindEvents() {
        document.addEventListener('stormIsCalmingDown', this.rest.bind(this))
        document.addEventListener('windBlowing', this.onToggleWind.bind(this))
    }



    /* Handlers
    --------------------------------------------------------- */

    onToggleWind({ detail: { windBlowing } }) {
        this.isSlowingDown = windBlowing
    }


    /* Actions
    --------------------------------------------------------- */

    update() {
        this.slowDown()
        this.render()
    }

    forceReset() {
        this.stitches.forEach((stitch) => {
            stitch.velocity.set(0, 0, 0)
            stitch.position.copy(stitch.initPosition)

            // gsap.to(stitch.position, {
            //     duration: 0.5,
            //     x: stitch.initPosition.x,
            //     y: stitch.initPosition.y,
            //     z: stitch.initPosition.z,
            //     ease: 'power3.out',
            // })
        })
    }

    slowDown() {
        if (!this.isSlowingDown) return

        this.stitches.forEach((stitch) => {
            stitch.velocity.scale(0)
        })
    }

    render() {
        const { position } = this.activeTile.geo.attributes
        const { width, height } = this.activeTile.rect

        for (let i = 0; i < position.count; i++) {
            const p = this.tempV.copy(this.stitches[i].position)

            position.setXYZ(i, p.x / width, p.y / height, p.z)
        }

        position.needsUpdate = true
    }

    rest() {
        if (this.isResting) return

        const positions = this.stitches.map((s) => s.position)
        const { heightSegments: cols, widthSegments: rows } = this.activeTile.geo.parameters


        gsap.to(positions, {
            duration: APP.Layout.isMobile ? 0.4 : 0.8,
            x: (i) => this.initPositions[i].x,
            y: (i) => this.initPositions[i].y,
            z: (i) => this.initPositions[i].z,
            ease: 'power2.out',
            stagger: {
                grid: [cols, rows],
                axis: 'y',
                amount: 0.1,
            },

            onStart: () => {
                this.isResting = true
                this.stitches.forEach((s) => s.sleep())
                if (this.restTimer) {
                    clearTimeout(this.restTimer)
                }
            },

            onComplete: () => {
                const delay = APP.Layout.isMobile ? 200 : 1000
                this.restTimer = setTimeout(() => {
                    this.isResting = false
                    this.stitches.forEach((s) => s.wakeUp())
                }, delay)
                // ev('windBlowing', { windBlowing: false })
            },
        })
    }

    changeActiveTile(tile) {
        this.forceReset()
        this.activeTile = tile
    }


    connect(i, j) {
        const c = new C.DistanceConstraint(
            this.stitches[i],
            this.stitches[j],
        )

        this.world.addConstraint(c)
        c.collideConnected = true
    }


    applyWind(wind) {
        // APP.Scene.toggleGravity(!this.isResting)

        if (!wind.isBlowing) return

        const { position } = this.activeTile.geo.attributes
        const { length } = wind.flowfield
        const { count } = position
        const tempVec = new C.Vec3()

        for (let i = 0; i < position.count; i++) {
            const stitch = this.stitches[i]

            const windNoise = wind.flowfield[i]
            const tempPosPhysic = tempVec.set(windNoise.x, windNoise.y, windNoise.z)

            stitch.applyLocalForce(tempPosPhysic, C.Vec3.ZERO)
        }
    }


    /* Values
    --------------------------------------------------------- */

    setStitches() {
        const { position } = this.activeTile.geo.attributes
        const { heightSegments: cols, widthSegments: rows } = this.activeTile.geo.parameters
        const { width, height } = this.activeTile.rect
        const isInit = this.stitches === undefined

        if (isInit) {
            this.stitches = []
        }

        for (let i = 0; i < position.count; i++) {
            // const col = (i % (cols + 1))
            // const row = Math.floor(i / (rows + 1))
            const pos = new C.Vec3(
                position.getX(i) * width,
                position.getY(i) * height,
                position.getZ(i),
            )

            if (isInit) {
                const stitch = new C.Body({
                    mass: this.mass,
                    linearDamping: 0.8,
                    position: pos,
                    shape: this.stitchesShape,
                })

                this.stitches.push(stitch)

                this.world.addBody(stitch)
            } else {
                this.stitches[i].position.set(pos.x, pos.y, pos.z)
            }
        }

        this.initPositions = this.stitches.map((s) => s.initPosition)

        this.sewEverything()
    }


    sewEverything() {
        const { position } = this.activeTile.geo.attributes
        const { heightSegments: cols, widthSegments: rows } = this.activeTile.geo.parameters

        for (let i = 0; i < position.count; i++) {
            const col = (i % (cols + 1))
            const row = Math.floor(i / (rows + 1))

            if (col < cols) this.connect(i, i + 1)
            if (row < rows) this.connect(i, i + rows + 1)

            if (row === 0) {
                const pos = this.stitches[i].position.clone()

                pos.y += 100

                const b = new C.Body({
                    mass: 0,
                    position: pos,
                    shape: new C.Particle(),
                })

                const cons = new C.DistanceConstraint(
                    this.stitches[i],
                    b,
                )

                this.world.addConstraint(cons)
            }
        }
    }

}




/* CONSTANTS & HELPERS
---------------------------------------------------------------------------------------------------- */
