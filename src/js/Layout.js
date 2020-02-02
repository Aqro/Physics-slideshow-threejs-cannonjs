
export default class Layout {

    constructor() {
        this.onResize()

        this.bindEvents()
    }

    bindEvents() {
        window.addEventListener('resize', () => { this.onResize() })
    }

    onResize() {
        this.isMobile   = window.matchMedia('(max-width: 767px)').matches
        this.isTablet   = window.matchMedia('(max-width: 1111px)').matches
        this.isDesktop  = !this.isMobile && !this.isTablet

        this.W = window.innerWidth
        this.H = window.innerHeight

        this.D = Math.ceil(Math.tan(APP.Store.ANGLE) * (Math.max(this.W, this.H) / 2))
    }

}
