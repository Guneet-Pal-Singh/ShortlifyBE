# 🔗 ShortlifyBE - URL Shortener Backend

Welcome to the **Shortlify** backend – a fast and lightweight API server built with **Node.js** and **Express** that powers the Shortlify URL shortening service. It stores, retrieves, and redirects shortened URLs with ease.

🌐 **Frontend Repo**: [ShortlifyFE](https://github.com/Guneet-Pal-Singh/ShortlifyFE)  
📥 **Download this Repo**: [Click Here](https://github.com/Guneet-Pal-Singh/ShortlifyBE/archive/refs/heads/main.zip)

🔗 **Website Link**: [Shortlify](https://shortlify-fe.vercel.app/)
---

## 🚀 Features

- 🔐 URL validation and secure shortening
- 📁 MongoDB-based persistence
- 🔁 Automatic redirection to original URLs
- 📊 Click tracking (if implemented)
- 📡 RESTful API design

---

## ⚙️ Tech Stack

- 🟩 Node.js
- ⚡ Express.js
- 🍃 MongoDB with Mongoose
- 🔐 dotenv for env config

---

## 🛠️ Setup Instructions

```bash
# 1️⃣ Clone the repo
git clone https://github.com/Guneet-Pal-Singh/ShortlifyBE.git
cd ShortlifyBE

# 2️⃣ Install dependencies
npm install

# 3️⃣ Create a .env file
# ➕ Add the following:
MONGO_URI=your_mongodb_connection_string
BASE_URL=http://localhost:5000

# 4️⃣ Start the server
npm start
```

---

## 📬 API Endpoints

| Method | Endpoint         | Description               |
|--------|------------------|---------------------------|
| POST   | `/shorten`       | Shorten a long URL        |
| GET    | `/:shortId`      | Redirect to original URL  |

---

## 🧑‍💻 Author

**Guneet Pal Singh**  
🔗 [GitHub](https://github.com/Guneet-Pal-Singh)

---

⭐ Star this repo if you found it useful!
