import { ToastEngine } from '.'
import { Matrix3x3, Vector2, Vector3 } from './math'
import { linkProgram, ShaderInfo } from './shader'
import { BoxCollider } from './physics'

import spriteVert from '../shaders/sprite.vert'
import spriteFrag from '../shaders/sprite.frag'

import framebufferVert from '../shaders/framebuffer.vert'
import framebufferFrag from '../shaders/framebuffer.frag'

import lightVert from '../shaders/light.vert'
import lightFrag from '../shaders/light.frag'

import halo from '../img/halo.png'

type MaterialParam = {
    [key: string]: {
        location: WebGLUniformLocation | number
        isUniform: boolean
        type: number
    }
}

class Material {
    private _program

    private gl

    private parameters: MaterialParam

    constructor(engine: ToastEngine, shaderInfo: ShaderInfo[]) {
        this.gl = engine.gl
        this._program = linkProgram(engine.gl, shaderInfo)

        this.parameters = {}
        this.params
    }

    public get program() { return this._program }

    private get params() {
        let isUniform = 0

        while (isUniform < 2) {
            const type = isUniform ?  this.gl.ACTIVE_UNIFORMS : this.gl.ACTIVE_ATTRIBUTES
            const amount = this.gl.getProgramParameter(this.program, type)

            for (let i = 0; i < amount; i++) {
                let details
                let location

                if (isUniform) {
                    details = this.gl.getActiveUniform(this.program, i)
                    if (!details) throw new Error('Could not get uniform parameter')
                    location = this.gl.getUniformLocation(this.program, details.name)
                    if (!location) throw new Error('Could not get uniform parameter location')
                } else {
                    details = this.gl.getActiveAttrib(this.program, i)
                    if (!details) throw new Error('Could not get attribute parameter')
                    location = this.gl.getAttribLocation(this.program, details.name)
                }

                this.parameters[details.name] = {
                    location: location,
                    isUniform: !!isUniform,
                    type: details.type
                }
            }

            isUniform++
        }

        return this.parameters
    }

    public setParam(name: string, a?: any, b?: any, c?: any, d?: any, e?: any) {
        if (name in this.parameters) {
            const param = this.parameters[name]

            if (param.isUniform) {
                switch (param.type) {
                    case this.gl.FLOAT: this.gl.uniform1f(param.location, a); break
                    case this.gl.FLOAT_VEC2: this.gl.uniform2f(param.location, a, b); break
                    case this.gl.FLOAT_VEC3: this.gl.uniform3f(param.location, a, b, c); break
                    case this.gl.FLOAT_VEC4: this.gl.uniform4f(param.location, a, b, c, d); break
                    case this.gl.FLOAT_MAT2: this.gl.uniformMatrix2fv(param.location, false, a); break
                    case this.gl.FLOAT_MAT3: this.gl.uniformMatrix3fv(param.location, false, a); break
                    case this.gl.SAMPLER_2D: this.gl.uniform1i(param.location, a); break
                }
            } else {
                if (typeof param.location !== 'number') throw new Error(`Parameter location is not a number: ${name}`)

                this.gl.enableVertexAttribArray(param.location)

                if (a == undefined) a = this.gl.FLOAT
                if (b == undefined) b = false
                if (c == undefined) c = 0
                if (d == undefined) d = 0

                switch (param.type) {
                    case this.gl.FLOAT: this.gl.vertexAttribPointer(param.location, 1, a, b, c, d); break
                    case this.gl.FLOAT_VEC2: this.gl.vertexAttribPointer(param.location, 2, a, b, c, d); break
                    case this.gl.FLOAT_VEC3: this.gl.vertexAttribPointer(param.location, 3, a, b, c, d); break
                    case this.gl.FLOAT_VEC4: this.gl.vertexAttribPointer(param.location, 4, a, b, c, d); break
                }
            }
        } else throw new Error(`Parameter does not exist: ${name}, only the following params exist: ${Object.keys(this.params)}`)
    }
}

type SpriteOpts = {
    width?: number
    height?: number
}

class Sprite {
    private image

    private material
    
    private isLoaded

    private _size
    private _opacity

    private uv_x
    private uv_y

    private gl_tex
    private geo_buf
    private tex_buf

    private _engine
    private _gl

