// Canvas Particle System cho hiệu ứng hạt sáng phép thuật vàng kim / tinh vân

class CelestialParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  decay: number;
  color: string;
  isStar: boolean;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5.5 + 2.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.size = Math.random() * 4.5 + 2;
    this.decay = Math.random() * 0.024 + 0.014;
    this.isStar = Math.random() > 0.35;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.alpha -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    if (this.isStar) {
      // Vẽ ngôi sao kim cương 4 cánh
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x + this.size, this.y);
      ctx.lineTo(this.x, this.y + this.size);
      ctx.lineTo(this.x - this.size, this.y);
      ctx.closePath();
      ctx.fill();
    } else {
      // Vẽ đốm sáng hình cầu
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function burstCelestialParticles(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const particles: CelestialParticle[] = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const goldColors = ["#ffd700", "#ffea75", "#ffffff", "#e9b949", "#f3ba2f", "#ff9800", "#f8d16d"];

  for (let i = 0; i < 85; i++) {
    const color = goldColors[Math.floor(Math.random() * goldColors.length)];
    particles.push(new CelestialParticle(centerX, centerY, color));
  }

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach((p) => {
      p.update();
      if (p.alpha > 0) {
        alive = true;
        p.draw(ctx);
      }
    });

    if (alive) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(animate);
}
