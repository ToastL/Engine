type ShaderInfo = {
    src: string
    type: GLenum
}

function compileShader(gl: WebGL2RenderingContext, src: string, type: GLenum) {
    // const source = document.getElementById(id)?.firstChild?.nodeValue
    // if (!source) throw new Error(`Could not get shader source with id: ${id}`)

    const shader = gl.createShader(type)
    if (!shader)
        throw new Error(`Could not create ${
            type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
        } shader`)

    gl.shaderSource(shader, src)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(`Could not compile ${
            type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
        } shader: ${gl.getShaderInfoLog(shader)}`)
    
    return shader
}

function linkProgram(gl: WebGL2RenderingContext, shaderInfo: ShaderInfo[]) {
    const program = gl.createProgram()
    if (!program) throw new Error('Could not create program')
    
    shaderInfo.forEach(currInfo => {
        const shader = compileShader(gl, currInfo.src, currInfo.type)

        gl.attachShader(program, shader)
    });

    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(`Could not link program: ${gl.getProgramInfoLog(program)}`)
    return program
}

export { type ShaderInfo, compileShader, linkProgram }