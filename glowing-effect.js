/**
 * GlowingEffect - Vanilla JS Implementation
 * Creates animated glowing borders that follow the mouse
 */
class GlowingEffect {
    constructor(element, options = {}) {
        this.element = element;
        this.config = {
            blur: options.blur || 0,
            inactiveZone: options.inactiveZone || 0.01,
            proximity: options.proximity || 64,
            spread: options.spread || 40,
            borderWidth: options.borderWidth || 3,
            movementDuration: options.movementDuration || 2,
            disabled: options.disabled || false,
        };

        this.lastPosition = { x: 0, y: 0 };
        this.animationFrameId = null;
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.animationStartTime = null;

        this.init();
    }

    init() {
        if (this.config.disabled) return;

        // Add glow wrapper
        this.glowWrapper = document.createElement('div');
        this.glowWrapper.className = 'glow-wrapper';

        this.glowInner = document.createElement('div');
        this.glowInner.className = 'glow-inner';
        this.glowWrapper.appendChild(this.glowInner);

        this.element.style.position = 'relative';
        this.element.appendChild(this.glowWrapper);

        // Set CSS variables
        this.updateCSSVariables();

        // Bind events
        this.bindEvents();
    }

    updateCSSVariables() {
        this.element.style.setProperty('--blur', `${this.config.blur}px`);
        this.element.style.setProperty('--spread', this.config.spread);
        this.element.style.setProperty('--start', '0');
        this.element.style.setProperty('--active', '0');
        this.element.style.setProperty('--glowingeffect-border-width', `${this.config.borderWidth}px`);
    }

    handleMove(e) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.animationFrameId = requestAnimationFrame(() => {
            const rect = this.element.getBoundingClientRect();
            const mouseX = e?.x ?? this.lastPosition.x;
            const mouseY = e?.y ?? this.lastPosition.y;

            if (e) {
                this.lastPosition = { x: mouseX, y: mouseY };
            }

            const centerX = rect.left + rect.width * 0.5;
            const centerY = rect.top + rect.height * 0.5;

            const distanceFromCenter = Math.hypot(
                mouseX - centerX,
                mouseY - centerY
            );

            const inactiveRadius = 0.5 * Math.min(rect.width, rect.height) * this.config.inactiveZone;

            if (distanceFromCenter < inactiveRadius) {
                this.element.style.setProperty('--active', '0');
                return;
            }

            const isActive =
                mouseX > rect.left - this.config.proximity &&
                mouseX < rect.left + rect.width + this.config.proximity &&
                mouseY > rect.top - this.config.proximity &&
                mouseY < rect.top + rect.height + this.config.proximity;

            this.element.style.setProperty('--active', isActive ? '1' : '0');

            if (!isActive) return;

            // Calculate angle
            this.targetAngle = (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90;

            // Smooth animation
            this.animateAngle();
        });
    }

    animateAngle() {
        const duration = this.config.movementDuration * 1000;
        const startAngle = this.currentAngle;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (cubic-bezier approximation)
            const eased = this.easeOut(progress);

            // Calculate angle difference
            let angleDiff = this.targetAngle - startAngle;
            while (angleDiff > 180) angleDiff -= 360;
            while (angleDiff < -180) angleDiff += 360;

            this.currentAngle = startAngle + angleDiff * eased;
            this.element.style.setProperty('--start', String(this.currentAngle));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOut(t) {
        // Approximating cubic-bezier(0.16, 1, 0.3, 1)
        return 1 - Math.pow(1 - t, 3);
    }

    bindEvents() {
        this.handlePointerMove = (e) => this.handleMove(e);
        this.handleScroll = () => this.handleMove();

        document.body.addEventListener('pointermove', this.handlePointerMove);
        window.addEventListener('scroll', this.handleScroll);
    }

    destroy() {
        document.body.removeEventListener('pointermove', this.handlePointerMove);
        window.removeEventListener('scroll', this.handleScroll);

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.glowWrapper && this.glowWrapper.parentNode) {
            this.glowWrapper.parentNode.removeChild(this.glowWrapper);
        }
    }
}

// Initialize glowing effects on elements
function initGlowingEffects() {
    const elements = document.querySelectorAll('.glow-card');
    elements.forEach(element => {
        new GlowingEffect(element, {
            spread: 40,
            proximity: 64,
            inactiveZone: 0.01,
            borderWidth: 3,
            disabled: false
        });
    });
}
