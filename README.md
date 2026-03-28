# 💠 Portexa — Next-Level 3D Animated Portfolio

A visually stunning, fully dynamic portfolio website built with **Flask + Three.js + SQLite**.
Features an interactive 3D background, scroll animations, and a complete admin dashboard.

### 🔹 Portexa – Meaning Explained
**Portexa** is a modern, brand-style name formed from meaningful parts:
- **“Port”** → **Portfolio**: Represents your projects, work, and skills showcase.
- **“exa”** → From **“extra”** / **“excellent”** / **“next-level”**: Signifies pushing the boundaries of traditional web design.

###visit live demo : https://portexa-vasanth2005kk.onrender.com/

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (sqlite3 is built-in)
- Flask only — no extra dependencies needed beyond what's in requirements.txt

### 1. Clone / Download the project
```bash
cd portfolio
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the app
```bash
python run.py
```

The app starts on **http://localhost:5000**

> The SQLite database is **auto-created** with sample data on first launch. No setup needed.

---

## 🔐 Admin Dashboard

Visit **http://localhost:5000/admin**

| Credential | Value     |
|------------|-----------|
| Username   | `admin`   |
| Password   | `admin123` |

> ⚠️ Change the password immediately in **Settings → Change Password**

### Admin Features
| Section | What you can do |
|---------|----------------|
| Contact Info | Edit name, title, email, phone, social links, upload avatar |
| Summary | Edit bio text and tagline |
| Skills | Add/edit/delete skills with category, proficiency % |
| Experience | Full work history with timeline |
| Projects | Portfolio projects with images, GitHub/live links |
| Education | Academic background |
| Certifications | Professional certifications |
| Achievements | Awards and highlights |
| Settings | Change theme colors, animation speed, toggle animations, change password |

---

## 🔌 REST API Endpoints

All data is accessible via REST API:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/portfolio` | All portfolio data in one request |
| `GET` | `/api/settings` | Site settings |
| `GET` | `/api/skills` | Skills list |
| `POST` | `/api/skills` | Add a skill |
| `PUT` | `/api/skills/<id>` | Update a skill |
| `DELETE` | `/api/skills/<id>` | Delete a skill |
| `GET/POST/PUT/DELETE` | `/api/projects` | Projects CRUD |
| `GET/POST/PUT/DELETE` | `/api/experience` | Experience CRUD |
| `GET/POST/PUT/DELETE` | `/api/education` | Education CRUD |
| `GET/POST/PUT/DELETE` | `/api/certifications` | Certifications CRUD |
| `GET/POST/PUT/DELETE` | `/api/achievements` | Achievements CRUD |

### Example API usage
```bash
# Get all portfolio data
curl http://localhost:5000/api/portfolio

# Add a new skill
curl -X POST http://localhost:5000/api/skills \
  -H "Content-Type: application/json" \
  -d '{"name":"Rust","category":"Backend","proficiency":70,"icon":"rust","order_index":20}'

# Update a skill
curl -X PUT http://localhost:5000/api/skills/1 \
  -H "Content-Type: application/json" \
  -d '{"proficiency":95}'

# Delete a skill
curl -X DELETE http://localhost:5000/api/skills/1
```

---

## 🎨 Customization

### Theme Colors
In Admin → Settings, you can change:
- **Accent Color** — default `#00f5ff` (cyan glow)
- **Secondary Color** — default `#bf00ff` (purple glow)
- **Background Color** — default `#050510` (deep dark)

Or edit CSS variables directly in `app/static/css/portfolio.css`:
```css
:root {
  --accent: #00f5ff;
  --secondary: #bf00ff;
  --bg: #050510;
}
```

### Three.js Background
Control from Admin → Settings:
- **Animation Speed** — slider from 0.1x to 3.0x
- **Enable/Disable** — toggle the entire 3D background
- **Particle Count** — adjust density

---

## 🗄 Database Schema

SQLite tables auto-created in `instance/portfolio.db`:

```sql
admin             -- Login credentials
site_settings     -- Theme & animation config (key/value)
contact_info      -- Name, email, phone, social links
summary           -- Bio text and tagline
skills            -- Tech skills with proficiency %
education         -- Academic history
projects          -- Portfolio projects
experience        -- Work history
certifications    -- Professional certs
achievements      -- Awards and highlights
```

---

### Developed with ❤️ by **Vasanth**
