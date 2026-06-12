import { useEffect, useRef } from 'react';

const RainEffect = ({ isActive }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const fadeProgressRef = useRef(0);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isCleanedUp = false;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const W = () => canvas.width;
    const H = () => canvas.height;

    // ─── Капли дождя ───
    const drops = [];
    const dropCount = Math.floor((W() * H()) / 2800);
    for (let i = 0; i < dropCount; i++) {
      drops.push(createDrop(-1));
    }

    function createDrop(initialY) {
      return {
        x: Math.random() * (W() + 200) - 100,
        y: initialY === -1 ? Math.random() * H() : initialY,
        speed: 4 + Math.random() * 5,
        length: 8 + Math.random() * 18,
        width: 0.8 + Math.random() * 0.6,
        opacity: 0.2 + Math.random() * 0.5,
        windOffset: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
      };
    }

    // ─── Сплэши ───
    const splashes = [];
    function createSplash(x, y) {
      for (let i = 0; i < 3; i++) {
        splashes.push({
          x, y,
          vx: (Math.random() - 0.5) * 4,
          vy: -1 - Math.random() * 3,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.4 + Math.random() * 0.3,
          size: 1 + Math.random() * 2,
        });
      }
    }

    // ─── Молния ───
    let lightningTimer = Date.now() + Math.random() * 5000;
    let lightningActive = false;
    let lightningFrame = 0;
    let lightningIntensity = 0;
    let lightningBolts = [];

    function generateBolt(x1, y1, x2, y2, depth) {
      const bolt = [{ x: x1, y: y1 }];
      const segments = 6 + Math.floor(Math.random() * 6);
      let cx = x1, cy = y1;
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        cx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 80 / (depth + 1);
        cy = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 40 / (depth + 1);
        bolt.push({ x: cx, y: cy });
      }
      bolt.push({ x: x2, y: y2 });
      return bolt;
    }

    // ─── Туман ───
    let mistParticles = [];
    for (let i = 0; i < 30; i++) {
      mistParticles.push({
        x: Math.random() * W(),
        y: H() - Math.random() * 80,
        size: 40 + Math.random() * 80,
        speed: 0.3 + Math.random() * 0.5,
        opacity: 0.03 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // ─── Ветер ───
    const windBase = 1.8;
    let windPhase = 0;

    function easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    const fadeSpeed = 0.016;

    // ─── Анимация ───
    const animate = () => {
      if (isCleanedUp) return;

      const targetActive = isActiveRef.current;
      const fp = fadeProgressRef.current;

      if (targetActive && fp < 1) {
        fadeProgressRef.current = Math.min(1, fp + fadeSpeed);
      } else if (!targetActive && fp > 0) {
        fadeProgressRef.current = Math.max(0, fp - fadeSpeed * 1.2);
      }

      const currentFade = fadeProgressRef.current;

      canvas.style.display = currentFade > 0 ? 'block' : 'none';

      if (currentFade <= 0 && !targetActive) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, W(), H());

      const mouse = mouseRef.current;
      const now = Date.now();

      windPhase += 0.003;
      const windStrength = windBase + Math.sin(windPhase) * 1.2 + Math.sin(windPhase * 2.3) * 0.4;

      // ===== ШТОРА СВЕРХУ ВНИЗ =====
      const easeFade = easeInOutQuart(currentFade);
      const curtainY = H() * easeFade;
      const useCurtain = currentFade < 0.999;

      // clip: рисуем капли только ВЫШЕ curtainY
      ctx.save();
      if (useCurtain) {
        ctx.beginPath();
        ctx.rect(0, 0, W(), curtainY);
        ctx.clip();
      }

      // ===== КАПЛИ =====
      const cursorRadius = 75;
      const fadeStartRadius = cursorRadius + 90;
      const repulsionRadius = cursorRadius + 60;

      drops.forEach(drop => {
        const dx = drop.x - mouse.x;
        const dy = drop.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let cursorFade = 1;
        if (dist < fadeStartRadius) {
          const zone = fadeStartRadius - cursorRadius;
          if (dist <= cursorRadius) {
            cursorFade = 0;
          } else {
            cursorFade = Math.pow((dist - cursorRadius) / zone, 3);
          }
        }

        if (cursorFade <= 0) {
          drop.y += drop.speed + 5;
          drop.x += drop.windOffset + windStrength * 0.3;
          return;
        }

        if (dist < repulsionRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (repulsionRadius - dist) / repulsionRadius;
          drop.x += Math.cos(angle) * force * 3.5;
          drop.y += Math.sin(angle) * force * 2;
          drop.x += (Math.random() - 0.5) * force * 2.5;
        }

        const finalAlpha = drop.opacity * cursorFade;

        if (finalAlpha <= 0.01) {
          drop.y += drop.speed + 5;
          drop.x += drop.windOffset + windStrength * 0.3;
          return;
        }

        const len = drop.length + Math.sin(now * 0.003 + drop.phase) * 2;
        const wobble = Math.sin(now * 0.005 + drop.phase) * 0.3;

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.windOffset * 0.5 + wobble, drop.y + len);
        ctx.lineWidth = drop.width;
        ctx.strokeStyle = `rgba(174, 194, 224, ${finalAlpha * 0.7})`;
        ctx.stroke();

        if (finalAlpha > 0.3 && Math.random() < 0.002) {
          ctx.beginPath();
          ctx.arc(drop.x, drop.y + len * 0.6, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 215, 240, ${finalAlpha * 0.3})`;
          ctx.fill();
        }

        drop.y += drop.speed + 5;
        drop.x += drop.windOffset + windStrength * 0.3;

        if (drop.y > H() + drop.length) {
          drop.y = -drop.length - Math.random() * 100;
          drop.x = Math.random() * (W() + 200) - 100;
          if (useCurtain && finalAlpha > 0.2 && Math.random() < 0.1) {
            createSplash(drop.x, H() - 2);
          }
        }
        if (drop.x > W() + 80) drop.x = -80;
        if (drop.x < -80) drop.x = W() + 80;
      });

      // Восстанавливаем canvas после clip
      ctx.restore();

      // ===== СПЛЕШИ =====
      splashes.forEach((s, i) => {
        s.life -= 0.016;
        if (s.life <= 0) { splashes.splice(i, 1); return; }
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (s.life / s.maxLife), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 230, ${(s.life / s.maxLife) * 0.6 * currentFade})`;
        ctx.fill();
      });

      // ===== ТУМАН =====
      if (currentFade > 0.2) {
        mistParticles.forEach(p => {
          p.phase += 0.005;
          p.x += p.speed + windStrength * 0.1;
          if (p.x > W() + p.size * 2) { p.x = -p.size * 2; p.y = H() - Math.random() * 80; }
          const mistAlpha = p.opacity * Math.min(1, (currentFade - 0.2) / 0.4);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(160, 180, 210, ${mistAlpha})`);
          grad.addColorStop(1, `rgba(160, 180, 210, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        });
      }

      // ===== МОЛНИЯ =====
      if (now > lightningTimer && !lightningActive && currentFade > 0.4) {
        lightningActive = true;
        lightningFrame = 0;
        lightningIntensity = 0.35 + Math.random() * 0.5;
        lightningBolts = [];
        const sx = Math.random() * W();
        lightningBolts.push(generateBolt(sx, -20, sx + (Math.random() - 0.5) * 200, H() * 0.6, 0));
        if (Math.random() < 0.4) {
          const b = lightningBolts[0][Math.floor(lightningBolts[0].length * 0.4)];
          lightningBolts.push(generateBolt(b.x, b.y, b.x + (Math.random() - 0.5) * 150, b.y + Math.random() * 200, 1));
        }
      }

      if (lightningActive) {
        lightningFrame++;
        if (lightningFrame < 4) {
          ctx.strokeStyle = `rgba(255,255,255,${lightningIntensity * (1 - lightningFrame / 4) * currentFade})`;
          ctx.lineWidth = 2;
          lightningBolts.forEach(bolt => {
            ctx.beginPath();
            bolt.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.stroke();
          });
          ctx.fillStyle = `rgba(200,210,255,${lightningIntensity * 0.15 * (1 - lightningFrame / 4) * currentFade})`;
          ctx.fillRect(0, 0, W(), H());
        } else if (lightningFrame < 6) {
          const f = 1 - (lightningFrame - 4) / 2;
          ctx.strokeStyle = `rgba(255,255,255,${lightningIntensity * 0.3 * f * currentFade})`;
          ctx.lineWidth = 1.5;
          lightningBolts.forEach(bolt => {
            ctx.beginPath();
            bolt.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.stroke();
          });
        } else {
          lightningActive = false;
          lightningTimer = now + Math.random() * 10000 + 2000;
        }
      }

      // ===== ВИНЬЕТКА =====
      if (currentFade > 0.1) {
        const vigGrad = ctx.createRadialGradient(W()/2, H()/2, W()*0.25, W()/2, H()/2, W()*0.7);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, `rgba(0,0,0,${0.15 * Math.min(1, currentFade / 0.5)})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W(), H());
      }

      // ===== Тональный оверлей =====
      if (currentFade > 0.1) {
        const ta = 0.08 * Math.min(1, currentFade / 0.6);
        const tg = ctx.createLinearGradient(0, 0, 0, H());
        tg.addColorStop(0, `rgba(30,60,120,${ta})`);
        tg.addColorStop(0.5, 'rgba(30,60,120,0)');
        tg.addColorStop(1, `rgba(30,60,120,${ta * 0.5})`);
        ctx.fillStyle = tg;
        ctx.fillRect(0, 0, W(), H());
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isCleanedUp = true;
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        display: 'none'
      }}
    />
  );
};

export default RainEffect;