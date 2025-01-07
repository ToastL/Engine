import { ToastEngine, Scene } from './engine';
import { LightSource, GameObject, Sprite } from './engine/material';
import { Vector2, Vector3 } from './engine/math';
import { BoxCollider } from './engine/physics';

import standing_gasmask from './img/standing_gasmask.png'
import assets from './img/Assets.png'

class GameScene extends Scene {
    private player
    private jumping = false

    private lightSource1
    private lightSource2
    private lightSource3

    constructor(engine: ToastEngine) {
        super(engine)

        this.player = new GameObject(engine, new Sprite(engine, standing_gasmask, { width: 32, height: 32 }))
        this.player.boxcollider = new BoxCollider(this.player, new Vector2(11, 32), new Vector2(13, 0))

        for (let i = 0; i < 10; i++) {
            const object = new GameObject(engine, new Sprite(engine, assets, { width: 16, height: 16 }))
            object.boxcollider = new BoxCollider(object)
            object.boxcollider.stuck = true
            object.frame.x = 3
            if (i == 0)
                object.frame.x = 2
            if (i == 9)
                object.frame.x = 4
            object.position = new Vector2(-5*16+i*16, 100)

            this.addWorld = object
        }

        const object = new GameObject(engine, new Sprite(engine, assets, { width: 16, height: 16 }))
        object.boxcollider = new BoxCollider(object)
        object.boxcollider.stuck = true
        object.frame.x = 3
        object.position = new Vector2(0, 84)

        this.addWorld = object

        this.lightSource1 = new LightSource(engine, new Vector2(-25, -21.5), new Vector3(1.0, 0.0, 0.0), 75)
        this.lightSource2 = new LightSource(engine, new Vector2(25, -21.5), new Vector3(0.0, 1.0, 0.0), 75)
        this.lightSource3 = new LightSource(engine, new Vector2(0, 21.5), new Vector3(0.0, 0.0, 1.0), 75)

        this.addWorld = this.player

        this.addWorld = this.lightSource1
        this.addWorld = this.lightSource2
        this.addWorld = this.lightSource3
    }

    public update(dt: number) {
        this.player.velocity.x *= .8
        this.player.velocity.y *= .98
        this.player.velocity.y += 10
        // this.camera.position = new Vector2(this.player.position.x, this.player.position.y)


        let playerMovement = 0
        if (this.engine.getKeyDown('d')) playerMovement += 50
        if (this.engine.getKeyDown('a')) playerMovement -= 50
        if (this.engine.getKeyDown(' ')) { this.player.velocity.y -= 100 }
        
        if (playerMovement != 0) this.player.velocity.x = playerMovement

        if (
            this.player.velocity.x < .5 && this.player.velocity.y < .5 &&
            this.player.velocity.x > -.5 && this.player.velocity.y > -.5
        ) this.player.frame.x = (this.player.frame.x+2*dt) % 4
    }
}

export default GameScene