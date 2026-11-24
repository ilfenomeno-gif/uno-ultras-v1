// ============================================================
// UNO ULTRA Client — 60 Cyan Particles Canvas (60fps RAF)
// ============================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

const PARTICLE_COUNT = 60;

export class ParticlesCanvas {
  private readonly ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId: number | null = null;
  private width = 0;
  private height = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Impossibile inizializzare il contesto 2D per le particelle');
    }
    this.ctx = context;
    this.resize();
    this.initParticles();
    window.addEventListener('resize', this.handleResize);
  }

  start(): void {
    if (this.rafId !== null) return;
    const tick = (): void => {
      this.renderFrame();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private readonly handleResize = (): void => {
    this.resize();
  };

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private initParticles(): void {
    this.particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      radius: 1.2 + Math.random() * 2.2,
      alpha: 0.25 + Math.random() * 0.6,
    }));
  }

  private renderFrame(): void {
    this.ctx.fillStyle = '#05070d';
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      else if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      else if (p.y > this.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 188, 212, ${p.alpha.toFixed(2)})`;
      this.ctx.shadowColor = 'rgba(0, 188, 212, 0.75)';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
    }
    this.ctx.shadowBlur = 0;
  }
}
