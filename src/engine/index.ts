import { BackBuffer, LightSource, Sprite, Object } from "./material"
import { Matrix3x3, Vector2 } from "./math"

enum Blendmode {
    ALPHA,
    ADDITIVE,
    MULTIPLY
}

type Scene = {
    Objects: Object[]
    Lights: LightSource[]
}

class ToastEngine {
    private _canvas: HTMLCanvasElement
    private _gl: WebGL2RenderingContext

    private running

    private initialTime

    private _worldMatrix

    private backBuffer
    private finalBuffer

    private white

    private scene: Scene = {
        Objects: [],
        Lights: []
    }
    
    constructor() {
        this._canvas = document.createElement("canvas")
        const gl = this._canvas.getContext("webgl2")
        if (!gl) throw new Error("Browser does not support webgl2")

        this._gl = gl

        this.running = true

        this.initialTime = 0

        this._worldMatrix = new Matrix3x3()

        this.backBuffer = new BackBuffer(this, { width: 512, height: 240 })
        this.finalBuffer = new BackBuffer(this, { width: 512, height: 240 })

        this.gl.clearColor(0.5, 0.5, 0.5, 1.0)

        this.white = new Sprite(this, '/img/white.png', { width: this.canvas.width, height: this.canvas.height})
        this.white.opacity = .5
    }

    public get worldMatrix() { return this._worldMatrix }
    public set worldMatrix(matrix) { this._worldMatrix = matrix}
    public get canvas() { return this._canvas }
    public get gl() { return this._gl }

    public set addObject(object: Object) { this.scene.Objects.push(object) }
    public set addLight(light: LightSource) { this.scene.Lights.push(light) }

    public set buffer(buffer: any) {
        if (buffer instanceof BackBuffer) {
            this.gl.viewport(0, 0, buffer.size.x, buffer.size.y)
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer.frameBuffer)
        } else {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    }

    public set blendmode(bm: Blendmode) {
        switch (bm) {
            case Blendmode.ALPHA: this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); break;
            case Blendmode.ADDITIVE: this.gl.blendFunc(this.gl.ONE, this.gl.ONE); break;
            case Blendmode.MULTIPLY: this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO); break;
        }
    }

    public bindCanvas(canvas: HTMLCanvasElement) {
        this._canvas.remove()
        this._canvas = canvas

        const gl = this._canvas.getContext("webgl2")
        if (!gl) throw new Error("Browser does not support webgl2")

        this._gl = gl
    }

    public appendCanvas(parent: Element) {
        parent.appendChild(this._canvas)
    }

    public init() {
        if (!this.gl) throw new Error('Your browser does not support webgl2')
    }

    public update(dt: number) {
        for (let i = 0; i < this.scene.Objects.length; i++) this.scene.Objects[i].update(dt)
    }
    public render() {}

    private preRender() {
        this.buffer = null
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)

        this.gl.enable(this.gl.BLEND)
        this.blendmode = Blendmode.ALPHA
    }

    public postRender() {
        this.buffer = this.backBuffer
        for (let i = 0; i < this.scene.Objects.length; i++)
            this.scene.Objects[i].render()
        
        this.buffer = this.finalBuffer
        this.white.render(new Vector2(0, 0), new Vector2(0, 0))

        this.blendmode = Blendmode.ADDITIVE
        for (let i = 0; i < this.scene.Lights.length; i++)
            this.scene.Lights[i].render(new Vector2(0, 0), new Vector2(0, 0))

        this.buffer = null
        
        this.blendmode = Blendmode.ALPHA
        this.backBuffer.render()
        this.blendmode = Blendmode.MULTIPLY
        this.finalBuffer.render()

        this.gl.flush()
    }

    private loop(time: number) {
        const currTime = time * 0.001
        const dt = Math.min(0.1, currTime - this.initialTime)
        this.initialTime = currTime

        this.update(dt)
        this.preRender()
        this.render()
        this.postRender()

        if (this.running) requestAnimationFrame(time => this.loop(time))
    }

    public run() {
        this.init()
        requestAnimationFrame(time => this.loop(time))
    }

    public resize(x: number, y: number) {
        this._canvas.width = x
        this._canvas.height= y

        this.white.size = new Vector2(x, y)

        const wRatio = x / (y / 240)
        this.worldMatrix = new Matrix3x3().translate(-1, 1).resize(2/wRatio, -2/240)
    }
}

export default ToastEngine