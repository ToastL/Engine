import ToastEngine from "./engine";
import { LightSource, Object, Sprite } from "./engine/material";

class Client extends ToastEngine {
    private player
    private lightSource

    constructor() {
        super()

        const sprite = new Sprite(this, '/img/standing_gasmask.png', { width: 32, height: 32 })
        this.player = new Object(this, sprite)

        this.addObject = this.player

        this.lightSource = new LightSource(this)

        this.addLight = this.lightSource
    }

    public update(dt: number) {
        super.update(dt)
        
        this.player.velocity.x *= .95
        this.player.velocity.y *= .95
        // this.player.velocity.y += 6

        this.player.frame.x = (this.player.frame.x+2*dt) % 4
    }
}

export default Client