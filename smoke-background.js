/**
 * SmokeBackground - Vanilla JS WebGL Implementation
 * Creates an animated spooky smoke shader background
 */

const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));

  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

class SmokeBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.animationFrameId = null;
        this.startTime = performance.now();
        this.color = options.color ? this._hexToRgb(options.color) : [0.5, 0.3, 0.8];

        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.warn('WebGL2 not supported, smoke background disabled.');
            return;
        }

        this.canvas.className = 'flow-field-canvas';
        this.container.appendChild(this.canvas);

        this._setup();
        this._init();
        this._updateScale();
        this._bindEvents();
        this._loop(0);
    }

    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [
                parseInt(result[1], 16) / 255,
                parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255,
              ]
            : [0.5, 0.3, 0.8];
    }

    _compileShader(shader, source) {
        const gl = this.gl;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(shader));
        }
    }

    _setup() {
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER);
        this.fs = gl.createShader(gl.FRAGMENT_SHADER);
        this.program = gl.createProgram();

        this._compileShader(this.vs, VERTEX_SHADER_SRC);
        this._compileShader(this.fs, FRAGMENT_SHADER_SRC);

        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
        }
    }

    _init() {
        const gl = this.gl;
        const vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const position = gl.getAttribLocation(this.program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        this.uniforms = {
            resolution: gl.getUniformLocation(this.program, 'resolution'),
            time: gl.getUniformLocation(this.program, 'time'),
            u_color: gl.getUniformLocation(this.program, 'u_color'),
        };
    }

    _updateScale() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    _render(now) {
        const gl = this.gl;
        if (!gl || !this.program) return;

        const elapsed = (now - this.startTime) / 1000;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uniforms.time, elapsed);
        gl.uniform3fv(this.uniforms.u_color, this.color);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    _loop(now) {
        this._render(now);
        this.animationFrameId = requestAnimationFrame((t) => this._loop(t));
    }

    _bindEvents() {
        this._handleResize = () => this._updateScale();
        window.addEventListener('resize', this._handleResize);
    }

    destroy() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        window.removeEventListener('resize', this._handleResize);
        const gl = this.gl;
        if (gl) {
            if (this.vs) gl.deleteShader(this.vs);
            if (this.fs) gl.deleteShader(this.fs);
            if (this.program) gl.deleteProgram(this.program);
            if (this.buffer) gl.deleteBuffer(this.buffer);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

function initSmokeBackground() {
    const container = document.getElementById('flow-field-container');
    if (container) {
        new SmokeBackground(container, {
            color: '#6366f1'  // indigo/purple tint matching the app theme
        });
    }
}
