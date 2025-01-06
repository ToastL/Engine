import { ToastEngine, Scene } from './engine';
import { LightSource, GameObject, Sprite } from './engine/material';
import { Vector2, Vector3 } from './engine/math';
import { BoxCollider } from './engine/physics';

import standing_gasmask from './img/standing_gasmask.png'
import assets from './img/Assets.png'

class GameScene extends Scene {
    private player
    private jumping = false

    private block

    private lightSource1
    private lightSource2
    private lightSource3



    constructor(engine: ToastEngine) {
        super(engine)

        this.player = new GameObject(engine, new Sprite(engine, standing_gasmask, { width: 32, height: 32 }))
        this.player.boxcollider = new BoxCollider(this.player)

        this.block = new GameObject(engine, new Sprite(engine, assets, { width: 16, height: 16 }))
        this.block.boxcollider = new BoxCollider(this.block)
        this.block.frame.x = 1
        this.block.frame.y = 1

        this.lightSource1 = new LightSource(engine, new Vector2(-25, -21.5), new Vector3(1.0, 0.0, 0.0), 75)
        this.lightSource2 = new LightSource(engine, new Vector2(25, -21.5), new Vector3(0.0, 1.0, 0.0), 75)
        this.lightSource3 = new LightSource(engine, new Vector2(0, 21.5), new Vector3(0.0, 0.0, 1.0), 75)

        this.addWorld = this.player
        this.addWorld = this.block

        this.addWorld = this.lightSource1
        this.addWorld = this.lightSource2
        this.addWorld = this.lightSource3
    }

    public update(dt: number) {
        this.player.velocity.x *= .8
        this.player.velocity.y *= .98
        this.player.velocity.y += 10
        if (this.player.position.y >= 100) {
            this.player.velocity.y = 0 
            this.player.position.y = 100

            this.jumping = false
        }


        let playerMovement = 0
        if (this.engine.getKeyDown('d')) playerMovement += 50
        if (this.engine.getKeyDown('a')) playerMovement -= 50
        if (this.engine.getKeyDown(' ')) { if (!this.jumping) this.player.velocity.y -= 300; this.jumping = true }
        
        if (playerMovement != 0) this.player.velocity.x = playerMovement

        if (
            this.player.velocity.x < .5 && this.player.velocity.y < .5 &&
            this.player.velocity.x > -.5 && this.player.velocity.y > -.5
        ) this.player.frame.x = (this.player.frame.x+2*dt) % 4
    }
}

export default GameScene