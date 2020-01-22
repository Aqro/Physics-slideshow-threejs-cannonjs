import gsap from 'gsap'
import { Vector3 } from 'three'

import { getStyle, ev } from '@js/utils'

import Tile from './Tile'
import Cloth from './Cloth'
import Wind from './Wind'


export default class Slideshow {

    constructor(scene, world) {
        this.scene = scene
        this.world = world

        this.$els = {
            el      : document.querySelector('.js-slideshow'),
            slides  : document.querySelectorAll('.js-slide'),
            split   : document.querySelectorAll('.js-splited-text'),
        }

        this.opts = {
            speed: APP.Layout.isMobile ? 1.5 : 1,
            ease: 0.065,
            threshold: 50,
        }

        this.states = {
            target          : 0,
            current         : 0,
            currentRounded  : 0,
            activeSlide     : 0,

            diff    : 0,

            min     : 0,
            max     : 0,

            off     : 0,
            flags   : {
                hovering      : false,
                dragging      : false,
                scrolling     : false,
                autoscroll    : false,
                textTransition: false,
            },
        }

        this.setup()

        this.bindEvents()
    }


    bindEvents() {
        document.addEventListener('wheel', this.onScroll.bind(this))
        window.addEventListener('resize', this.onResize.bind(this))

        // this.$els.el.addEventListener('mouseenter', this.onEnter.bind(this))
        // this.$els.el.addEventListener('mouseleave', this.onLeave.bind(this))

        document.body.addEventListener('mousedown', this.onEnter.bind(this))
        document.body.addEventListener('mouseup', this.onLeave.bind(this))

        document.body.addEventListener('touchstart', this.onDown.bind(this))
        document.body.addEventListener('touchmove', this.onMove.bind(this))
        document.body.addEventListener('touchend', this.onUp.bind(this))
    }


    setup() {
        const state = this.states
        const { slides, el } = this.$els
        const {
            height: wrapHeight,
            top: wrapDiff,
        } = el.getBoundingClientRect()

        state.mb = getStyle(slides[slides.length - 1], 'margin-bottom')

        // Set bounding
        state.max = -((slides[slides.length - 1].getBoundingClientRect().bottom) - wrapHeight - wrapDiff)
        state.min = 0

        this.slides = this.getSlides()

        // eslint-disable-next-line prefer-destructuring
        state.activeSlide = this.slides[0]
        this.cloth = new Cloth(state.activeSlide.tile, this.world)
        this.wind = new Wind(state.activeSlide.tile)

        this.draw()
    }

    /* Handlers
    --------------------------------------------------------- */

    onScroll({ deltaY }, resizing = false) {
        const { flags } = this.states

        const delta = gsap.utils.clamp(-100, 100, deltaY)
        this.states.off += delta * this.opts.speed

        flags.scrolling = true

        if (resizing) return

        // gsap.killTweensOf(this.states.target)

        this.hideTexts()
        if (this.timerWind) clearTimeout(this.timerWind)

        ev('stormIsCalmingDown')

        if (Math.abs(delta) >= 1) {
            this.restartTimer()
        }

        if (Math.abs(delta) <= 50) {
            this.restartTimerAutoScroll()
        }

        this.states.target = this.states.off
    }

    onResize() {
        this.onScroll({ deltaY: 0 }, true)
    }

    onEnter() {
        if (APP.Layout.isMobile) return
        this.states.flags.hovering = true

        ev('windBlowing', { windBlowing: false })
        ev('toggleGravity', { shouldEverythingFalls: true })
    }

    onLeave() {
        if (APP.Layout.isMobile) return
        this.states.flags.hovering = false

        ev('windBlowing', { windBlowing: true })
        ev('toggleGravity', { shouldEverythingFalls: true })
    }


    onDown(e) {
        this.states.flags.scrolling = true
        this.startY = getPos(e).y

        ev('stormIsCalmingDown')
        ev('windBlowing', { windBlowing: false })
        ev('toggleGravity', { shouldEverythingFalls: false })

        if (this.timerWind) clearTimeout(this.timerWind)
    }

    onMove(e) {
        if (!this.states.flags.scrolling) return

        ev('stormIsCalmingDown')
        this.hideTexts()

        const { y } = getPos(e)
        this.dragY = (y - this.startY) * -3

        this.states.target = this.states.off + this.dragY * this.opts.speed

        if (this.timerWind) clearTimeout(this.timerWind)
    }

    onUp() {
        this.states.off = this.states.target

        ev('stormIsCalmingDown')

        this.restartTimerAutoScroll()
    }



    /* Actions
    --------------------------------------------------------- */

    render() {
        this.wind.update()
        this.cloth.update()
        this.cloth.applyWind(this.wind)

        if (!this.states.flags.scrolling && !this.states.flags.autoscroll) return

        this.draw()
    }


    draw() {
        this.calc()
        this.transformSlides()
    }


    hideTexts() {
        if (this.states.flags.textTransition) return

        const duration = APP.Layout.isMobile ? 0.2 : 0.4

        gsap.to(this.$els.split, {
            duration,
            y: '100%',
            ease: 'power3.in',
            stagger: {
                grid: [2, 2],
                axis: 'x',
                amount: 0.16,
            },
            onStart: () => { this.states.flags.textTransition = true },
        })
    }

