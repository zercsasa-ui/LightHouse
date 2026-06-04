import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LightingCalculator.module.css';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

  const TOOLS = {
    CURSOR: 'cursor',
    WIRE: 'wire',
    LAMP: 'lamp',
    ROOM: 'room'
  };

  const LAMP_TYPES = [
    { id: 'led', name: 'LED', lmPerWatt: 90, colorTemp: '2700-6500K', lifespan: 25000 },
    { id: 'halogen', name: 'Галоген', lmPerWatt: 15, colorTemp: '2700-3000K', lifespan: 2000 },
    { id: 'fluorescent', name: 'Люминесцентная', lmPerWatt: 60, colorTemp: '2700-6500K', lifespan: 10000 },
    { id: 'incandescent', name: 'Накаливания', lmPerWatt: 10, colorTemp: '2700K', lifespan: 1000 },
    { id: 'led_spot', name: 'LED прожектор', lmPerWatt: 85, colorTemp: '3000-6000K', lifespan: 30000 },
    { id: 'led_linear', name: 'LED линейная', lmPerWatt: 100, colorTemp: '3000-6500K', lifespan: 35000 },
    { id: 'hid', name: 'Газоразрядная', lmPerWatt: 80, colorTemp: '4000-6000K', lifespan: 15000 }
  ];

  const ROOM_TYPES = [
    { id: 'living', name: 'Гостиная', requiredLux: 150 },
    { id: 'bedroom', name: 'Спальня', requiredLux: 100 },
    { id: 'kitchen', name: 'Кухня', requiredLux: 200 },
    { id: 'kitchen_work', name: 'Кухня (рабочая зона)', requiredLux: 350 },
    { id: 'bathroom', name: 'Ванная', requiredLux: 150 },
    { id: 'hallway', name: 'Коридор', requiredLux: 75 },
    { id: 'office', name: 'Рабочий кабинет', requiredLux: 300 },
    { id: 'children', name: 'Детская', requiredLux: 200 },
    { id: 'wardrobe', name: 'Гардеробная', requiredLux: 100 },
    { id: 'garage', name: 'Гараж', requiredLux: 75 },
    { id: 'other', name: 'Другое', requiredLux: 150 }
  ];

  const LightingCalculator = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [rooms, setRooms] = useState([
      { id: 1, x: 100, y: 100, width: 5, height: 4, ceilingHeight: 2.5, name: 'Гостиная' }
    ])
    const [selectedRoomId, setSelectedRoomId] = useState(1);
    const [wires, setWires] = useState([]);
    const [lamps, setLamps] = useState([]);
    const [selectedLampId, setSelectedLampId] = useState(null);
    const [activeTool, setActiveTool] = useState(TOOLS.CURSOR);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentWire, setCurrentWire] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [scale] = useState(31); // 1 метр = 45 пикселей
    const [history, setHistory] = useState([]);
    const [showClearWiresModal, setShowClearWiresModal] = useState(false);
    const [showClearLampsModal, setShowClearLampsModal] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [tempDragObject, setTempDragObject] = useState(null);
  const [wirePrice, setWirePrice] = useState(50);
  const [lampPrice, setLampPrice] = useState(300);
  const [electricityPrice, setElectricityPrice] = useState(5.5);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [safetyFactor, setSafetyFactor] = useState(1.2); // Коэффициент запаса
  const [toast, setToast] = useState(null);
  const [zoom, setZoom] = useState(1); // Масштаб (1 = 100%)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // Смещение при панорамировании
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [touchPanStart, setTouchPanStart] = useState({ x: 0, y: 0 });
  const [touchPanOffsetStart, setTouchPanOffsetStart] = useState({ x: 0, y: 0 });
  const [lastTouchPinchDist, setLastTouchPinchDist] = useState(null);

  // Функция для показа уведомления
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Управление масштабом
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3)); // Максимум 3x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5)); // Минимум 0.5x
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCenterView = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  // Обработка колёсика мыши для зума
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(prev + delta, 3)));
  };

  // Начало панорамирования (средняя кнопка мыши или пробел+левая кнопка)
  const handlePanStart = (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Средняя кнопка или Shift+левая
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  // Перемещение при панорамировании
  const handlePanMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  // Конец панорамирования
  const handlePanEnd = () => {
    setIsPanning(false);
  };

    // Загрузка данных из localStorage при инициализации
    useEffect(() => {
      const savedData = localStorage.getItem('lightingCalculatorState');
      if (savedData) {
        try {
          const { timestamp, rooms, wires, lamps, history: savedHistory } = JSON.parse(savedData);
          const ONE_HOUR = 60 * 60 * 1000;

          // Если данные не старше 1 часа - восстанавливаем
          if (Date.now() - timestamp < ONE_HOUR) {
            setRooms(rooms);
            setWires(wires);
            setLamps(lamps);
            setHistory(savedHistory);
          }
        } catch (e) {
          console.error('Ошибка восстановления данных калькулятора:', e);
          // Если данные битые - удаляем
          localStorage.removeItem('lightingCalculatorState');
        }
      }
      setIsLoaded(true);
    }, []);

    // Сохранение данных в localStorage при любом изменении ТОЛЬКО после загрузки
    useEffect(() => {
      if (!isLoaded) return; // Предотвращаем перезапись данных до завершения загрузки

      const saveData = {
        timestamp: Date.now(),
        rooms,
        wires,
        lamps,
        history
      };
      localStorage.setItem('lightingCalculatorState', JSON.stringify(saveData));
    }, [rooms, wires, lamps, history, isLoaded]);

    const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
    const selectedLamp = lamps.find(l => l.id === selectedLampId);

    const checkCollision = (newRoom, excludeId = null) => {
      for (const room of rooms) {
        if (room.id === excludeId) continue;

        const r1 = {
          left: newRoom.x,
          right: newRoom.x + newRoom.width * scale,
          top: newRoom.y,
          bottom: newRoom.y + newRoom.height * scale
        };

        const r2 = {
          left: room.x,
          right: room.x + room.width * scale,
          top: room.y,
          bottom: room.y + room.height * scale
        };

        // Разрешаем прилегание (равенство координат)
        if (!(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom)) {
          return true;
        }
      }
      return false;
    };



    const calculateTotalLighting = useCallback(() => {
      let totalArea = 0;
      let totalVolume = 0;
      let totalLumens = 0;
      let totalWattage = 0;

      rooms.forEach(room => {
        totalArea += room.width * room.height;
        totalVolume += room.width * room.height * room.ceilingHeight;
      });

      lamps.forEach(lamp => {
        totalLumens += lamp.lumens;
        totalWattage += lamp.power;
      });

      return {
        totalArea: totalArea.toFixed(2),
        totalVolume: totalVolume.toFixed(2),
        totalLumens,
        totalWattage,
        averageLux: totalArea > 0 ? Math.round(totalLumens / totalArea) : 0,
        lampsCount: lamps.length
      };
    }, [rooms, lamps]);

    const calculateWireLength = useCallback(() => {
      let totalLength = 0;
      wires.forEach(wire => {
        for (let i = 1; i < wire.points.length; i++) {
          const dx = (wire.points[i].x - wire.points[i - 1].x) / scale;
          const dy = (wire.points[i].y - wire.points[i - 1].y) / scale;
          totalLength += Math.sqrt(dx * dx + dy * dy);
        }
      });
      return totalLength.toFixed(2);
    }, [wires, scale]);

    // Функция для расчёта освещённости в точке от всех ламп
    const calculateLuxAtPoint = useCallback((px, py) => {
      let totalLux = 0;
      lamps.forEach(lamp => {
        // Расстояние в метрах между точкой и лампой
        const dxMeters = (px - lamp.x) / scale;
        const dyMeters = (py - lamp.y) / scale;
        const distanceM = Math.sqrt(dxMeters * dxMeters + dyMeters * dyMeters);
        
        if (distanceM === 0) {
          // Прямо под лампой - максимальная освещённость
          totalLux += lamp.lumens / (lamp.height * lamp.height);
          return;
        }
        
        // Расчёт освещённости с учётом расстояния и угла
        const angleRad = (lamp.angle / 2) * Math.PI / 180;
        const maxRadiusM = lamp.height * Math.tan(angleRad);
        
        if (distanceM <= maxRadiusM * 1.5) { // Немного расширяем зону влияния
          // Закон обратных квадратов: освещённость падает пропорционально 1/r²
          // Плюс учитываем угол падения света
          const distanceToLamp = Math.sqrt(distanceM * distanceM + lamp.height * lamp.height);
          const incidenceAngle = Math.atan2(lamp.height, distanceM);
          const cosIncidence = Math.cos(incidenceAngle);
          
          // Базовая освещённость с учётом расстояния до лампы (по гипотенузе)
          let lux = lamp.lumens / (distanceToLamp * distanceToLamp);
          
          // Учитываем угол падения (чем ближе к центру, тем ярче)
          lux *= cosIncidence;
          
          // Плавное затухание к краям зоны
          const edgeFactor = Math.max(0, 1 - (distanceM / (maxRadiusM * 1.5)));
          lux *= edgeFactor;
          
          totalLux += lux;
        }
      });
      return totalLux;
    }, [lamps, scale]);

    // Автоматический расчёт необходимого количества ламп
    const calculateRequiredLamps = useCallback(() => {
      if (!selectedRoom || !selectedRoom.type) return null;
      
      const roomType = ROOM_TYPES.find(t => t.id === selectedRoom.type);
      if (!roomType) return null;
      
      const roomArea = selectedRoom.width * selectedRoom.height;
      const requiredLumens = roomType.requiredLux * roomArea * safetyFactor;
      
      // Берём среднюю лампу для расчёта
      const avgLampLumens = 900; // Средняя LED лампа 10Вт
      const requiredLamps = Math.ceil(requiredLumens / avgLampLumens);
      
      return {
        requiredLumens: Math.round(requiredLumens),
        requiredLamps,
        avgLampLumens,
        roomType
      };
    }, [selectedRoom, safetyFactor]);

    // Экспорт проекта в JSON
    const exportProject = () => {
      const projectData = {
        version: '1.0',
        timestamp: Date.now(),
        rooms,
        wires,
        lamps,
        settings: {
          wirePrice,
          lampPrice,
          electricityPrice,
          safetyFactor
        }
      };
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lighting-project-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Проект успешно экспортирован!', 'success');
    };

    // Импорт проекта из JSON
    const importProject = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target.result);
          
          if (projectData.rooms && projectData.wires && projectData.lamps) {
            setRooms(projectData.rooms);
            setWires(projectData.wires);
            setLamps(projectData.lamps);
            
            if (projectData.settings) {
              if (projectData.settings.wirePrice) setWirePrice(projectData.settings.wirePrice);
              if (projectData.settings.lampPrice) setLampPrice(projectData.settings.lampPrice);
              if (projectData.settings.electricityPrice) setElectricityPrice(projectData.settings.electricityPrice);
              if (projectData.settings.safetyFactor) setSafetyFactor(projectData.settings.safetyFactor);
            }
            
            setHistory([]);
            showToast('Проект успешно загружен!', 'success');
          } else {
            showToast('Неверный формат файла', 'error');
          }
        } catch (error) {
          console.error('Ошибка при загрузке проекта:', error);
          showToast('Ошибка при загрузке проекта', 'error');
        }
      };
      reader.readAsText(file);
      // Сбрасываем value input, чтобы можно было загрузить тот же файл снова
      event.target.value = '';
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

      // Устанавливаем размер canvas с учётом зума для чёткости отрисовки
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Сохраняем контекст и применяем трансформации для зума и панорамирования
      ctx.save();
      // Применяем зум из центра экрана
      ctx.translate(displayWidth / 2, displayHeight / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-displayWidth / 2 + panOffset.x / zoom, -displayHeight / 2 + panOffset.y / zoom);

      // Расчёт видимых границ в мировых координатах (с учётом zoom и pan)
      const worldXMin = (-displayWidth / 2) / zoom + displayWidth / 2 - panOffset.x / zoom;
      const worldYMin = (-displayHeight / 2) / zoom + displayHeight / 2 - panOffset.y / zoom;
      const worldXMax = (displayWidth / 2) / zoom + displayWidth / 2 - panOffset.x / zoom;
      const worldYMax = (displayHeight / 2) / zoom + displayHeight / 2 - panOffset.y / zoom;

      // Отрисовка сетки — выравниваем по шагу scale
      ctx.strokeStyle = isDarkTheme ? '#2d3748' : '#e0e0e0';
      ctx.lineWidth = 1;

      const gridStartX = Math.floor(worldXMin / scale) * scale;
      const gridStartY = Math.floor(worldYMin / scale) * scale;

      for (let x = gridStartX; x <= worldXMax; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, worldYMin);
        ctx.lineTo(x, worldYMax);
        ctx.stroke();
      }

      for (let y = gridStartY; y <= worldYMax; y += scale) {
        ctx.beginPath();
        ctx.moveTo(worldXMin, y);
        ctx.lineTo(worldXMax, y);
        ctx.stroke();
      }

      // Отрисовка тепловой карты освещённости
      if (showHeatmap && lamps.length > 0) {
        const gridSize = 10; // Размер ячейки сетки для тепловой карты
        const maxLux = 500; // Максимальное значение для цветовой шкалы
        
        for (let x = 0; x < displayWidth; x += gridSize) {
          for (let y = 0; y < displayHeight; y += gridSize) {
            const lux = calculateLuxAtPoint(x, y);
            const normalizedLux = Math.min(lux / maxLux, 1);
            
            // Цветовая шкала от синего (низкая) через зелёный к красному (высокая)
            let r, g, b, alpha;
            if (normalizedLux < 0.3) {
              // Синий -> Зелёный
              const t = normalizedLux / 0.3;
              r = Math.round(30 * t);
              g = Math.round(144 * t + 30 * (1 - t));
              b = Math.round(255 * (1 - t));
              alpha = 0.3 + 0.2 * t;
            } else if (normalizedLux < 0.6) {
              // Зелёный -> Жёлтый
              const t = (normalizedLux - 0.3) / 0.3;
              r = Math.round(255 * t + 30 * (1 - t));
              g = 144 + Math.round(111 * t);
              b = Math.round(255 * (1 - t) * 0.3);
              alpha = 0.4 + 0.1 * t;
            } else {
              // Жёлтый -> Красный
              const t = (normalizedLux - 0.6) / 0.4;
              r = 255;
              g = Math.round(255 * (1 - t) + 0 * t);
              b = 80 * (1 - t);
              alpha = 0.5;
            }
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(x, y, gridSize, gridSize);
          }
        }
        
        // Легенда тепловой карты (рисуем без трансформации зума и панорамирования)
        ctx.restore();
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = displayWidth - legendWidth - 20;
        const legendY = 20;
        
        const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
        gradient.addColorStop(0, 'rgba(30, 144, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(34, 139, 34, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
        
        ctx.fillStyle = isDarkTheme ? '#cbd5e1' : '#2c3e50';
        ctx.font = '10px sans-serif';
        ctx.fillText('0', legendX, legendY + legendHeight + 12);
        ctx.fillText(`${maxLux}+ Люкс`, legendX + legendWidth - 60, legendY + legendHeight + 12);
        
        // Снова применяем трансформацию для отрисовки объектов
        ctx.save();
        ctx.translate(displayWidth / 2, displayHeight / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-displayWidth / 2 + panOffset.x / zoom, -displayHeight / 2 + panOffset.y / zoom);
      }

      // Отрисовка зон освещения лампочек (показываем только если тепловая карта выключена)
      if (!showHeatmap) {
        lamps.forEach(lamp => {
          // Расчёт реалистичных радиусов зон на основе физики освещения
          // Освещённость E = I / r², где I - сила света (примерно lumens / 4π для изотропного источника)
          // Для направленного света учитываем угол рассеивания
          const lumens = lamp.lumens;
          const angleRad = (lamp.angle / 2) * Math.PI / 180;
          const solidAngle = 2 * Math.PI * (1 - Math.cos(angleRad)); // Телесный угол
          const avgIntensity = lumens / solidAngle; // Средняя сила света в пределах угла
          
          // Радиусы для разных уровней освещённости (в метрах)
          // E = I / r² => r = sqrt(I / E)
          const radiusGoodM = Math.sqrt(avgIntensity / 300); // >300 Люкс (отлично)
          const radiusNormalM = Math.sqrt(avgIntensity / 150); // 150-300 Люкс (нормально)
          const radiusWeakM = Math.sqrt(avgIntensity / 50); // 50-150 Люкс (слабо)
          
          // Ограничиваем максимальный радиус физической зоной освещения лампы
          const maxRadiusM = lamp.height * Math.tan(angleRad);
          
          const radiusGood = Math.min(radiusGoodM, maxRadiusM) * scale;
          const radiusNormal = Math.min(radiusNormalM, maxRadiusM) * scale;
          const radiusWeak = Math.min(radiusWeakM, maxRadiusM) * scale;

          // Зона отлично освещена (>300 Люкс)
          ctx.beginPath();
          ctx.arc(lamp.x, lamp.y, radiusGood, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
          ctx.fill();

          // Зона нормально освещена (150-300 Люкс)
          ctx.beginPath();
          ctx.arc(lamp.x, lamp.y, radiusNormal, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
          ctx.fill();

          // Зона слабое освещение (50-150 Люкс)
          ctx.beginPath();
          ctx.arc(lamp.x, lamp.y, radiusWeak, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 67, 54, 0.12)';
          ctx.fill();

          // Контуры зон
          ctx.beginPath();
          ctx.arc(lamp.x, lamp.y, radiusGood, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(lamp.x, lamp.y, radiusNormal, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(lamp.x, lamp.y, radiusWeak, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(244, 67, 54, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // Отрисовка комнат
      rooms.forEach(room => {
        const w = room.width * scale;
        const h = room.height * scale;

        if (isDarkTheme) {
          // Темная тема: инвертируем, делаем темный фон и светлые бордеры
          ctx.fillStyle = room.id === selectedRoomId ? 'rgba(52, 152, 219, 0.15)' : 'rgba(0,0,0,0.25)';
          ctx.strokeStyle = room.id === selectedRoomId ? '#3498db' : '#94a3b8';
        } else {
          // Светлая тема: прозрачный фон и темные бордеры как было
          ctx.fillStyle = room.id === selectedRoomId ? 'rgba(52, 152, 219, 0.1)' : 'rgba(0,0,0,0.02)';
          ctx.strokeStyle = room.id === selectedRoomId ? '#3498db' : '#2c3e50';
        }

        ctx.fillRect(room.x, room.y, w, h);
        ctx.lineWidth = room.id === selectedRoomId ? 3 : 2;
        ctx.strokeRect(room.x, room.y, w, h);

        ctx.fillStyle = isDarkTheme ? '#cbd5e1' : '#2c3e50';
        ctx.font = '12px sans-serif';
        ctx.fillText(room.name, room.x + 8, room.y + 20);
      });

      // Отрисовка проводов
      wires.forEach(wire => {
        if (wire.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(wire.points[0].x, wire.points[0].y);
        for (let i = 1; i < wire.points.length; i++) {
          ctx.lineTo(wire.points[i].x, wire.points[i].y);
        }
        ctx.stroke();
      });

      // Отрисовка лампочек
      lamps.forEach(lamp => {
        const isSelected = lamp.id === selectedLampId;

        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, isSelected ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#3498db' : '#f39c12';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      });

      // Отрисовка текущего провода который рисуем
      if (currentWire.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        ctx.moveTo(currentWire[0].x, currentWire[0].y);
        for (let i = 1; i < currentWire.length; i++) {
          ctx.lineTo(currentWire[i].x, currentWire[i].y);
        }
        ctx.stroke();
      }

      ctx.restore();

    }, [rooms, wires, lamps, currentWire, selectedRoomId, selectedLampId, scale, panOffset, showHeatmap, zoom, calculateLuxAtPoint]);

    const getCoords = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY;
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Преобразуем экранные координаты в координаты canvas с учётом zoom и pan
      // Обратное преобразование трансформации canvas:
      // 1. Вычитаем смещение canvas на странице
      // 2. Учитываем зум (делим на zoom)
      // 3. Учитываем панорамирование
      const x = ((clientX - rect.left) - displayWidth / 2) / zoom + displayWidth / 2 - panOffset.x / zoom;
      const y = ((clientY - rect.top) - displayHeight / 2) / zoom + displayHeight / 2 - panOffset.y / zoom;
      
      return { x, y };
    };

    const findRoomAtPosition = (x, y) => {
      for (let i = rooms.length - 1; i >= 0; i--) {
        const room = rooms[i];
        if (x >= room.x && x <= room.x + room.width * scale &&
          y >= room.y && y <= room.y + room.height * scale) {
          return room;
        }
      }
      return null;
    };

    const findLampAtPosition = (x, y) => {
      for (let i = lamps.length - 1; i >= 0; i--) {
        const lamp = lamps[i];
        const distance = Math.sqrt(Math.pow(x - lamp.x, 2) + Math.pow(y - lamp.y, 2));
        if (distance < 15) return lamp;
      }
      return null;
    };

    const handlePointerDown = (e) => {
      e.preventDefault();
      // Prevent touch scrolling on mobile devices
      if (e.touches && e.touches.length > 0) {
        e.stopPropagation();
      }
      const coords = getCoords(e);

      if (activeTool === TOOLS.CURSOR) {
        const lamp = findLampAtPosition(coords.x, coords.y);
        if (lamp) {
          setSelectedLampId(lamp.id);
          setSelectedRoomId(null);
          setIsDragging(true);
          setDragOffset({
            x: coords.x - lamp.x,
            y: coords.y - lamp.y
          });
          // Сохраняем состояние лампы перед перетаскиванием
          setTempDragObject({ type: 'lampMove', id: lamp.id, before: {...lamp} });
          return;
        }

        const room = findRoomAtPosition(coords.x, coords.y);
        if (room) {
          setSelectedRoomId(room.id);
          setSelectedLampId(null);
          setIsDragging(true);
          setDragOffset({
            x: coords.x - room.x,
            y: coords.y - room.y
          });
          // Сохраняем состояние комнаты перед перетаскиванием
          setTempDragObject({ type: 'roomMove', id: room.id, before: {...room} });
        } else {
          setSelectedRoomId(null);
          setSelectedLampId(null);
        }
      } else if (activeTool === TOOLS.WIRE) {
        setIsDrawing(true);
        setCurrentWire([coords]);
      } else if (activeTool === TOOLS.LAMP) {
        const newLamp = {
          id: Date.now(),
          x: coords.x,
          y: coords.y,
          power: 10,
          type: 'led',
          angle: 120,
          height: 2.5,
          lumens: 900
        };
        setLamps(prev => [...prev, newLamp]);
        setHistory(prev => [...prev, { type: 'lamp', data: newLamp }]);
      } else if (activeTool === TOOLS.ROOM) {
        const newRoom = {
          id: Date.now(),
          x: Math.round(coords.x / scale) * scale,
          y: Math.round(coords.y / scale) * scale,
          width: 4,
          height: 3,
          ceilingHeight: 2.7,
          name: `Комната ${rooms.length + 1}`,
          type: 'living' // Добавляем тип помещения по умолчанию
        };

        if (!checkCollision(newRoom)) {
          setRooms(prev => [...prev, newRoom]);
          setSelectedRoomId(newRoom.id);
          setSelectedLampId(null);
          setHistory(prev => [...prev, { type: 'room', data: newRoom }]);
        }
      }
    };

    const handlePointerMove = (e) => {
      e.preventDefault();
      // Prevent touch scrolling on mobile devices
      if (e.touches && e.touches.length > 0) {
        e.stopPropagation();
      }
      const coords = getCoords(e);

      if (isDragging) {
        if (selectedRoomId) {
          const canvas = canvasRef.current;
          const maxX = canvas.width - selectedRoom.width * scale;
          const maxY = canvas.height - selectedRoom.height * scale;

          setRooms(prev => prev.map(room => {
            if (room.id !== selectedRoomId) return room;

            let newX = Math.round((coords.x - dragOffset.x) / (scale / 2)) * (scale / 2);
            let newY = Math.round((coords.y - dragOffset.y) / (scale / 2)) * (scale / 2);

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            const updatedRoom = { ...room, x: newX, y: newY };

            if (!checkCollision(updatedRoom, selectedRoomId)) {
              return updatedRoom;
            }
            return room;
          }));
        } else if (selectedLampId) {
          setLamps(prev => prev.map(lamp =>
            lamp.id === selectedLampId
              ? { ...lamp, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
              : lamp
          ));
        }
      }

      if (isDrawing) {
        setCurrentWire(prev => [...prev, coords]);
      }
    };

    const handlePointerUp = () => {
      if (currentWire.length > 1) {
        const newWire = {
          points: currentWire,
          color: '#e74c3c'
        };
        setWires(prev => [...prev, newWire]);
        setHistory(prev => [...prev, { type: 'wire', data: newWire }]);
      }
      
      // Очищаем временное состояние перетаскивания
      if (tempDragObject) {
        setHistory(prev => [...prev, tempDragObject]);
        setTempDragObject(null);
      }
      
      setIsDrawing(false);
      setIsDragging(false);
      setCurrentWire([]);
    };

    const clearWires = () => {
      setWires([]);
      setHistory(prev => prev.filter(h => h.type !== 'wire'));
      setShowClearWiresModal(false);
    };

    const clearLamps = () => {
      setLamps([]);
      setSelectedLampId(null);
      setHistory(prev => prev.filter(h => h.type !== 'lamp'));
      setShowClearLampsModal(false);
    };

    const undoLastAction = () => {
      if (history.length === 0) return;

      const lastAction = history[history.length - 1];

      if (lastAction.type === 'wire') {
        setWires(prev => prev.slice(0, -1));
      } else if (lastAction.type === 'lamp') {
        setLamps(prev => prev.slice(0, -1));
      } else if (lastAction.type === 'room') {
        setRooms(prev => prev.slice(0, -1));
      } else if (lastAction.type === 'lampDelete') {
        // Восстанавливаем удаленную лампу
        setLamps(prev => [...prev, lastAction.data]);
      } else if (lastAction.type === 'roomDelete') {
        // Восстанавливаем удаленную комнату
        setRooms(prev => [...prev, lastAction.data]);
      } else if (lastAction.type === 'lampMove') {
        // Отменяем перемещение лампы
        setLamps(prev => prev.map(l => l.id === lastAction.id ? lastAction.before : l));
      } else if (lastAction.type === 'roomMove') {
        // Отменяем перемещение комнаты
        setRooms(prev => prev.map(r => r.id === lastAction.id ? lastAction.before : r));
      } else if (lastAction.type === 'roomUpdate') {
        // Отменяем изменение параметров комнаты
        setRooms(prev => prev.map(r => r.id === lastAction.id ? lastAction.before : r));
      } else if (lastAction.type === 'lampUpdate') {
        // Отменяем изменение параметров лампы
        setLamps(prev => prev.map(l => l.id === lastAction.id ? lastAction.before : l));
      }

      // Ограничиваем историю последними 5 действиями
      setHistory(prev => prev.slice(0, -1).slice(-5));
    };

    const deleteSelectedRoom = () => {
      if (rooms.length <= 1) return;
      const deletedRoom = rooms.find(r => r.id === selectedRoomId);
      setRooms(prev => prev.filter(r => r.id !== selectedRoomId));
      setSelectedRoomId(rooms[0].id !== selectedRoomId ? rooms[0].id : rooms[1].id);
      setHistory(prev => [...prev, { type: 'roomDelete', data: deletedRoom }]);
    };

    const deleteSelectedLamp = () => {
      if (!selectedLampId) return;
      const deletedLamp = lamps.find(l => l.id === selectedLampId);
      setLamps(prev => prev.filter(l => l.id !== selectedLampId));
      setSelectedLampId(null);
      setHistory(prev => [...prev, { type: 'lampDelete', data: deletedLamp }]);
    };

    const updateSelectedRoom = (field, value) => {
      let val = value;
      // Только числовые поля округляем
      if (field !== 'type' && field !== 'name') {
        val = parseFloat(value);
        if (!isNaN(val)) {
          val = Math.round(val * 2) / 2; // Округление до 0.5
        }
      }
      
      setRooms(prev => prev.map(room =>
        room.id === selectedRoomId
          ? { ...room, [field]: val }
          : room
      ));
      // Принудительно триггерим сохранение
      setHistory(h => [...h, { type: 'roomUpdate' }]);
    };

    const updateSelectedLamp = (field, value) => {
      const oldLamp = lamps.find(l => l.id === selectedLampId);
      
      setLamps(prev => prev.map(lamp => {
        if (lamp.id !== selectedLampId) return lamp;
        const updated = { ...lamp, [field]: parseFloat(value) || value };

        if (field === 'power' || field === 'type') {
          const lampType = LAMP_TYPES.find(t => t.id === updated.type);
          updated.lumens = Math.round(updated.power * (lampType?.lmPerWatt || 90));
        }

        return updated;
      }));
      
      if (oldLamp) {
        setHistory(prev => [...prev, { 
          type: 'lampUpdate', 
          id: selectedLampId, 
          before: oldLamp 
        }].slice(-5));
      }
    };

    const lighting = calculateTotalLighting();
    const wireLength = calculateWireLength();

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Калькулятор освещения и проводки</h1>

        <div className={styles.toolbar}>
          {Object.entries({
            [TOOLS.CURSOR]: 'cursorIcoRedact',
            [TOOLS.WIRE]: 'cableIcoRedact',
            [TOOLS.LAMP]: 'lampIcoRedact',
            [TOOLS.ROOM]: 'roomIcoRedact'
          }).map(([tool, iconName]) => (
            <button
              key={tool}
              className={`${styles.toolBtn} ${activeTool === tool ? styles.activeTool : ''}`}
              onClick={() => setActiveTool(tool)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <img
                src={`/images/ico/${iconName}.png`}
                alt={tool}
                style={{ width: '18px', height: '18px' }}
              />
              {{
                'cursorIcoRedact': 'Курсор',
                'cableIcoRedact': 'Провод',
                'lampIcoRedact': 'Лампа',
                'roomIcoRedact': 'Комната'
              }[iconName]}
            </button>
          ))}

          <div className={styles.legendRow}>
            <div className={styles.legendItemSmall} style={{ background: 'rgba(76, 175, 80, 0.35)' }}>🟢 Хорошо {'>'}300 Люкс</div>
            <div className={styles.legendItemSmall} style={{ background: 'rgba(255, 235, 59, 0.25)' }}>🟡 Нормально 150-300 Люкс</div>
            <div className={styles.legendItemSmall} style={{ background: 'rgba(244, 67, 54, 0.15)' }}>🔴 Слабо {'<'}150 Люкс</div>
          </div>

          <button
            className={`${styles.toolBtn} ${showHeatmap ? styles.activeTool : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <img className={styles.calcImg} src='/images/ico/icoTermo.png' alt="Тепловая карта"></img> Тепловая карта
          </button>

          <button
            className={styles.toolBtn}
            onClick={exportProject}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <img className={styles.calcImg} src='/images/ico/icoExp.png' alt='Экспорт'></img> Экспорт
          </button>

          <label className={styles.toolBtn} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <img className={styles.calcImg} src='/images/ico/icoImp.png' alt='Импорт'></img>  Импорт
            <input
              type="file"
              accept=".json"
              onChange={importProject}
              style={{ display: 'none' }}
            />
          </label>

          <button
            className={styles.toolBtn}
            onClick={() => navigate('/guide')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: '110' }}
            title="Руководство по использованию"
          >
            <img className={styles.calcImg} src='/images/ico/icoHelpi.png' alt='Помощь'></img> Помощь
          </button>

        </div>

        <div className={styles.grid}>
          <div className={`${styles.controls} ${controlsCollapsed ? styles.collapsed : ''}`}>
            <button
              className={`${styles.controlsToggle} ${controlsCollapsed ? 'collapsed' : ''}`}
              onClick={() => setControlsCollapsed(!controlsCollapsed)}
              aria-label={controlsCollapsed ? 'Показать панели' : 'Скрыть панели'}
            >
              {controlsCollapsed ? '→ Показать панели' : '← Скрыть панели'}
            </button>
            {selectedLamp ? (
              <div className={styles.card}>
                <h3>Параметры лампы</h3>

                <div className={styles.inputGroup}>
                  <label>Тип лампы</label>
                  <select
                    value={selectedLamp.type}
                    onChange={(e) => updateSelectedLamp('type', e.target.value)}
                    className={styles.select}
                  >
                    {LAMP_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const lampTypeInfo = LAMP_TYPES.find(t => t.id === selectedLamp.type);
                  if (!lampTypeInfo) return null;
                  return (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      borderRadius: '6px', 
                      background: 'rgba(52, 152, 219, 0.1)', 
                      border: '1px solid rgba(52, 152, 219, 0.3)',
                      fontSize: '12px'
                    }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>📊 {lampTypeInfo.name}:</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Светоотдача:</span>
                        <strong>{lampTypeInfo.lmPerWatt} Лм/Вт</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Цветовая температура:</span>
                        <strong>{lampTypeInfo.colorTemp}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Срок службы:</span>
                        <strong>~{lampTypeInfo.lifespan.toLocaleString()} ч</strong>
                      </div>
                    </div>
                  );
                })()}

                <div className={styles.inputGroup}>
                  <label>Мощность (Вт)</label>
                  <input
                    type="number"
                    value={selectedLamp.power}
                    onChange={(e) => updateSelectedLamp('power', e.target.value)}
                    step="0,5"
                    min="1"
                    max="200"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Световой поток (Лм)</label>
                  <input
                    type="number"
                    value={selectedLamp.lumens}
                    onChange={(e) => updateSelectedLamp('lumens', e.target.value)}
                    step="50"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Угол рассеивания (°)</label>
                  <input
                    type="number"
                    value={selectedLamp.angle}
                    onChange={(e) => updateSelectedLamp('angle', e.target.value)}
                    step="5"
                    min="30"
                    max="180"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Высота установки (м)</label>
                  <input
                    type="number"
                    value={selectedLamp.height}
                    onChange={(e) => updateSelectedLamp('height', e.target.value)}
                    step="0.5"
                    min="1"
                    max="5"
                  />
                </div>

                <button className={styles.deleteBtn} onClick={deleteSelectedLamp}>
                  Удалить лампу
                </button>
              </div>
            ) : selectedRoom ? (
              <div className={styles.card}>
                <h3>Параметры комнаты</h3>

                <div className={styles.inputGroup}>
                  <label>Название</label>
                  <input
                    type="text"
                    value={selectedRoom.name}
                    onChange={(e) => setRooms(prev => prev.map(r =>
                      r.id === selectedRoomId ? { ...r, name: e.target.value } : r
                    ))}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Ширина (м)</label>
                  <input
                    type="number"
                    value={selectedRoom.width}
                    onChange={(e) => updateSelectedRoom('width', e.target.value)}
                    step="0.5"
                    min="1"
                    max="20"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Глубина (м)</label>
                  <input
                    type="number"
                    value={selectedRoom.height}
                    onChange={(e) => updateSelectedRoom('height', e.target.value)}
                    step="0.1"
                    min="1"
                    max="20"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Высота потолков (м)</label>
                  <input
                    type="number"
                    value={selectedRoom.ceilingHeight}
                    onChange={(e) => updateSelectedRoom('ceilingHeight', e.target.value)}
                    step="0.1"
                    min="2"
                    max="5"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Тип помещения</label>
                  <select
                    value={selectedRoom.type || 'living'}
                    onChange={(e) => updateSelectedRoom('type', e.target.value)}
                    className={styles.select}
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.name} ({type.requiredLux} Люкс)</option>
                    ))}
                  </select>
                </div>

                {selectedRoom.type && (() => {
                  const roomType = ROOM_TYPES.find(t => t.id === selectedRoom.type);
                  const roomArea = selectedRoom.width * selectedRoom.height;
                  const roomLumens = lamps.filter(l => 
                    l.x >= selectedRoom.x && l.x <= selectedRoom.x + selectedRoom.width * scale &&
                    l.y >= selectedRoom.y && l.y <= selectedRoom.y + selectedRoom.height * scale
                  ).reduce((sum, l) => sum + l.lumens, 0);
                  const currentLux = roomArea > 0 ? Math.round(roomLumens / roomArea) : 0;
                  const percent = Math.min(100, Math.round(currentLux / roomType.requiredLux * 100));
                  
                  const getStatusColor = () => {
                    if (percent >= 100) return '#27ae60';
                    if (percent >= 70) return '#f39c12';
                    return '#e74c3c';
                  };

                  return (
                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: getStatusColor() + '20', border: `1px solid ${getStatusColor()}50` }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Норма освещённости: {roomType.requiredLux} Люкс</div>
                      <div>Текущая: <strong style={{ color: getStatusColor() }}>{currentLux} Люкс</strong></div>
                      <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: getStatusColor(), borderRadius: '3px' }}/>
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                        {percent >= 100 ? ' Освещения достаточно' : percent >= 70 ? `⚠️ Недостаток ${roomType.requiredLux - currentLux} Люкс` : `🔴 Критически мало, нужно ещё ~${Math.ceil((roomType.requiredLux * roomArea - roomLumens) / 900)} ламп`}
                      </div>
                    </div>
                  );
                })()}

                {rooms.length > 1 && (
                  <button className={styles.deleteBtn} onClick={deleteSelectedRoom}>
                    Удалить комнату
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.card}>
                <h3>Параметры</h3>
                <p className={styles.hint}>Выберите комнату или лампу на плане для редактирования</p>
              </div>
            )}


      
            <div className={styles.card}>
              <h3>Проводка</h3>
              <div className={styles.resultItem}>
                <span>Общая длина проводов:</span>
                <strong>{wireLength} м</strong>
              </div>

              <div className={styles.resultItem}>
                <span>Количество проводов:</span>
                <strong>{wires.length} шт</strong>
              </div>

              <button
                className={`${styles.undoBtn} ${history.length === 0 ? styles.disabledBtn : ''}`}
                onClick={undoLastAction}
                disabled={history.length === 0}
              >
                Отменить последнее действие
              </button>

              <div className={styles.btnGroup}>
                <button className={styles.clearBtn} onClick={() => setShowClearWiresModal(true)}>
                  Провода
                </button>
                <button className={styles.clearBtn} onClick={() => setShowClearLampsModal(true)} style={{ background: '#f39c12' }}>
                  Лампы
                </button>
              </div>
            </div>
      <div className={styles.card}>
              <h3>Общие расчёты</h3>
              <div className={styles.resultItem}>
                <span>Общая площадь:</span>
                <strong>{lighting.totalArea} м²</strong>
              </div>
              <div className={styles.resultItem}>
                <span>Общий объём:</span>
                <strong>{lighting.totalVolume} м³</strong>
              </div>
              <div className={styles.resultItem}>
                <span>Суммарный световой поток:</span>
                <strong>{lighting.totalLumens} Люмен</strong>
              </div>
              <div className={styles.resultItem}>
                <span>Суммарная мощность:</span>
                <strong>{lighting.totalWattage} Вт</strong>
              </div>
              <div className={styles.resultItem}>
                <span>Средняя освещённость:</span>
                <strong>{lighting.averageLux} Люкс</strong>
              </div>
              <div className={styles.resultItem}>
                <span>Количество лампочек:</span>
                <strong>{lighting.lampsCount} шт</strong>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Автоматический расчёт</h3>
              
              <div className={styles.inputGroup}>
                <label>Коэффициент запаса</label>
                <input
                  type="number"
                  value={safetyFactor}
                  onChange={(e) => setSafetyFactor(parseFloat(e.target.value) || 1)}
                  step="0.1"
                  min="1"
                  max="2"
                />
              </div>

              {(() => {
                const calcResult = calculateRequiredLamps();
                if (!calcResult) return (
                  <p className={styles.hint}>Выберите комнату с указанным типом помещения</p>
                );
                
                const currentLampsInRoom = lamps.filter(l => 
                  l.x >= selectedRoom.x && l.x <= selectedRoom.x + selectedRoom.width * scale &&
                  l.y >= selectedRoom.y && l.y <= selectedRoom.y + selectedRoom.height * scale
                ).length;
                
                return (
                  <div style={{ marginTop: '8px' }}>
                    <div className={styles.resultItem}>
                      <span>Требуемый световой поток:</span>
                      <strong>{calcResult.requiredLumens} Лм</strong>
                    </div>
                    <div className={styles.resultItem}>
                      <span>Необходимо ламп (10Вт LED):</span>
                      <strong>{calcResult.requiredLamps} шт</strong>
                    </div>
                    <div className={styles.resultItem}>
                      <span>Текущее ламп в комнате:</span>
                      <strong>{currentLampsInRoom} шт</strong>
                    </div>
                    <div className={styles.resultItem} style={{ 
                      fontWeight: 'bold', 
                      color: currentLampsInRoom >= calcResult.requiredLamps ? '#27ae60' : '#e74c3c',
                      borderTop: '1px solid #e0e0e0',
                      paddingTop: '6px'
                    }}>
                      <span>Разница:</span>
                      <strong>{currentLampsInRoom >= calcResult.requiredLamps ? ' Норма' : ` Нужно ещё ${calcResult.requiredLamps - currentLampsInRoom}`}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className={styles.card}>
              <h3>Расчёт стоимости</h3>
              
              <div className={styles.inputGroup}>
                <label>Цена провода за метр, ₽</label>
                <input
                  type="number"
                  value={wirePrice}
                  onChange={(e) => setWirePrice(parseFloat(e.target.value) || 0)}
                  step="1"
                  min="0"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Цена одной лампы, ₽</label>
                <input
                  type="number"
                  value={lampPrice}
                  onChange={(e) => setLampPrice(parseFloat(e.target.value) || 0)}
                  step="1"
                  min="0"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Цена электроэнергии, ₽/кВт*ч</label>
                <input
                  type="number"
                  value={electricityPrice}
                  onChange={(e) => setElectricityPrice(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>

              <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }}/>

              <div className={styles.resultItem}>
                <span>Стоимость проводки:</span>
                <strong>{Math.round(wireLength * wirePrice)} ₽</strong>
              </div>

              <div className={styles.resultItem}>
                <span>Стоимость ламп:</span>
                <strong>{lighting.lampsCount * lampPrice} ₽</strong>
              </div>

              <div className={styles.resultItem} style={{ fontWeight: 'bold', fontSize: '15px', paddingTop: '4px', borderTop: '1px solid #e0e0e0' }}>
                <span>Итого общая стоимость:</span>
                <strong style={{ color: '#27ae60' }}>{Math.round(wireLength * wirePrice + lighting.lampsCount * lampPrice)} ₽</strong>
              </div>

              <div className={styles.resultItem} style={{ marginTop: '10px', opacity: 0.8 }}>
                <span>Годовой расход электроэнергии:</span>
                <strong>{Math.round(lighting.totalWattage * 5 * 365 / 1000)} кВт*ч</strong>
              </div>

              <div className={styles.resultItem}>
                <span>Стоимость в год:</span>
                <strong style={{ color: '#e74c3c' }}>{Math.round(lighting.totalWattage * 5 * 365 / 1000 * electricityPrice)} ₽/год</strong>
              </div>
            </div>
          </div>

          <div className={styles.canvasWrapper}>
            {/* Кнопки управления зумом */}
            <div className={styles.zoomControls}>
              <button 
                className={styles.zoomBtn} 
                onClick={handleZoomIn}
                title="Приблизить"
                disabled={zoom >= 3}
              >
                +
              </button>
              <button 
                className={styles.zoomBtn} 
                onClick={handleZoomReset}
                title="Сбросить масштаб"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button 
                className={styles.zoomBtn} 
                onClick={handleZoomOut}
                title="Отдалить"
                disabled={zoom <= 0.5}
              >
                −
              </button>
              <button 
                className={styles.zoomBtn}
                onClick={handleCenterView}
                title="Вернуться в центр"
                style={{ fontSize: '14px', lineHeight: 1 }}
              >
                ⌖
              </button>
            </div>
            
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onWheel={handleWheel}
              onMouseDown={(e) => {
                // Проверяем, начинается ли панорамирование (Shift+клик или средняя кнопка)
                if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                  handlePanStart(e);
                } else {
                  handlePointerDown(e);
                }
              }}
              onMouseMove={(e) => {
                if (isPanning) {
                  handlePanMove(e);
                } else {
                  handlePointerMove(e);
                }
              }}
              onMouseUp={(e) => {
                if (isPanning) {
                  handlePanEnd();
                } else {
                  handlePointerUp(e);
                }
              }}
              onMouseLeave={(e) => {
                if (isPanning) {
                  handlePanEnd();
                } else {
                  handlePointerUp(e);
                }
              }}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  // Пинч для зума — двумя пальцами
                  e.preventDefault();
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  setLastTouchPinchDist(Math.sqrt(dx * dx + dy * dy));
                } else if (e.touches.length === 1) {
                  // Одним пальцем — пробуем панорамирование, если не на объекте
                  const coords = getCoords(e);
                  const lamp = findLampAtPosition(coords.x, coords.y);
                  const room = findRoomAtPosition(coords.x, coords.y);
                  
                  if (!lamp && !room && activeTool === TOOLS.CURSOR) {
                    // Ничего не нашли — начинаем панорамирование
                    setIsTouchPanning(true);
                    setTouchPanStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                    setTouchPanOffsetStart({ ...panOffset });
                    e.preventDefault();
                    e.stopPropagation();
                  } else {
                    // Нашли объект — стандартное поведение
                    handlePointerDown(e);
                  }
                } else {
                  handlePointerDown(e);
                }
              }}
              onTouchMove={(e) => {
                if (isTouchPanning && e.touches.length === 1) {
                  e.preventDefault();
                  setPanOffset({
                    x: touchPanOffsetStart.x + (e.touches[0].clientX - touchPanStart.x),
                    y: touchPanOffsetStart.y + (e.touches[0].clientY - touchPanStart.y)
                  });
                } else if (lastTouchPinchDist !== null && e.touches.length === 2) {
                  // Пинч-зум
                  e.preventDefault();
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  const newDist = Math.sqrt(dx * dx + dy * dy);
                  const delta = (newDist - lastTouchPinchDist) * 0.005;
                  setZoom(prev => Math.max(0.5, Math.min(prev + delta, 3)));
                  setLastTouchPinchDist(newDist);
                } else {
                  handlePointerMove(e);
                }
              }}
              onTouchEnd={(e) => {
                setIsTouchPanning(false);
                setLastTouchPinchDist(null);
                handlePointerUp(e);
              }}
              onTouchCancel={(e) => {
                setIsTouchPanning(false);
                setLastTouchPinchDist(null);
                handlePointerUp(e);
              }}
              style={{
                cursor: isPanning ? 'grabbing' : activeTool === TOOLS.CURSOR ? 'default' : 'crosshair'
              }}
            />
            <div className={styles.scaleHint}>
              Сетка: 1 метр | Инструмент: {activeTool} | Shift+drag для панорамирования
            </div>
          </div>
        </div>

        {/* Модальное окно подтверждения удаления проводов */}
        <ConfirmModal
          isOpen={showClearWiresModal}
          onClose={() => setShowClearWiresModal(false)}
          onConfirm={clearWires}
          title="Удаление всех проводов"
          message="Вы действительно хотите удалить все нарисованные провода? Это действие нельзя отменить."
          confirmText="Удалить провода"
        />

        {/* Модальное окно подтверждения удаления ламп */}
        <ConfirmModal
          isOpen={showClearLampsModal}
          onClose={() => setShowClearLampsModal(false)}
          onConfirm={clearLamps}
          title="Удаление всех ламп"
          message="Вы действительно хотите удалить все добавленные лампы? Это действие нельзя отменить."
          confirmText="Удалить лампы"
        />

        {/* Уведомления (Toast) */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

      </div>
    );
  };

  export default LightingCalculator;
