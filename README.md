# Odoo-Hackathon
- PROBPLEM STATEMENT: ECOSPHERE

# EcoSphere ESG Management Platform - Backend

EcoSphere is a unified ESG (Environmental, Social, and Governance) management platform built with FastAPI. It integrates operational carbon accounting, employee CSR participation, governance compliance, and gamification into a single system.

## 🏗️ Architecture & Team Domains

This backend is designed modularly to allow multiple developers to work independently without merge conflicts. The platform is divided into three core domains:

* **🌱 Environmental Engine (Person 1):** Master data (Departments, Emission Factors) and transactional carbon accounting (Auto Emission Calculations).
* **🤝 Social & Gamification (Person 2):** CSR Activities, Employee Participation, Challenges, XP, Badges, and Rewards.
* **⚖️ Governance (Person 3):** ESG Policies, Acknowledgements, Audits, and Compliance Issue tracking.

---

## 🚀 Getting Started

Follow these steps to set up your local development environment and initialize the database.

### 1. Prerequisites
* Python 3.11 or 3.12 installed on your machine.
* A [Neon Serverless Postgres](https://neon.tech/) database (or any local PostgreSQL instance).

### 2. Environment Setup
Clone the repository and set up your Python virtual environment:

```bash
# Clone the repo (replace with your actual git URL)
git clone https://github.com/your-org/ecosphere-backend.git
cd ecosphere-backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```
*(Note: If you haven't created a `requirements.txt` yet, you can run `pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary pydantic pydantic-settings python-dotenv` instead).*

### 3. Environment Variables
Create a file named `.env` in the root of the project (at the same level as this README). 

Add your database connection string to it:
```env
NEON_DB_CONN_STRING="postgresql://username:password@ep-your-db.region.aws.neon.tech/neondb"
```
*(Warning: Never commit your `.env` file to version control. It is ignored by default if you have a `.gitignore`).*

---

## 🗄️ Database Initialization

We use **Alembic** to manage our database schema and migrations. Our SQLAlchemy 2.0 models are located in `app/models/`.

To create all the necessary tables in your Neon database, run the following command:

```bash
alembic upgrade head
```

### Making Changes to Models
If you add a new table or modify an existing one in the `app/models/` folder, you must generate a new migration script:
1. Generate the script: `alembic revision --autogenerate -m "Describe your changes"`
2. Apply the changes: `alembic upgrade head`

---

## 🏃 Running the Server

Once your database is initialized, start the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

* **API Health Check:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## 📂 Project Structure

```text
backend/
├── app/
│   ├── main.py              # FastAPI app instance
│   ├── config.py            # Settings and Environment Variables
│   ├── database.py          # SQLAlchemy Engine and Session mapping
│   ├── models/              # SQLAlchemy ORM Models (Split by domain)
│   └── modules/             # Your API Routes and Business Logic go here
├── alembic/                 # Database migration scripts
├── alembic.ini              # Alembic configuration
├── .env                     # Local environment variables
└── README.md
```