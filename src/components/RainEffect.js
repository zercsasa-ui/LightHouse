import { useEffect, useRef } from 'react';

const RainEffect = ({ isActive }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (canvasRef.current) {
        canvasRef.current.style.display = 'none';
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // На весь экран
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Отслеживание мыши
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Параметры дождя
    const drops = [];
    const dropCount = Math.floor((canvas.width * canvas.height) / 3000); // Адаптивное количество
    const gravity = 5;
    const wind = 2;
    const cursorRadius = 80; // Радиус круга вокруг курсора (полное исчезновение)
    const fadeStartRadius = cursorRadius + 80; // Радиус начала плавного затухания
    const repulsionRadius = cursorRadius + 60; // Радиус влияния (физика)

    // Инициализация капель
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 3 + Math.random() * 4,
        length: 10 + Math.random() * 15,
        opacity: 0.3 + Math.random() * 0.4,
        vx: wind + Math.random() * 2
      });
    }

    // Эффект молнии
    let lightningTimer = Date.now() + Math.random() * 4000;
    let lightningActive = false;
    let lightningFrame = 0;
    let lightningIntensity = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      // Рисуем капли дождя
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
      
      drops.forEach(drop => {
        // Проверяем расстояние до курсора
        const dx = drop.x - mouse.x;
        const dy = drop.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Вычисляем прозрачность в зависимости от расстояния до курсора
        let fadeOpacity = 1;
        if (distance < fadeStartRadius) {
          // Плавное затухание от fadeStartRadius до cursorRadius
          const fadeZone = fadeStartRadius - cursorRadius;
          if (distance <= cursorRadius) {
            fadeOpacity = 0;
          } else {
            // Используем квадратичную функцию для более плавного затухания
            const t = (distance - cursorRadius) / fadeZone;
            fadeOpacity = t * t; // Квадратичное затухание
          }
        }

        // Если капля внутри круга - не рисуем
        if (fadeOpacity <= 0) {
          drop.y += drop.speed + gravity;
          drop.x += drop.vx;
          return;
        }

        // Если капля в зоне влияния курсора - обтекаем
        if (distance < repulsionRadius) {
          // Вычисляем направление отталкивания
          const angle = Math.atan2(dy, dx);
          const force = (repulsionRadius - distance) / repulsionRadius;
          
          // Смещаем каплю от курсора
          drop.x += Math.cos(angle) * force * 3;
          drop.y += Math.sin(angle) * force * 1.5;
          
          // Добавляем небольшое случайное отклонение для естественности
          drop.x += (Math.random() - 0.5) * force * 2;
        }

        // Рисуем каплю с учетом затухания
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.vx, drop.y + drop.length);
        ctx.lineWidth = 1;
        ctx.globalAlpha = drop.opacity * fadeOpacity;
        ctx.stroke();

        // Обновляем позицию
        drop.y += drop.speed + gravity;
        drop.x += drop.vx;

        // Если капля ушла за границы - перезапускаем сверху
        if (drop.y > canvas.height + drop.length) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
        if (drop.x > canvas.width + 50) {
          drop.x = -50;
        }
        if (drop.x < -50) {
          drop.x = canvas.width + 50;
        }
      });

      ctx.globalAlpha = 1;

      // Эффект молнии
      if (Date.now() > lightningTimer && !lightningActive) {
        lightningActive = true;
        lightningFrame = 0;
        lightningIntensity = 0.3 + Math.random() * 0.5;
      }

      if (lightningActive) {
        lightningFrame++;
        
        if (lightningFrame < 3) {
          // Вспышка
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningIntensity * (1 - lightningFrame / 3)})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (lightningFrame < 5) {
          // Затухание
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningIntensity * 0.3 * (1 - (lightningFrame - 3) / 2)})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          lightningActive = false;
          lightningTimer = Date.now() + Math.random() * 8000 + 2000;
        }
      }

      // Рисуем круг вокруг курсора (прозрачный, без обводки)
      // Круг теперь полностью прозрачный - только зона без дождя

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

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
        display: isActive ? 'block' : 'none'
      }}
    />
  );
};

export default RainEffect;