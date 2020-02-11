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
            speed: 1.5,
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
                // scrolling     : false,
                // autoscroll    : false,
                textTransition: false,
            },
        }

        this.hideTextTween = null

        this.setup()

        this.bindEvents()
    }


    bindEvents() {
        document.addEventListener('wheel', this.onScroll.bind(this))
        document.addEventListener('mouseleave', this.onUp.bind(this, true))

        document.addEventListener('mousedown', this.onDown.bind(this))
        document.addEventListener('mousemove', this.onMove.bind(this))
        document.addEventListener('mouseup', this.onUp.bind(this, false))

        document.addEventListener('touchstart', this.onDown.bind(this))
        document.addEventListener('touchmove', this.onMove.bind(this))
        document.addEventListener('touchend', this.onUp.bind(this, false))
    }


    setup() {
        const state = this.states

        this.getSizes()

        this.slides = this.getSlides()

        // eslint-disable-next-line prefer-destructuring
        state.activeSlide = this.slides[0]
        this.cloth = new Cloth(state.activeSlide.tile, this.world)
        this.wind = new Wind(state.activeSlide.tile)

        this.draw()
    }

    /* Handlers
    --------------------------------------------------------- */

    onScroll({ deltaY }) {
        const { diff } = this.states

        const delta = gsap.utils.clamp(-100, 100, deltaY)
        this.states.off += delta * this.opts.speed

        this.states.target = this.states.off

        this.hideTexts()

        ev('stormIsCalmingDown')

        if (Math.abs(diff) >= 0.01) { this.restartTimer() }
        if (Math.abs(diff) < 0.1) { this.restartTimerAutoScroll() }

        if (this.timerWind) clearTimeout(this.timerWind)
    }


    onDown(e) {
        this.states.flags.dragging  = true
        this.startY = getPos(e).y

        ev('stormIsCalmingDown')
    }

    onMove(e) {
        if (!this.states.flags.dragging) return

        ev('stormIsCalmingDown')
        this.hideTexts()

        const { y } = getPos(e)
        this.dragY = (y - this.startY) * -3

        this.states.target = this.states.off + this.dragY * this.opts.speed

        if (this.timerWind) clearTimeout(this.timerWind)
    }

    onUp(isLeavingWindow = false) {
        const instant = !APP.Layout.isDesktop ? false : isLeavingWindow

        this.states.off            = this.states.target
        this.states.flags.dragging = false

        if (!isLeavingWindow) ev('stormIsCalmingDown')

        this.restartTimerAutoScroll(instant)
    }



    /* Actions
    --------------------------------------------------------- */

    render() {
        this.wind.update()
        this.cloth.update()
        this.cloth.applyWind(this.wind)

        this.draw()
    }


    draw() {
        this.calc()
        this.transformSlides()
    }


    hideTexts() {
        const duration = !APP.Layout.isDesktop ? 0.2 : 0.4

        if (this.hideTextTween && this.hideTextTween.isActive()) return

        gsap.killTweensOf(this.$els.split)

        this.hideTextTween = gsap.to(this.$els.split, {
            duration,
            y: '100%',
            ease: 'power3.in',
            stagger: {
                grid: [2, 2],
                axis: 'x',
                amount: 0.16,
            },
            onStart: () => { this.states.flags.textTransition = true },
            onComplete: () => { this.states.flags.textTransition = false },
        })
    }

    revealTexts() {
        const title = this.states.activeSlide.title.toUpperCase()

        const newTitle = title.split(' ')
        /*.flatMap((word) => [
            word.substring(0, Math.ceil(word.length / 2)),
            word.substring(Math.ceil(word.length / 2), word.length),
        ])*/

        gsap.to(this.$els.split, {
            duration : 0.8,
            y        : 0,
            ease     : 'power3.out',
            stagger: {
                grid    : [2, 2],
                axis    : 'x',
                amount  : 0.16,
            },
            onStart: () => {
                this.$els.split.forEach((s, i) => { s.innerText = newTitle[i] })
            },
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
        const off    = !APP.Layout.isDesktop ? 50 : 200


        this.slides.forEach((slide) => {
            const dist    = slide.tile.position.distanceTo(center)
            const value = 1 - gsap.utils.clamp(0, diag - off, dist) / diag

            slide.tile.mat.uniforms.uAlpha.value = value
        })
    }


    getSizes() {
        const state = this.states
        const { slides, el } = this.$els
        const {
            height: wrapHeight,
            top: wrapDiff,
        } = el.getBoundingClientRect()

        state.mb = getStyle(slides[slides.length - 1], 'margin-bottom')

        // Set bounds
        state.max = -((slides[slides.length - 1].getBoundingClientRect().bottom) - wrapHeight - wrapDiff)
        state.min = 0
    }



    /* Slider stuff
    --------------------------------------------------------- */

    slideTo(slide) {
        const state = this.states
        const target = state.currentRounded - slide.tile.position.y

        gsap.killTweensOf(state)

        gsap.to(state, {
            target,
            duration : !APP.Layout.isDesktop ? 0.2 : 0.4,
            ease     : 'strong.inout',

            onComplete: () => {
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

        const sizes = {
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

            const maxValue = (H) * sizes.max + offsets.max
            const minValue = (H) * sizes.min + offsets.min


            return {
                $el: s,
                index: i,
                tile,
                top,
                bottom,
                height,
                title: s.querySelector('h3').innerText,
                min: top < (H) ? state.min + (maxValue) : state.min - (minValue),
                max: top > (H) ? state.max - (maxValue) : state.max + (minValue),
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
            this.slideTo(this.getClosest())
        }, 1000)
    }

    restartTimerAutoScroll(instant) {
        // eslint-disable-next-line no-nested-ternary
        const delay = instant ? 0 : !APP.Layout.isDesktop ? 1000 : 100
        clearTimeout(this.timer)
        clearTimeout(this.timerAutoScroll)

        this.timerAutoScroll = setTimeout(() => {
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
