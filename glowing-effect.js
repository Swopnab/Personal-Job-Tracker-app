/**
 * GlowingEffect - Vanilla JS Implementation (Enhanced)
 * Creates animated glowing borders that follow the mouse cursor
 */
class GlowingEffect {
    constructor(element, options = {}) {
        this.element = element;
        this.config = {
            blur: options.blur ?? 0,
            inactiveZone: options.inactiveZone ?? 0.01,
            proximity: options.proximity ?? 64,
            spread: options.spread ?? 40,
            borderWidth: options.borderWidth ?? 3,
            movementDuration: options.movementDuration ?? 2,
            disabled: options.disabled ?? false,
        };

        this.lastPosition = { x: 0, y: 0 };
        this.animationFrameId = null;
        this.currentAngle = 0;

        if (!this.config.disabled) {
            this._applyCSS();
            this._bindEvents();
        }
    }

    _applyCSS() {
        const el = this.element;
        el.style.setProperty('--blur', `${this.config.blur}px`);
        el.style.setProperty('--spread', this.config.spread);
        el.style.setProperty('--start', '0');
        el.style.setProperty('--active', '0');
        el.style.setProperty('--glowingeffect-border-width', `${this.config.borderWidth}px`);
        el.style.setProperty('--repeating-conic-gradient-times', '5');
    }

    handleMove(e) {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

        this.animationFrameId = requestAnimationFrame(() => {
            const el = this.element;
            const { left, top, width, height } = el.getBoundingClientRect();
            const mouseX = e?.x ?? e?.clientX ?? this.lastPosition.x;
            const mouseY = e?.y ?? e?.clientY ?? this.lastPosition.y;

            if (e) this.lastPosition = { x: mouseX, y: mouseY };

            const centerX = left + width * 0.5;
            const centerY = top + height * 0.5;
            const distanceFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY);
            const inactiveRadius = 0.5 * Math.min(width, height) * this.config.inactiveZone;

            if (distanceFromCenter < inactiveRadius) {
                el.style.setProperty('--active', '0');
                return;
            }

            const isActive =
                mouseX > left - this.config.proximity &&
                mouseX < left + width + this.config.proximity &&
                mouseY > top - this.config.proximity &&
                mouseY < top + height + this.config.proximity;

            el.style.setProperty('--active', isActive ? '1' : '0');
            if (!isActive) return;

            const targetAngle =
                (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90;

            const angleDiff = ((targetAngle - this.currentAngle + 180) % 360) - 180;
            this._animateAngle(this.currentAngle, this.currentAngle + angleDiff);
        });
    }

    _animateAngle(startAngle, endAngle) {
        const duration = this.config.movementDuration * 1000;
        const startTime = performance.now();
        const el = this.element;

        const step = (now) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            this.currentAngle = startAngle + (endAngle - startAngle) * eased;
            el.style.setProperty('--start', String(this.currentAngle));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    _bindEvents() {
        this._onPointerMove = (e) => this.handleMove(e);
        this._onScroll = () => this.handleMove();

        document.body.addEventListener('pointermove', this._onPointerMove, { passive: true });
        window.addEventListener('scroll', this._onScroll, { passive: true });
    }

    destroy() {
        if (this._onPointerMove)
            document.body.removeEventListener('pointermove', this._onPointerMove);
        if (this._onScroll)
            window.removeEventListener('scroll', this._onScroll);
        if (this.animationFrameId)
            cancelAnimationFrame(this.animationFrameId);
    }
}

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
