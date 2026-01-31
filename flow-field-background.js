/**
 * FlowFieldBackground - Vanilla JS Implementation
 * Creates a particle flow field animation on canvas
 */
class FlowFieldBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.config = {
            color: options.color || '#818cf8',
            trailOpacity: options.trailOpacity || 0.1,
            particleCount: options.particleCount || 600,
            speed: options.speed || 0.8,
        };

        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.animationFrameId = null;

        this.init();
    }

    init() {
        // Setup canvas
        this.canvas.className = 'flow-field-canvas';
        this.container.appendChild(this.canvas);

        // Set canvas size
        this.resize();

        // Create particles
        this.createParticles();

        // Bind events
        this.bindEvents();

        // Start animation
        this.animate();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.container.getBoundingClientRect();

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: 0,
            vy: 0,
            age: 0,
            life: Math.random() * 200 + 100,

            update: () => {
                const p = this.particles[this.particles.indexOf(arguments[0])];
                if (!p) return;

                // Flow field calculation
                const angle = (Math.cos(p.x * 0.005) + Math.sin(p.y * 0.005)) * Math.PI;

                // Apply flow field force
                p.vx += Math.cos(angle) * 0.2 * this.config.speed;
                p.vy += Math.sin(angle) * 0.2 * this.config.speed;

                // Mouse interaction
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const interactionRadius = 150;

                if (distance < interactionRadius) {
                    const force = (interactionRadius - distance) / interactionRadius;
                    p.vx -= dx * force * 0.05;
                    p.vy -= dy * force * 0.05;
                }

                // Apply velocity and friction
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;

                // Aging
                p.age++;
                if (p.age > p.life) {
                    p.x = Math.random() * this.width;
                    p.y = Math.random() * this.height;
                    p.vx = 0;
                    p.vy = 0;
                    p.age = 0;
                    p.life = Math.random() * 200 + 100;
                }

                // Wrap around
                if (p.x < 0) p.x = this.width;
                if (p.x > this.width) p.x = 0;
                if (p.y < 0) p.y = this.height;
                if (p.y > this.height) p.y = 0;
            },

            draw: (ctx) => {
                const p = this.particles[this.particles.indexOf(arguments[0])];
                if (!p) return;

                ctx.fillStyle = this.config.color;
                const alpha = 1 - Math.abs((p.age / p.life) - 0.5) * 2;
                ctx.globalAlpha = alpha;
                ctx.fillRect(p.x, p.y, 1.5, 1.5);
            }
        };
    }

    animate() {
        // Trail effect
        this.ctx.fillStyle = `rgba(10, 10, 10, ${this.config.trailOpacity})`;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Update and draw particles
        this.particles.forEach(p => {
            p.update(p);
            p.draw(this.ctx);
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    bindEvents() {
        this.handleResize = () => {
            this.resize();
            this.createParticles();
        };

        this.handleMouseMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        };

        this.handleMouseLeave = () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        };

        window.addEventListener('resize', this.handleResize);
        this.container.addEventListener('mousemove', this.handleMouseMove);
        this.container.addEventListener('mouseleave', this.handleMouseLeave);
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.container.removeEventListener('mousemove', this.handleMouseMove);
        this.container.removeEventListener('mouseleave', this.handleMouseLeave);

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize flow field background on page load
function initFlowFieldBackground() {
    const container = document.getElementById('flow-field-container');
    if (container) {
        new FlowFieldBackground(container, {
            color: '#818cf8',
            trailOpacity: 0.1,
            particleCount: 600,
            speed: 0.8
        });
    }
}
