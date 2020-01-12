export default class Stage {

    constructor() {
        this.setup()

        this.onResize()

        this.bindEvents()
    }

    bindEvents() {
        window.addEventListener('resize', () => { this.onResize() })
        window.addEventListener('wheel', (e) => { this.onScroll(e) }, { passive: false })
    }

    setup() {
        //
    }


    /* Handlers
    --------------------------------------------------------- */

    onResize() {

    }

    onScroll(e) {
        e.preventDefault()
    }

    /* Actions
    --------------------------------------------------------- */



    /* Values
    --------------------------------------------------------- */


}
