// class Rigidbody {
//     private mass
// }

import { GameObject } from "./material"
import { Vector2 } from "./math"

class BoxCollider {
    private _parent

    private _position
    private _size

    constructor(parent: GameObject, size?: Vector2, position?: Vector2) {
        this._parent = parent

        this._position = new Vector2(0, 0)
        if (position) this._position = position
        this._size = parent.sprite.size
        if (size) this._size = size
    }

    public get parent() { return this._parent}

    public get position() { return this._position }
    public get size() { return this._size }

    public collides(boxcollider: BoxCollider) {
        const selfLeft = this.parent.position.x + this.position.x
        const selfRight = this.parent.position.x + this.position.x + this.size.x
        const selfTop = this.parent.position.y + this.position.y
        const selfBottom = this.parent.position.y + this.position.y + this.size.y

        const colliderLeft = boxcollider.parent.position.x + boxcollider.position.x
        const colliderRight = boxcollider.parent.position.x + boxcollider.position.x + boxcollider.size.x
        const colliderTop = boxcollider.parent.position.y + boxcollider.position.y
        const colliderBottom = boxcollider.parent.position.y + boxcollider.position.y + boxcollider.size.y

        // return {
        //     "left": false
        //     "right"
        // }
    }
}

export { BoxCollider }