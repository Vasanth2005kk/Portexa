// Portfolio JS — loads data from API and renders all sections
(async function () {
  // ── Loading Screen ──
  const loader = document.getElementById('loader');
  const loaderText = document.querySelector('.loader-text');
  const steps = ['Connecting to API...', 'Loading portfolio data...', 'Rendering experience...', 'Igniting Three.js...', 'Ready!'];
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) loaderText.textContent = steps[stepIdx++];
    else clearInterval(stepInterval);
  }, 380);

  // ── Fetch data ──
  let data = {};
  try {
    const res = await fetch('/api/portfolio');
    const json = await res.json();
    data = json.data || {};
  } catch (e) {
    console.error('Failed to load portfolio data', e);
  }

  // ── Apply settings ──
  const s = data.settings || {};
  const root = document.documentElement;

  if (!window.bgSettings) window.bgSettings = {};

  if (s.accent_color) {
    root.style.setProperty('--accent', s.accent_color);
    window.bgSettings.accentColor = s.accent_color;
  }
  if (s.secondary_color) {
    root.style.setProperty('--secondary', s.secondary_color);
    window.bgSettings.secondaryColor = s.secondary_color;
  }
  if (s.bg_color) {
    root.style.setProperty('--bg', s.bg_color);
    if (window.setBgColors) window.setBgColors(s.bg_color);
    // Dynamically create variations for bg2 and bg3
    const adjust = (hex, amt) => {
      let col = hex.replace('#', '');
      let r = Math.max(0, Math.min(255, parseInt(col.substring(0, 2), 16) + amt));
      let g = Math.max(0, Math.min(255, parseInt(col.substring(2, 4), 16) + amt));
      let b = Math.max(0, Math.min(255, parseInt(col.substring(4, 6), 16) + amt));
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    };
    root.style.setProperty('--bg2', adjust(s.bg_color, 8));
    root.style.setProperty('--bg3', adjust(s.bg_color, 16));
  }

  window.bgSettings.enabled = s.animation_enabled !== 'false';
  window.bgSettings.speed = parseFloat(s.animation_speed || '1.0');
  window.bgSettings.particleCount = parseInt(s.particle_count || '120');
  window.bgSettings.floaterCount = parseInt(s.floater_count || '25');
  try {
    window.bgSettings.iconMappings = JSON.parse(s.icon_mappings || '{}');
  } catch (e) {
    window.bgSettings.iconMappings = {};
  }

  if (window.refreshParticles) window.refreshParticles();
  if (window.rebuildFloaters) window.rebuildFloaters();

  // Sync 3D background with real skills from DB
  if (window.updateBgLabels && data.skills) {
    window.updateBgLabels(data.skills.map(s => ({ name: s.name, icon: s.icon })));
  }

  if (s.site_title) document.title = s.site_title;

  // ── Contact / Hero ──
  const contact = data.contact || {};
  const summary = data.summary || {};
  const heroName = contact.name || 'Vasanth';
  setText('hero-name', ' '); // Initial empty state for typing
  setText('hero-title', contact.title || 'Full Stack Developer');
  setText('hero-tagline', summary.tagline || '');
  setText('about-bio', summary.content || '');
  setText('footer-name', contact.name || 'Vasanth');
  if (contact.avatar_url) {
    const frame = document.getElementById('hero-avatar');
    frame.innerHTML = `<img src="${contact.avatar_url}" alt="${contact.name}">`;
  } else {
    const initials = (contact.name || 'AC').split(' ').map(w => w[0]).join('').slice(0, 2);
    document.querySelector('.avatar-placeholder').textContent = initials;
  }

  // Hero socials
  const socials = document.getElementById('hero-socials');
  if (socials) socials.innerHTML = '';

  const socialIcons = {
    GitHub: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
    LinkedIn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
    Email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    Website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    Twitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`
  };

  const socialLinks = [
    { url: contact.github, label: 'GitHub' },
    { url: contact.linkedin, label: 'LinkedIn' },
    { url: contact.email ? `mailto:${contact.email}` : null, label: 'Email' },
    { url: contact.website, label: 'Website' },
    { url: contact.twitter, label: 'Twitter' },
  ];

  socialLinks.forEach(({ url, label }) => {
    if (!url || !socialIcons[label]) return;
    const a = document.createElement('a');
    a.className = 'social-link';
    a.href = url;
    a.target = '_blank';
    a.title = label;
    a.innerHTML = socialIcons[label];
    socials.appendChild(a);
  });

  // Stats
  const projects = data.projects || [];
  const skills = data.skills || [];
  animateCount('stat-projects', projects.length);
  animateCount('stat-skills', skills.length);

  // ── Skills ──
  const skillsContainer = document.getElementById('skills-container');
  const categories = {};
  skills.forEach(skill => {
    if (!categories[skill.category]) categories[skill.category] = [];
    categories[skill.category].push(skill);
  });
  Object.entries(categories).forEach(([cat, items]) => {
    const catDiv = document.createElement('div');
    catDiv.className = 'skill-category reveal';
    catDiv.innerHTML = `<div class="skill-cat-title">${cat}</div><div class="skills-row">${items.map(skill => `
        <div class="skill-pill" data-proficiency="${skill.proficiency}">
          <span>${skill.name}</span>
          <div class="skill-bar-wrap"><div class="skill-bar" style="width:0%"></div></div>
        </div>
      `).join('')
      }</div>`;
    skillsContainer.appendChild(catDiv);
  });

  // ── Experience ──
  const expContainer = document.getElementById('experience-container');
  (data.experience || []).forEach(exp => {
    const period = exp.current
      ? `${exp.start_date} — Present`
      : `${exp.start_date} — ${exp.end_date}`;
    const item = document.createElement('div');
    item.className = 'timeline-item reveal';
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-top">
          <div class="timeline-role">${exp.role}${exp.current ? '<span class="timeline-current">CURRENT</span>' : ''}</div>
          <div class="timeline-period">${period}</div>
        </div>
        <div class="timeline-company">${exp.company}</div>
        <p class="timeline-desc">${exp.description || ''}</p>
        <div class="tech-tags">${(exp.technologies || '').split(',').filter(Boolean).map(t =>
      `<span class="tech-tag">${t.trim()}</span>`).join('')}
        </div>
      </div>`;
    expContainer.appendChild(item);
  });

  // ── Projects ──
  const projContainer = document.getElementById('projects-container');
  const projectEmojis = ['🚀', '🤖', '⚡', '🌊', '🔮', '🛸', '💡', '🎯'];
  projects.forEach((proj, i) => {
    const card = document.createElement('div');
    card.className = 'project-card reveal';
    const imgContent = proj.image_url
      ? `<img src="${proj.image_url}" alt="${proj.title}">`
      : projectEmojis[i % projectEmojis.length];
    card.innerHTML = `
      <div class="project-img">${imgContent}</div>
      <div class="project-body">
        <div class="project-title">
          ${proj.featured ? '<span class="project-featured">★ Featured</span>' : ''}
          ${proj.title}
        </div>
        <p class="project-desc">${proj.description || ''}</p>
        <div class="tech-tags" style="margin-bottom:1rem">${(proj.tech_stack || '').split(',').filter(Boolean).map(t =>
      `<span class="tech-tag">${t.trim()}</span>`).join('')}
        </div>
        <div class="project-links">
          ${proj.github_url ? `<a href="${proj.github_url}" target="_blank" class="project-link">⬡ GitHub</a>` : ''}
          ${proj.live_url ? `<a href="${proj.live_url}" target="_blank" class="project-link">↗ Live Demo</a>` : ''}
        </div>
      </div>`;
    projContainer.appendChild(card);
  });

  // ── Education ──
  const eduContainer = document.getElementById('education-container');
  (data.education || []).forEach(edu => {
    const card = document.createElement('div');
    card.className = 'edu-card reveal';
    card.innerHTML = `
      <div class="edu-institution">${edu.institution}</div>
      <div class="edu-degree">${edu.degree}</div>
      <div class="edu-field">${edu.field}</div>
      <div class="edu-period">${edu.start_year} — ${edu.end_year || 'Present'}</div>
      ${edu.gpa ? `<div class="edu-gpa">GPA: ${edu.gpa}</div>` : ''}
      ${edu.description ? `<p class="edu-desc">${edu.description}</p>` : ''}`;
    eduContainer.appendChild(card);
  });

  // ── Certifications ──
  const certContainer = document.getElementById('cert-container');
  (data.certifications || []).forEach(cert => {
    const item = document.createElement('div');
    item.className = 'cert-card reveal';
    item.innerHTML = `
      <div class="cert-icon">🏅</div>
      <div>
        <div class="cert-name">${cert.name}</div>
        <div class="cert-issuer">${cert.issuer}</div>
        <div class="cert-date">${cert.date_issued}${cert.expiry_date ? ` → ${cert.expiry_date}` : ''}</div>
        ${cert.credential_url ? `<a href="${cert.credential_url}" target="_blank" style="font-size:0.75rem;color:var(--accent)">View Credential ↗</a>` : ''}
      </div>`;
    certContainer.appendChild(item);
  });

  // ── Achievements ──
  const achContainer = document.getElementById('ach-container');
  const achIcons = { trophy: '🏆', star: '⭐', paper: '📄', mic: '🎤', default: '🎯' };
  (data.achievements || []).forEach(ach => {
    const item = document.createElement('div');
    item.className = 'ach-item reveal';
    item.innerHTML = `
      <div class="ach-icon">${achIcons[ach.icon] || achIcons.default}</div>
      <div>
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.description || ''}</div>
        <div class="ach-date">${ach.date || ''}</div>
      </div>`;
    achContainer.appendChild(item);
  });

  // ── Contact Info ──
  const contactInfo = document.getElementById('contact-info');
  const contactFields = [
    { icon: '✉', value: contact.email, href: `mailto:${contact.email}` },
    { icon: '📞', value: contact.phone, href: `tel:${contact.phone}` },
    { icon: '📍', value: contact.location },
    { icon: '⬡', value: 'GitHub', href: contact.github },
    { icon: 'in', value: 'LinkedIn', href: contact.linkedin },
    { icon: '🌐', value: 'Website', href: contact.website },
  ];
  contactFields.forEach(({ icon, value, href }) => {
    if (!value) return;
    const item = document.createElement('div');
    item.className = 'contact-item reveal';
    item.innerHTML = `
      <div class="contact-item-icon">${icon}</div>
      <div>${href ? `<a href="${href}" target="_blank">${value}</a>` : value}</div>`;
    contactInfo.appendChild(item);
  });

  // ── Navbar ──
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // ── Scroll Reveal ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Animate skill bars
        entry.target.querySelectorAll('.skill-bar').forEach(bar => {
          const pill = bar.closest('.skill-pill');
          const pct = pill ? (pill.dataset.proficiency || 80) : 80;
          setTimeout(() => { bar.style.width = pct + '%'; }, 300);
        });
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinkEls.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${entry.target.id}` ? 'var(--accent)' : '';
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => navObserver.observe(s));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      navLinks.classList.remove('open');
    });
  });

  // ── Hide Loader ──
  setTimeout(() => {
    loader.classList.add('hidden');
    // Trigger hero reveals
    document.querySelectorAll('#hero .reveal-up').forEach(el => {
      setTimeout(() => {
        el.classList.add('revealed');
        if (el.id === 'hero-name') {
          typeText('hero-name', heroName);
        }
      }, 100);
    });
  }, 2000);

  // ── Contact Form ──
  window.handleContact = function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'Sent! ✓';
    btn.style.background = 'linear-gradient(135deg, #0f9, #0c6)';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      e.target.reset();
    }, 3000);
  };

  // Helpers
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Trigger the typer after the hero name completes
  setTimeout(() => {
    startLogoTyper(); // Start the Logo Typer
  }, 1000);

  // ── LOGO BRAND TYPER LOGIC ──
  async function startLogoTyper() {
    const textEl = document.getElementById('nav-logo-text');
    const leftEl = document.getElementById('nav-accent-left');
    const rightEl = document.getElementById('nav-accent-right');
    if (!textEl) return;

    // Grab the actual name from the element (Set by Flask or DB)
    const brandName = textEl.textContent.trim() || "User";

    const logoThemes = [

      { name: brandName.toLowerCase(), left: "(", right: ")", color: "#f7df1e" }, // JS
      { name: brandName.toLowerCase(), left: "def ", right: ":", color: "#3776ab" }, // Python
      { name: brandName.toLowerCase(), left: "{ ", right: " }", color: "#264de4" }, // CSS
      { name: brandName.toLowerCase(), left: "$ ", right: "", color: "#4caf50" }, // Bash
      { name: brandName.toLowerCase(), left: "console.log('", right: "')", color: "#f0db4f" }, // JS log
      { name: brandName.toLowerCase(), left: "print('", right: "')", color: "#306998" }, // Python print
      { name: brandName.toLowerCase(), left: "func ", right: "()", color: "#00add8" }, // Go
      { name: brandName.toLowerCase(), left: "public class ", right: " {}", color: "#b07219" }, // Java
      { name: brandName.toLowerCase(), left: "#include <", right: ">", color: "#00599c" }, // C++
      { name: brandName.toLowerCase(), left: "SELECT * FROM ", right: ";", color: "#f29111" }, // SQL
      { name: brandName.toLowerCase(), left: "echo '", right: "'", color: "#8993be" }, // PHP
      { name: brandName.toLowerCase(), left: "lambda ", right: ":", color: "#ff9900" }, // Lambda
      { name: brandName.toLowerCase(), left: "[ ", right: " ]", color: "#ff6f61" }, // Array style
      { name: brandName.toLowerCase(), left: "<>", right: "</>", color: "#8ed6fb" }, // JSX Fragment
      { name: brandName.toLowerCase(), left: "::", right: "::", color: "#a8b9cc" }, // Namespace
      { name: brandName.toLowerCase(), left: "@", right: "", color: "#ff4081" }, // Decorator style
      { name: brandName.toLowerCase(), left: "// ", right: "", color: "#9e9e9e" }, // Comment style
      { name: brandName.toLowerCase(), left: "/* ", right: " */", color: "#607d8b" }, // Block comment
      { name: brandName.toLowerCase(), left: "<script>", right: "</script>", color: "#e34c26" }, // Script tag
      { name: brandName.toLowerCase(), left: "<style>", right: "</style>", color: "#563d7c" }, // Style tag 
      { name: brandName.toLowerCase(), left: ">>> ", right: "", color: "#ffd43b" }, // Python REPL
      { name: brandName.toLowerCase(), left: "git commit -m '", right: "'", color: "#f1502f" } // Git
    ];

    let index = 0;
    while (true) {
      const theme = logoThemes[index];

      // Update brackets/color
      leftEl.textContent = theme.left;
      rightEl.textContent = theme.right;
      textEl.style.color = theme.color;
      leftEl.style.color = theme.color;
      rightEl.style.color = theme.color;

      // Type name
      textEl.textContent = '';
      for (let char of theme.name) {
        textEl.textContent += char;
        await new Promise(r => setTimeout(r, 80));
      }

      await new Promise(r => setTimeout(r, 3000)); // Stay on this language

      // Delete name
      for (let i = theme.name.length; i >= 0; i--) {
        textEl.textContent = theme.name.substring(0, i);
        await new Promise(r => setTimeout(r, 40));
      }

      index = (index + 1) % logoThemes.length;
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // ── THEME TOGGLE LOGIC ──
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme');

  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
    if (window.setBgColors) window.setBgColors('#f5f7ff');
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    // 🎨 Sync the 3D Background colors on toggle
    if (window.setBgColors) {
      window.setBgColors(isLight ? '#f5f7ff' : (s.bg_color || '#050510'));
    }

    if (window.refreshParticles) window.refreshParticles();
  });

  async function typeText(id, text, speed = 150) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    for (let char of text) {
      el.textContent += char;
      await new Promise(r => setTimeout(r, speed));
    }
  }

  function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let count = 0;
    const step = Math.ceil(target / 30);
    const interval = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count + '+';
      if (count >= target) clearInterval(interval);
    }, 40);
  }

})();