    revealTexts() {
        // if (gsap.isTweening(this.$els.split)) return
        const title = this.states.activeSlide.title.toUpperCase()

        const newTitle = title.split(' ').flatMap((word) => [
            word.substring(0, Math.ceil(word.length / 2)),
            word.substring(Math.ceil(word.length / 2), word.length),
        ])

        gsap.killTweensOf(this.$els.split)

        this.$els.split.forEach((s, i) => { s.innerText = newTitle[i] })

        gsap.fromTo(this.$els.split, {
            y: '100%',
        }, {
            duration : 0.8,
            y        : 0,
            ease     : 'power3.out',
            stagger: {
                grid    : [2, 2],
                axis    : 'x',
                amount  : 0.16,
            },
            onStart: () => { this.states.flags.textTransition = true },
            onComplete: () => { this.states.flags.textTransition = false },
        })
    }

    /* Values
    --------------------------------------------------------- */

    calc() {
        const state          = this.states
        state.current        += (state.target - state.current) * this.opts.ease
        state.currentRounded = Math.round(state.current * 100) / 100
        state.diff           = (state.target - state.current) * 0.0005

        ev('rotateCam', { delta: state.diff })
    }


    transformSlides() {
        this.handleAlpha()

        this.slides.forEach((slide) => {
            const { translate, isVisible } = this.getTranslate(slide)

            slide.tile.update(translate)
            slide.tile.mat.uniforms.uVelo.value = this.states.diff

            if (isVisible) {
                slide.out = false
            } else if (!slide.out) {
                slide.out = true
                const { position, initPos } = slide.tile.geo.attributes

                position.copy(initPos)
                position.needsUpdate = true
            }
        })
    }

    getTranslate({ top, bottom, min, max }) {
        const { H, D }           = APP.Layout
        const { currentRounded } = this.states
        const translate          = gsap.utils.wrap(min, max, currentRounded)

        const { threshold } = this.opts
        const start         = top + translate
        const end           = bottom + translate
        const isVisible     = start < (threshold + H + D) && end > -threshold

        return {
            translate,
            isVisible,
        }
    }


    handleAlpha() {
        const center = new Vector3()
        const diag   = Math.hypot(APP.Layout.W, APP.Layout.H) / 2
        const off    = APP.Layout.isMobile ? 50 : 200


        this.slides.forEach((slide) => {
            const dist    = slide.tile.position.distanceTo(center)
            const clamped = 1 - gsap.utils.clamp(0, diag - off, dist) / diag

            slide.tile.mat.uniforms.uAlpha.value = clamped
        })
    }




    /* Slider stuff
    --------------------------------------------------------- */

    slideTo(slide) {
        const state = this.states
        const target = state.currentRounded - slide.tile.position.y

        gsap.to(state, {
            target,
            duration : APP.Layout.isMobile ? 0.2 : 0.4,
            ease     : 'strong.inout',
            onStart  : () => {
                state.flags.autoscroll = true
            },

            onComplete: () => {
                state.flags.autoscroll = false
                state.off = state.target

                if (slide !== state.activeSlide) {
                    state.activeSlide = slide
                    this.cloth.changeActiveTile(state.activeSlide.tile)
                }

                this.revealTexts()

                this.timerWind = setTimeout(() => {
                    ev('windBlowing', { windBlowing: true })
                    ev('toggleGravity', { shouldEverythingFalls: true })
                }, 400)
            },
        })
    }


    getSlides() {
        const { H, D } = APP.Layout
        const state    = this.states

        const margins = {
            max: APP.Layout.isMobile ? 0.8 : 0.83,
            min: APP.Layout.isMobile ? 0.2 : 0.17,
        }

        const offsets = {
            max: APP.Layout.isMobile ? D : D / 2,
            min: APP.Layout.isMobile ? state.mb * 2 : -state.mb + D / 2,
        }


        return Array.from(this.$els.slides).map((s, i) => {
            const { top, bottom, height } = s.getBoundingClientRect()

            const tile = new Tile()
            tile.init(s, { scene: this.scene })

            const bValue = (H) * margins.max + offsets.max
            const tValue = (H) * margins.min + offsets.min


            return {
                $el: s,
                index: i,
                tile,
                top,
                bottom,
                height,
                title: s.querySelector('h3').innerText,
                min: top < (H) ? state.min + (bValue) : state.min - (tValue),
                max: top > (H) ? state.max - (bValue) : state.max + (tValue),
                out: false,
            }
        })
    }

    getClosest() {
        let closest  = this.slides[0]
        const center = new Vector3()

        this.slides.map((s) => s.tile).forEach((tile, i) => {
            const closestDist = closest.tile.position.distanceTo(center)
            const newDist     = tile.position.distanceTo(center)

            if (newDist < closestDist) {
                closest = this.slides[i]
            }
        })

        return closest
    }


    /* Timer
    --------------------------------------------------------- */

    restartTimer() {
        clearTimeout(this.timer)
        clearTimeout(this.timerAutoScroll)

        this.timer = setTimeout(() => {
            if (!document.hasFocus()) return

            this.states.flags.scrolling = false
            this.slideTo(this.getClosest())
        }, 1000)
    }

    restartTimerAutoScroll() {
        const delay = APP.Layout.isMobile ? 1000 : 100
        clearTimeout(this.timer)
        clearTimeout(this.timerAutoScroll)

        this.timerAutoScroll = setTimeout(() => {
            if (!document.hasFocus()) return

            this.slideTo(this.getClosest())
        }, delay)
    }

}




/* CONSTANTS & HELPERS
---------------------------------------------------------------------------------------------------- */


const getPos = ({ changedTouches, clientX, clientY, target }) => {
    const x = changedTouches ? changedTouches[0].clientX : clientX
    const y = changedTouches ? changedTouches[0].clientY : clientY

    return {
        x, y, target,
    }
}