    constructor(engine: ToastEngine, path: string, opts?: SpriteOpts) {
        this._engine = engine
        this._gl = engine.gl
         
        this.material = new Material(engine, [
            { src: spriteVert, type: this.gl.VERTEX_SHADER },
            { src: spriteFrag, type: this.gl.FRAGMENT_SHADER }
        ])

        this.isLoaded = false

        this._size = new Vector2(32, 32)
        if (opts?.width) this.size.x = opts.width
        if (opts?.height) this.size.y = opts.height

        this._opacity = 0

        this.uv_x = 0
        this.uv_y = 0

        this.image = new Image()
        this.image.src = path
        this.image.onload = () => this.setup()

        this.gl_tex = this.gl.createTexture()
        this.geo_buf = this.gl.createBuffer()
        this.tex_buf = this.gl.createBuffer()
    }

    public get engine() { return this._engine }
    public get gl() { return this._gl }

    public get size() { return this._size }
    public set size(value) { this._size = value }
    public get opacity() { return this._opacity }
    public set opacity(value) { this._opacity = value }

    public static createRectArray(x=0, y=0, w=1, h=1) {
        return new Float32Array([
            x,   y,
            x+w, y,
            x,   y+h,
            x,   y+h,
            x+w, y,
            x+w, y+h
        ])
    }

    private setup() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_tex)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image)

        this.uv_x = this.size.x / this.image.width
        this.uv_y = this.size.y / this.image.height

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geo_buf)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Sprite.createRectArray(0, 0, this.size.x, this.size.y), this.gl.STATIC_DRAW)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_buf)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Sprite.createRectArray(0, 0, this.uv_x, this.uv_y), this.gl.STATIC_DRAW)

        this.isLoaded = true
    }

    public render(position: Vector2, frame: Vector2) {
        if (!this.isLoaded)
            return

        const fixedFrame = frame.floor
        const frameX = fixedFrame.x * this.uv_x
        const frameY = fixedFrame.y * this.uv_y

        const fixedPosition = position.floor
        const objMat = new Matrix3x3().translate(fixedPosition.x, fixedPosition.y)

        const camVec = this.engine.scene?.camera.Vector2
        
        this.gl.useProgram(this.material.program)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geo_buf)
        this.material.setParam('a_position')

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_buf)
        this.material.setParam('a_texcoord')

        this.material.setParam('u_world', this.engine.worldMatrix.Float32Array)
        this.material.setParam('u_object', objMat.Float32Array)
        this.material.setParam('u_frame', frameX, frameY)
        this.material.setParam('u_camera', camVec?.x, camVec?.y)

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_tex)
        this.material.setParam('u_image', 0)

        this.material.setParam('u_color', 1.0-this.opacity, 1.0-this.opacity, 1.0-this.opacity, 1.0)

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    }
}

class LightSource {
    private image

    private material
    
    private isLoaded

    private _position
    private _size
    private _color
    
    private gl_tex
    private geo_buf
    private tex_buf

    private _engine
    private _gl
    
    constructor(engine: ToastEngine, position: Vector2, color: Vector3, brightness=50) {
        this._engine = engine
        this._gl = engine.gl

        this.material = new Material(engine, [
            { src: lightVert, type: this.gl.VERTEX_SHADER },
            { src: lightFrag, type: this.gl.FRAGMENT_SHADER }
        ])

        this.isLoaded = false

        this._position = position
        this._size = new Vector2(brightness*2, brightness*2)
        this._color = color

        this.image = new Image()
        this.image.src = halo
        this.image.onload = () => this.setup()

        this.gl_tex = this.gl.createTexture()
        this.geo_buf = this.gl.createBuffer()
        this.tex_buf = this.gl.createBuffer()
    }

    private get engine() { return this._engine }
    private get gl() { return this._gl }

    public get position() { return this._position }
    public set position(value) { this._position = value }
    public get size() { return this._size }
    public get color() { return this._color }
    public set color(value) { this._color = value }

