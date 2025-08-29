# Greyloops ERP (Next.js + MySQL)

This project is a simple **ERP dashboard** built with **Next.js 15**, **React 19**, and **MySQL**.  
It includes **authentication**, **roles**, and a **users management table**.

---

## 🚀 Getting Started

### 1. Clone the Repo & Install Dependencies

```bash
git clone https://github.com/your-username/greyloops-erp.git
cd greyloops-erp
npm install
```

---

### 2. Setup MySQL Database

Login to MySQL and create the database and tables:

```sql
CREATE DATABASE greyloops_erp;

CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fullName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `tenant_id` INT DEFAULT 1,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3. Install Additional Dependencies

Install runtime packages required by the project (including MySQL client library and password hashing library):

```bash
npm install mysql2
npm install bcryptjs
```

> Alternatively, install both in one command:

```bash
npm install mysql2 bcryptjs
```

---

### 4. Configure Database Connection

Create or update `src/lib/db.js` with your DB credentials:

```js
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_db_password",
  database: process.env.DB_NAME || "greyloops_erp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

> It's recommended to use an environment file (`.env.local`) to store sensitive credentials.

---

### 5. Seed Initial Data

The seeding script (`src/scripts/seed.js`) creates roles and a few default users (superadmin, admins, manager, hr). Run the seeder with:

```bash
npm run seed
```

This executes:

```bash
node --experimental-specifier-resolution=node src/scripts/seed.js
```

If you created `package.json` script:

```json
"scripts": {
  "seed": "node --experimental-specifier-resolution=node src/scripts/seed.js"
}
```

---

## 📜 Available Scripts

In the project root, you can run:

```bash
npm run dev       # Starts Next.js in development mode
npm run build     # Builds the app for production
npm run start     # Runs the built app in production mode
npm run lint      # Runs ESLint
npm run seed      # Seeds the database with initial data
```

---

## 📂 Project Structure

```
greyloops-erp/
├── src/
│   ├── app/              # Next.js routes (pages, API endpoints, etc.)
│   ├── lib/              # Database connection helpers (db.js)
│   └── scripts/
│       └── seed.js       # Database seeder
├── package.json
├── README.md
└── .env.local
```

---

## 📡 API Example

To fetch users with their roles (JOIN query):

```sql
SELECT
  u.id,
  u.fullName,
  u.email,
  u.created_at,
  r.name AS role
FROM users u
JOIN roles r ON u.role_id = r.id;
```

Inside `src/app/api/users/route.js`:

```js
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.fullName,
        u.email,
        u.created_at,
        r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);

    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
```

---

## 👤 Default Users

- **Super Admin**  
  Email: `superadmin@example.com`  
  Password: `password123`

- **Admin One**  
  Email: `admin1@example.com`  
  Password: `password123`

- **Admin Two**  
  Email: `admin2@example.com`  
  Password: `password123`

- **Manager User**  
  Email: `manager@example.com`  
  Password: `password123`

- **HR User**  
  Email: `hr@example.com`  
  Password: `password123`

---

## ✅ Notes

- Ensure **MySQL service** is running before seeding.
- Use `.env.local` to store DB credentials and do **not** commit it to version control.
- If you prefer native `bcrypt`, install `bcrypt` instead of `bcryptjs` — but `bcryptjs` avoids native build issues.

---

## 📌 Author

Created by **Greyloops Team** 🚀

