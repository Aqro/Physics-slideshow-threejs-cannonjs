import { Object3D } from 'three'

export default class O extends Object3D {

    init(el) {
        this.el = el

        this.resize()
    }

    resize() {
        const { W, H } = APP.Layout

        this.rect = this.el.getBoundingClientRect()
        const { left, top, width, height } = this.rect

        this.pos = {
            x: (left + (width / 2)) - (W / 2),
            y: (top + (height / 2)) - (H / 2),
        }

        this.position.x = this.pos.x
        this.position.y = this.pos.y

        this.update()
    }

    update(current) {
        current && (this.position.y = current + this.pos.y)
    }

}
