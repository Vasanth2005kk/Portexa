import sqlite3
import hashlib
import os

def get_db(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def init_db(db_path):
    conn = get_db(db_path)
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT
    );
    CREATE TABLE IF NOT EXISTS contact_info (
        id INTEGER PRIMARY KEY,
        name TEXT, title TEXT, email TEXT, phone TEXT,
        location TEXT, linkedin TEXT, github TEXT, website TEXT, avatar_url TEXT
    );
    CREATE TABLE IF NOT EXISTS summary (
        id INTEGER PRIMARY KEY,
        content TEXT,
        tagline TEXT
    );
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL, category TEXT, proficiency INTEGER DEFAULT 80,
        icon TEXT, order_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY,
        institution TEXT NOT NULL, degree TEXT, field TEXT,
        start_year TEXT, end_year TEXT, gpa TEXT, description TEXT,
        order_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL, description TEXT, tech_stack TEXT,
        github_url TEXT, live_url TEXT, image_url TEXT,
        featured INTEGER DEFAULT 0, order_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS experience (
        id INTEGER PRIMARY KEY,
        company TEXT NOT NULL, role TEXT, start_date TEXT, end_date TEXT,
        current INTEGER DEFAULT 0, description TEXT, technologies TEXT,
        order_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS certifications (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL, issuer TEXT, date_issued TEXT, expiry_date TEXT,
        credential_url TEXT, image_url TEXT, order_index INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL, description TEXT, date TEXT,
        icon TEXT DEFAULT 'trophy', order_index INTEGER DEFAULT 0
    );
    """)
    conn.commit()

    # Seed only if empty
    if c.execute("SELECT COUNT(*) FROM admin").fetchone()[0] == 0:
        _seed(conn, c)

    conn.close()

def _seed(conn, c):
    c.execute("INSERT INTO admin (username, password_hash) VALUES (?, ?)",
              ('admin', hash_password('admin123')))

    settings = [
        ('accent_color', '#00f5ff'), ('secondary_color', '#bf00ff'),
        ('bg_color', '#050510'), ('animation_speed', '1.0'),
        ('animation_enabled', 'true'), ('particle_count', '80'),
        ('site_title', 'Vasanthavel — Full Stack Developer'),
    ]
    c.executemany("INSERT INTO site_settings (key, value) VALUES (?, ?)", settings)

    c.execute("""INSERT INTO contact_info (name,title,email,phone,location,linkedin,github,website,avatar_url)
                 VALUES (?,?,?,?,?,?,?,?,?)""",
              ('Vasanthavel', 'Full Stack Developer',
               'vasanthavel.k75@gmail.com', '+91 8220921078', 'India',
               'https://www.linkedin.com/in/vasanth-k-b88336311/', 'https://github.com/Vasanth2005kk',
               'https://vasanth.dev', ''))

    c.execute("INSERT INTO summary (content, tagline) VALUES (?, ?)", (
        "I'm a passionate full-stack developer with 5+ years of experience building scalable web applications and AI-powered solutions. I specialize in Python ecosystems (Flask, Django, FastAPI), modern JavaScript frameworks, and cloud infrastructure. I love crafting elegant solutions to complex problems and am deeply interested in the intersection of AI and web development.",
        "Building the future, one commit at a time."
    ))

    skills = [
        ('Python','Backend',95,'python',0), ('Flask','Backend',90,'flask',1),
        ('Django','Backend',85,'django',2), ('FastAPI','Backend',80,'fastapi',3),
        ('JavaScript','Frontend',92,'javascript',4), ('React','Frontend',88,'react',5),
        ('Vue.js','Frontend',82,'vue',6), ('TypeScript','Frontend',85,'typescript',7),
        ('HTML5','Frontend',95,'html',8), ('CSS3','Frontend',90,'css',9),
        ('PostgreSQL','Database',85,'postgresql',10), ('MySQL','Database',80,'mysql',11),
        ('SQLite','Database',88,'sqlite',12), ('MongoDB','Database',75,'mongodb',13),
        ('Docker','DevOps',82,'docker',14), ('Git','DevOps',92,'git',15),
        ('AWS','DevOps',78,'aws',16), ('Three.js','Frontend',75,'threejs',17),
    ]
    c.executemany("INSERT INTO skills (name,category,proficiency,icon,order_index) VALUES (?,?,?,?,?)", skills)

    c.executemany("INSERT INTO education (institution,degree,field,start_year,end_year,gpa,description,order_index) VALUES (?,?,?,?,?,?,?,?)", [
        ('University of California, Berkeley', "Bachelor's of Science", 'Computer Science', '2016', '2020', '3.8/4.0',
         "Focus on AI/ML, distributed systems, and web technologies. Dean's List all semesters.", 0),
        ('Stanford Online', 'Professional Certificate', 'Machine Learning', '2021', '2021', '',
         "Completed Andrew Ng's Machine Learning Specialization.", 1),
    ])

    c.executemany("INSERT INTO projects (title,description,tech_stack,github_url,live_url,image_url,featured,order_index) VALUES (?,?,?,?,?,?,?,?)", [
        ('NeuralChat AI',
         'A real-time AI chat application powered by GPT-4 with custom fine-tuning, supporting multi-modal inputs, conversation memory, and team collaboration features.',
         'Python, FastAPI, React, WebSockets, OpenAI API, PostgreSQL, Redis',
         'https://github.com/alexchen/neuralchat', 'https://neuralchat.demo', '', 1, 0),
        ('DevMetrics Dashboard',
         'Open-source developer productivity analytics platform with GitHub integration, PR metrics, code quality scores, and team performance insights.',
         'Django, React, D3.js, PostgreSQL, Docker, GitHub API',
         'https://github.com/alexchen/devmetrics', 'https://devmetrics.io', '', 1, 1),
        ('CloudDeploy CLI',
         'A powerful CLI tool that automates deployment pipelines across AWS, GCP, and Azure with zero-config setup and rollback support.',
         'Python, Click, Terraform, AWS SDK, GCP SDK',
         'https://github.com/alexchen/clouddeploy', '', '', 1, 2),
        ('PixelArt Generator',
         'Browser-based pixel art creation tool with AI-powered style transfer, animation timeline, and export to multiple formats.',
         'Vanilla JS, Canvas API, TensorFlow.js, WebGL',
         'https://github.com/alexchen/pixelart', 'https://pixelart.demo', '', 0, 3),
    ])

    c.executemany("INSERT INTO experience (company,role,start_date,end_date,current,description,technologies,order_index) VALUES (?,?,?,?,?,?,?,?)", [
        ('Anthropic', 'Senior Software Engineer', 'Jan 2023', '', 1,
         'Lead backend engineer on Claude web interface. Designed and implemented real-time streaming API, built developer tools, and optimized inference pipeline reducing latency by 40%.',
         'Python, FastAPI, React, PostgreSQL, Redis, Docker', 0),
        ('Stripe', 'Software Engineer II', 'Jun 2020', 'Dec 2022', 0,
         'Built payment processing microservices handling $10B+ in annual transactions. Developed fraud detection system using ML models with 99.7% accuracy.',
         'Python, Go, React, PostgreSQL, Kafka, Kubernetes', 1),
        ('Y Combinator (W20 Startup)', 'Full Stack Developer Intern', 'Jan 2020', 'May 2020', 0,
         "Sole developer of MVP product. Built from scratch using Flask + React, acquired first 500 users before Demo Day.",
         'Flask, React, SQLite, Heroku', 2),
    ])

    c.executemany("INSERT INTO certifications (name,issuer,date_issued,expiry_date,credential_url,image_url,order_index) VALUES (?,?,?,?,?,?,?)", [
        ('AWS Solutions Architect Professional', 'Amazon Web Services', 'Mar 2023', 'Mar 2026', 'https://aws.amazon.com/certification', '', 0),
        ('Google Cloud Professional Developer', 'Google Cloud', 'Nov 2022', 'Nov 2024', 'https://cloud.google.com/certification', '', 1),
        ('Kubernetes Application Developer (CKAD)', 'CNCF', 'Jul 2022', 'Jul 2024', 'https://www.cncf.io/certification/ckad/', '', 2),
    ])

    c.executemany("INSERT INTO achievements (title,description,date,icon,order_index) VALUES (?,?,?,?,?)", [
        ('Hackathon Winner — SF Tech Week 2023', 'Won 1st place among 200+ teams building an AI-powered accessibility tool.', '2023', 'trophy', 0),
        ('Open Source: 2.4k GitHub Stars', 'DevMetrics Dashboard reached 2,400+ stars and 180+ contributors on GitHub.', '2023', 'star', 1),
        ('Published Research Paper', 'Co-authored paper on efficient transformer fine-tuning accepted at NeurIPS workshop.', '2022', 'paper', 2),
        ('Speaker — PyCon US 2022', 'Presented "Scaling Flask Applications to 10M Users" to 800+ attendees.', '2022', 'mic', 3),
    ])

    conn.commit()
