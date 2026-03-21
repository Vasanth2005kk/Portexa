// Three.js Interactive Background — Fixed Icons Edition
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // Initialize Global Settings
  window.bgSettings = {
    enabled: true,
    speed: 1.0,
    particleCount: 150,
    accentColor: '#00f5ff',
    secondaryColor: '#bf00ff',
  };

  // Helper: Get Icon URL (Supports local uploads, custom mappings & Devicon)
  function getIconUrl(name, rawIcon) {
    if (rawIcon && (rawIcon.startsWith('/') || rawIcon.startsWith('http'))) {
      return rawIcon;
    }
    
    let slug = name.toLowerCase().trim();
    
    // Check custom Admin Mappings first
    if (window.bgSettings && window.bgSettings.iconMappings && window.bgSettings.iconMappings[slug]) {
      slug = window.bgSettings.iconMappings[slug];
    } else {
      // Default fallback logic
      slug = slug
        .replace('node.js', 'nodejs').replace('vue.js', 'vuejs')
        .replace('c++', 'cplusplus').replace('c#', 'csharp')
        .replace('mongodb', 'mongodb').replace('postgresql', 'postgresql')
        .replace('flask', 'flask').replace('aws', 'amazonwebservices')
        .split(' ')[0];
    }
    
    return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`;
  }

  // const brandColors = {
  //   'python': '#000000ff', 'javascript': '#f7df1e', 'react': '#61dafb',
  //   'vue': '#42b883', 'node': '#339933', 'docker': '#2496ed',
  //   'typescript': '#3178c6', 'html': '#e34f26', 'css': '#1572b6',
  //   'django': '#092e20', 'flask': '#ffffff', 'postgresql': '#336791',
  //   'mongodb': '#47a248', 'aws': '#ff9900', 'rust': '#ce422b', 'go': '#00aed8'
  // };

  const techData = [
    { name: 'Python' }, { name: 'JavaScript' }, { name: 'React' }, { name: 'Node.js' },
    { name: 'Docker' }, { name: 'TypeScript' }, { name: 'Rust' }, { name: 'Go' },
    { name: 'HTML5' }, { name: 'CSS3' }, { name: 'PostgreSQL' }, { name: 'MongoDB' }
  ];

  const floaters = [];

  // Helper: Create High-Visibility Glassmorphic Card
  function makeCardTexture(name, iconUrl, callback) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // const color = brandColors[name.toLowerCase().replace('.js', '').trim()] || '#00f5ff';

    const draw = (img = null) => {
      ctx.clearRect(0, 0, 512, 512);

      // 1. Draw Card Base (Glassy Dark)
      // const r = 50;
      // ctx.beginPath();
      // ctx.roundRect(40, 40, 432, 432, r);
      // ctx.fillStyle = 'rgba(10, 10, 25, 0.9)'; // Darker for better contrast
      // ctx.fill();

      // 2. Neon Glow Border
      // ctx.shadowBlur = 30;
      // ctx.shadowColor = color;
      // ctx.strokeStyle = color;
      // ctx.lineWidth = 15;
      // ctx.stroke();

      // 3. Logo/Initials
      if (img) {
        ctx.shadowBlur = 0;
        const size = 220;
        ctx.drawImage(img, 256 - size / 2, 256 - size / 1.6, size, size);
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 90px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name.slice(0, 2).toUpperCase(), 256, 260);
      }

      // 4. Technology Label (VERY OBVIOUS)
      // ctx.shadowBlur = 10;
      // ctx.shadowColor = 'rgba(0,0,0,0.8)';
      // ctx.fillStyle = '#ffffff';
      // ctx.font = '700 48px "Outfit", sans-serif';
      // ctx.textAlign = 'center';
      // ctx.fillText(name, 256, 420);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      callback(texture);
    };

    if (iconUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw(null);
      img.src = iconUrl;
    } else {
      draw(null);
    }
  }

  function createFloater(data) {
    const geo = new THREE.PlaneGeometry(6, 6);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    const spread = 65;
    mesh.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 40);
    mesh.rotation.set(Math.random() * 0.4, Math.random() * 0.4, (Math.random() - 0.5) * 0.3);

    const f = {
      mesh, vx: (Math.random() - 0.5) * 0.014, vy: (Math.random() - 0.5) * 0.014, vz: (Math.random() - 0.5) * 0.007,
      rx: (Math.random() - 0.5) * 0.004, ry: (Math.random() - 0.5) * 0.004,
      targetOpacity: 0.6 + Math.random() * 0.35, currentOpacity: 0
    };

    makeCardTexture(data.name, getIconUrl(data.name, data.icon), (tex) => {
      mesh.material.map = tex;
      mesh.material.needsUpdate = true;
    });
    return f;
  }

  const FLOATER_COUNT = parseInt((window.bgSettings && window.bgSettings.floaterCount) || 25);
  for (let i = 0; i < FLOATER_COUNT; i++) {
    const f = createFloater(techData[i % techData.length]);
    scene.add(f.mesh); floaters.push(f);
  }

  let particles;
  function initParticles() {
    if (particles) scene.remove(particles);
    const pc = parseInt((window.bgSettings && window.bgSettings.particleCount) || 120);
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pc * 3);
    for (let i = 0; i < pc * 3; i++) pos[i] = (Math.random() - 0.5) * 140;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.14, color: 0x00f5ff, transparent: true, opacity: 0.25 }));
    scene.add(particles);
  }
  initParticles();

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollY = 0;
  window.addEventListener('mousemove', (e) => { mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2; mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2; });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const speed = parseFloat((window.bgSettings && window.bgSettings.speed) || 1);
    const t = clock.getElapsedTime();

    mouse.x += (mouse.targetX - mouse.x) * 0.05; mouse.y += (mouse.targetY - mouse.y) * 0.05;
    camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02; camera.position.y += (mouse.y * 4 - camera.position.y) * 0.02;
    camera.position.z = 30 + (scrollY * 0.025); camera.lookAt(0, 0, 0);

    const scrollScale = 1 + (scrollY * 0.0006);
    floaters.forEach((f, i) => {
      if (!f.mesh.material.map) return;
      f.mesh.position.x += f.vx * speed; f.mesh.position.y += f.vy * speed; f.mesh.position.z += f.vz * speed;
      f.mesh.rotation.x += f.rx * speed; f.mesh.rotation.y += f.ry * speed;
      f.mesh.position.x += mouse.x * 0.015; f.mesh.position.y += mouse.y * 0.015;
      const scale = scrollScale + Math.sin(t * 0.5 + i) * 0.12; f.mesh.scale.setScalar(scale);

      if (f.currentOpacity < f.targetOpacity) { f.currentOpacity += 0.008; f.mesh.material.opacity = f.currentOpacity; }
      const B = 45;
      if (Math.abs(f.mesh.position.x) > B) f.vx *= -1; if (Math.abs(f.mesh.position.y) > B) f.vy *= -1; if (Math.abs(f.mesh.position.z) > 30) f.vz *= -1;
    });

    if (particles) particles.rotation.y = t * 0.015 * speed;
    renderer.render(scene, camera);
  }

  window.updateBgLabels = (skills) => {
    if (!skills || !skills.length) return;
    floaters.forEach((f, i) => {
      const s = skills[i % skills.length];
      makeCardTexture(s.name, getIconUrl(s.name, s.icon), (tex) => { if (f.mesh.material.map) f.mesh.material.map.dispose(); f.mesh.material.map = tex; f.mesh.material.needsUpdate = true; });
    });
  };

  animate();
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  window.refreshParticles = initParticles;
})();


