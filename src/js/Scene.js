import * as THREE from 'three'
import C from 'cannon'
import OrbitControls from 'three-orbitcontrols'
import gsap from 'gsap'
import { ev } from './utils'
import Slideshow from './Slideshow'

const perspective = 800

export default class Scene {

    constructor() {
        this.$stage = document.getElementById('stage')

        window.scrollTo(0, 0)

        this.setup()
        this.bindEvents()
    }

    bindEvents() {
        window.addEventListener('resize', () => { this.onResize() })
        window.addEventListener('wheel', (e) => { this.onScroll(e) }, { passive: false })

        document.addEventListener('rotateCam', this.onDelta.bind(this))
        document.addEventListener('toggleGravity', this.toggleGravity.bind(this))
    }


    setup() {
        // Init Physics world
        this.world = new C.World()
        setTimeout(() => {
            ev('windBlowing', { windBlowing: true })
            ev('toggleGravity', { shouldEverythingFalls: true })
        }, 1000)

        // Init Three components
        this.scene = new THREE.Scene()

        this.setCamera()
        this.setLights()

        this.addObjects()

        this.setRender()
    }


    /* Handlers
    --------------------------------------------------------- */

    onScroll(e) {
        e.preventDefault()
    }

    onDelta({ detail }) {
        const { delta } = detail

        gsap.to(this.camera.rotation, {
            duration: 1,
            z: this.camera.baseRotation - delta * 0.2,
            ease: 'strong.out',
        })

        this.camera.updateProjectionMatrix()
    }

    onResize() {
        const { W, H } = APP.Layout

        this.camera.aspect = W / H

        this.camera.updateProjectionMatrix()
        this.renderer.setSize(W, H)
    }


    /* Actions
    --------------------------------------------------------- */

    toggleGravity({ detail: { shouldEverythingFalls } }) {
        gsap.to(this.world.gravity, {
            duration: shouldEverythingFalls ? 2 : 0,
            y: shouldEverythingFalls ? -800 : 0,
        })
    }

    setCamera() {
        const { W, H } = APP.Layout

        const fov = getFov(perspective)

        const y = APP.Layout.isMobile ? 0 : 0

        this.camera = new THREE.PerspectiveCamera(fov, W / H, 1, 2000)
        this.camera.position.set(0, y, perspective)

        this.camera.baseRotation = -APP.Store.ANGLE

        this.camera.rotateZ(this.camera.baseRotation)
    }

    setLights() {
        const ambient = new THREE.AmbientLight(0xcccccc)
        this.scene.add(ambient)
    }

    setRender() {
        const { W, H } = APP.Layout
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: this.$stage,
        })

        this.renderer.setSize(W, H)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.renderer.setAnimationLoop(() => { this.render() })
    }

    addObjects() {
        this.slideshow = new Slideshow(this.scene, this.world)
    }


    setupDebug() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableKeys = false
        this.controls.update()
    }


    /* Values
    --------------------------------------------------------- */

    render() {
        this.updatePhysics()
        this.slideshow.render()
        this.renderer.render(this.scene, this.camera)
    }

    updatePhysics() {
        this.world.step(1 / 50)
    }

}




/* CONSTANTS & HELPERS
---------------------------------------------------------------------------------------------------- */

const getFov = (p) => (180 * (2 * Math.atan(APP.Layout.H / 2 / p))) / Math.PI