    private setup() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_tex)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geo_buf)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Sprite.createRectArray(0, 0, this.size.x, this.size.y), this.gl.STATIC_DRAW)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_buf)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Sprite.createRectArray(0, 0, 1, 1), this.gl.STATIC_DRAW)

        this.isLoaded = true
    }

    public render() {
        if (!this.isLoaded)
            return

        const objMat = new Matrix3x3().translate(
            this.position.x - this.size.x/2, 
            this.position.y - this.size.y/2
        )

        const camVec = this.engine.scene?.camera.Vector2

        this.gl.useProgram(this.material.program)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geo_buf)
        this.material.setParam('a_position')

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_buf)
        this.material.setParam('a_texcoord')

        this.material.setParam('u_world', this.engine.worldMatrix.Float32Array)
        this.material.setParam('u_object', objMat.Float32Array)
        this.material.setParam('u_camera', camVec?.x, camVec?.y)

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl_tex)
        this.material.setParam('u_image', 0)

        this.material.setParam('u_color', this.color.x, this.color.y, this.color.z, 1.0)

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    }
}

type ObjectContents = {
    position: Vector2
    velocity: Vector2
    frame: Vector2
}

class GameObject {
    private objectValues: ObjectContents
    
    private _engine

    private _sprite

    private _boxcollider: BoxCollider | null

    constructor(engine: ToastEngine, sprite: Sprite) {
        this._engine = engine

        this.objectValues = {
            position: new Vector2(0, 0),
            velocity: new Vector2(0, 0),

            frame: new Vector2(0, 0)
        }

        this._sprite = sprite

        this._boxcollider = null
    }

    public get engine() { return this._engine }

    public get position() { return this.objectValues.position }
    public set position(position) { this.objectValues.position = position }
    public get velocity() { return this.objectValues.velocity }
    public set velocity(velocity) { this.objectValues.velocity = velocity }
    public get sprite() { return this._sprite }
    public get boxcollider() { return this._boxcollider }
    public set boxcollider(value) { this._boxcollider = value }

    public get frame() { return this.objectValues.frame }
    public set frame(frame) { this.velocity = frame }

    public update(dt: number) {
        this.position.x += this.velocity.x * dt
        this.position.y += this.velocity.y * dt
    }

    public render() {
        this.sprite.render(this.position, this.frame)
    }
}

type BackBufferOpts = {
    width?: number
    height?: number
}

class BackBuffer {
    private gl

    private material

    private geo_buf
    private tex_buf

    private fbuffer
    private rbuffer
    private texture

    private _size

    private _rendered

    constructor(engine: ToastEngine, opts?: BackBufferOpts) {
        this.gl = engine.gl

        this.material = new Material(engine, [
            { src: framebufferVert, type: this.gl.VERTEX_SHADER },
            { src: framebufferFrag, type: this.gl.FRAGMENT_SHADER }
        ])

        this._size = new Vector2(512, 512)
        if (opts?.width) this.size.x = opts.width
        if (opts?.height) this.size.y = opts.height

        this._rendered = false

        this.fbuffer = this.gl.createFramebuffer()
        this.rbuffer = this.gl.createRenderbuffer()
        this.texture = this.gl.createTexture()

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbuffer)
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rbuffer)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.size.x, this.size.y, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)

        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.size.x, this.size.y)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0)
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.rbuffer)

        this.geo_buf = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geo_buf)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Sprite.createRectArray(-1, -1, 2, 2), this.gl.STATIC_DRAW)

        this.tex_buf = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_buf)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, Sprite.createRectArray(), this.gl.STATIC_DRAW)
    }

    public get size() { return this._size }
    public set size(value) { this._size = value }
    public get frameBuffer() { return this.fbuffer }

    public get rendered() { return this._rendered }
    public set rendered(value) { this._rendered = value}

    public render() {
        this.gl.useProgram(this.material.program)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.geo_buf)
        this.material.setParam('a_position')

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tex_buf)
        this.material.setParam('a_texcoord')

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
        this.material.setParam('u_image', 0)

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 6)
    }
}

class Camera { 
    private _position
    private _size

    private _engine

    constructor(engine: ToastEngine, position: Vector2) {
        this._engine = engine
        this._position = position

        const height = 512 / (this.engine.canvas.width / this.engine.canvas.height)
        this._size = new Vector2(512, height)
    }

    private get engine() { return this._engine }

    public get position() { return this._position }
    public set position(value) { this._position = value}
    public get size() { return this._size }
    public set size(value) { this._size = value }

    public get Vector2() {
        return new Vector2(
            -this.position.x + this.size.x/2,
            -this.position.y + this.size.y/2
        )
    }
}

export { GameObject, LightSource, Material, Sprite, BackBuffer, Camera }