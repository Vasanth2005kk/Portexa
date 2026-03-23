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

  // Initialize Global Settings (will be updated by portfolio.js)
  window.bgSettings = {
    enabled: true,
    speed: 1.0,
    particleCount: 120,
    floaterCount: 25,
    accentColor: '#00f5ff',
    secondaryColor: '#bf00ff',
    iconMappings: {}
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
      // Default fallback logic for devicon
      const deviconMap = {
        'node.js': 'nodejs/nodejs-original.svg',
        'vue.js': 'vuejs/vuejs-original.svg',
        'c++': 'cplusplus/cplusplus-original.svg',
        'c#': 'csharp/csharp-original.svg',
        'html5': 'html5/html5-original.svg',
        'css3': 'css3/css3-original.svg',
        'python': 'python/python-original.svg',
        'javascript': 'javascript/javascript-original.svg',
        'react': 'react/react-original.svg',
        'typescript': 'typescript/typescript-original.svg',
        'docker': 'docker/docker-original.svg',
        'postgresql': 'postgresql/postgresql-original.svg',
        'mongodb': 'mongodb/mongodb-original.svg',
        'aws': 'amazonwebservices/amazonwebservices-original-wordmark.svg',
        'rust': 'rust/rust-original.svg',
        'go': 'go/go-original.svg',
        'java': 'java/java-original.svg',
        'ruby': 'ruby/ruby-original.svg',
        'php': 'php/php-original.svg',
        'swift': 'swift/swift-original.svg',
        'kotlin': 'kotlin/kotlin-original.svg',
        'flask': 'flask/flask-original.svg',
        'django': 'django/django-plain.svg',
        'next.js': 'nextjs/nextjs-original.svg',
        'tailwindcss': 'tailwindcss/tailwindcss-original.svg',
        'tailwind': 'tailwindcss/tailwindcss-original.svg',
        'tailwind css': 'tailwindcss/tailwindcss-original.svg',
        'three.js': 'threejs/threejs-original.svg',
        'threejs': 'threejs/threejs-original.svg',
        'git': 'git/git-original.svg',
        'github': 'github/github-original.svg',
        'linux': 'linux/linux-original.svg',
        'ubuntu': 'ubuntu/ubuntu-plain.svg'
      };

      if (deviconMap[slug]) {
        return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${deviconMap[slug]}`;
      } else {
        // Best effort fallback
        slug = slug.split(' ')[0];
        return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`;
      }
    }
  }

  const techData = [
    { name: 'Python' },
    { name: 'JavaScript' },
    { name: 'React' },
    { name: 'Node.js' },
    { name: 'Docker' },
    { name: 'TypeScript' },
    { name: 'Rust' },
    { name: 'Go' },
    { name: 'HTML5' },
    { name: 'CSS3' },
    { name: 'PostgreSQL' },
    { name: 'MongoDB' },
    { name: 'Next.js' },
    { name: 'Tailwind CSS' },
    { name: 'Git' },
    { name: 'GitHub' },
    { name: 'Linux' },
    { name: 'Ubuntu' },
    { name: 'AWS' },
    { name: 'Java' },
    { name: 'Kotlin' },
    { name: 'Swift' },
    { name: 'Ruby' },
    { name: 'PHP' },
    { name: 'Flask' },
    { name: 'Django' },
  ];

  const floaters = [];

  // Helper: Create High-Visibility Glassmorphic Card
  function makeCardTexture(name, iconUrl, callback) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const draw = (img = null) => {
      ctx.clearRect(0, 0, 512, 512);

      // 3. Logo/Initials
      if (img) {
        ctx.shadowBlur = 0;
        const size = 220;
        ctx.drawImage(img, 256 - size / 2, 256 - size / 1.6, size, size);
      } else {
        // 💡 OPTIMIZATION: Check for light theme for fallback text visibility
        const isLight = document.body.classList.contains('light-theme');
        ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(146, 96, 220, 220, 20);
        ctx.fill();

        ctx.fillStyle = isLight ? '#1a1b1e' : '#ffffff';
        ctx.font = 'bold 110px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name.slice(0, 2).toUpperCase(), 256, 250);
      }

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

  let FLOATER_COUNT = 25;

  function initFloaters() {
    floaters.forEach(f => scene.remove(f.mesh));
    floaters.length = 0;

    FLOATER_COUNT = parseInt((window.bgSettings && window.bgSettings.floaterCount) || 25);
    if (techData.length === 0) return;
    console.log("FLOATER_COUNT", FLOATER_COUNT);
    for (let i = 0; i < FLOATER_COUNT; i++) {
      console.log("Teach Data :", techData[i % techData.length]);
      const f = createFloater(techData[i % techData.length]);
      scene.add(f.mesh); floaters.push(f);
    }
  }

  initFloaters();

  let particles;
  function initParticles() {
    if (particles) scene.remove(particles);
    const pc = parseInt((window.bgSettings && window.bgSettings.particleCount) || 120);
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pc * 3);
    for (let i = 0; i < pc * 3; i++) pos[i] = (Math.random() - 0.5) * 140;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const colorHex = (window.bgSettings && window.bgSettings.accentColor) ? window.bgSettings.accentColor.replace('#', '0x') : 0x00f5ff;
    particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.14, color: parseInt(colorHex, 16), transparent: true, opacity: 0.25 }));
    scene.add(particles);
  }
  initParticles();

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollY = 0;
  window.addEventListener('mousemove', (e) => { mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2; mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2; });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  const clock = new THREE.Clock();
  window.bgLogoPositions = [];

  function animate() {
    requestAnimationFrame(animate);

    if (window.bgSettings && window.bgSettings.enabled === false) {
      renderer.render(scene, camera);
      return;
    }

    const speed = parseFloat((window.bgSettings && window.bgSettings.speed) || 1);
    const t = clock.getElapsedTime();

    mouse.x += (mouse.targetX - mouse.x) * 0.05; mouse.y += (mouse.targetY - mouse.y) * 0.05;

    const scrollScale = 1.0;
    floaters.forEach((f, i) => {
      if (!f.mesh.material.map) return;

      // Movement with Mouse Drift
      f.mesh.position.x += (f.vx * speed) + (mouse.x * 0.015);
      f.mesh.position.y += (f.vy * speed) + (mouse.y * 0.015);
      f.mesh.position.z += f.vz * speed;

      const B = 48; // Boundary
      // Directional Bounce
      if (f.mesh.position.x > B && (f.vx * speed + mouse.x * 0.015) > 0) f.vx *= -1;
      if (f.mesh.position.x < -B && (f.vx * speed + mouse.x * 0.015) < 0) f.vx *= -1;
      if (f.mesh.position.y > B && (f.vy * speed + mouse.y * 0.015) > 0) f.vy *= -1;
      if (f.mesh.position.y < -B && (f.vy * speed + mouse.y * 0.015) < 0) f.vy *= -1;
      if (Math.abs(f.mesh.position.z) > 35) f.vz *= -1;

      // Position Safety Clamp
      f.mesh.position.x = Math.max(-B, Math.min(B, f.mesh.position.x));
      f.mesh.position.y = Math.max(-B, Math.min(B, f.mesh.position.y));

      // Rotation Restored
      f.mesh.rotation.x += f.rx * speed;
      f.mesh.rotation.y += f.ry * speed;

      const scale = scrollScale + Math.sin(t * 0.5 + i) * 0.12; f.mesh.scale.setScalar(scale);

      if (f.currentOpacity < f.targetOpacity) {
        f.currentOpacity += 0.015;
        f.mesh.material.opacity = f.currentOpacity;
      }

      // Project 3D position → 2D screen coords
      const projected = f.mesh.position.clone().project(camera);
      window.bgLogoPositions[i] = {
        x: (projected.x * 0.5 + 0.5) * window.innerWidth,
        y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
        visible: f.currentOpacity > 0.05,
      };
    });
    window.bgLogoPositions.length = floaters.length;

    if (particles) particles.rotation.y = t * 0.015 * speed;
    renderer.render(scene, camera);
  }

  window.updateBgLabels = (skills) => {
    if (!skills || !skills.length) return;
    
    // Add dynamic skills to list without clearing your 26 manually added ones
    skills.forEach(s => {
      const exists = techData.find(t => t.name.toLowerCase() === s.name.toLowerCase());
      if (!exists) techData.push(s);
    });

    initFloaters();
  };

  animate();
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  window.refreshParticles = initParticles;
  window.rebuildFloaters = initFloaters;
  window.setBgColors = (bgCol) => {
    if (bgCol) {
      renderer.setClearColor(bgCol, 0);
    }
  };
})();
