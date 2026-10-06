# Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System built with **React, FastAPI, SQLAlchemy, and PostgreSQL**.

The application provides product inventory management, customer management, order processing, stock validation, revenue tracking, responsive UI, dark mode, and a RESTful backend API.

The application is deployed with **Vercel, AWS EC2, Nginx, HTTPS, and PostgreSQL**.

---

## Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://frontend-phi-orcin-94.vercel.app |
| **Backend API** | https://13-127-16-102.sslip.io |
| **Swagger API Docs** | https://13-127-16-102.sslip.io/docs |
| **ReDoc API Docs** | https://13-127-16-102.sslip.io/redoc |
| **GitHub Repository** | https://github.com/yash-yadav1804/Inventory-System |

---

## Features

### Products
- Create, edit, and delete products
- Product name, SKU, price, and quantity management
- Inventory summary cards
- In-stock, low-stock, and out-of-stock indicators
- Search by product name or SKU
- Pagination
- Duplicate SKU protection

### Customers
- Create, edit, and delete customers
- Customer name, email, phone, and address
- Search by name or email
- Avatar initials
- Pagination
- Duplicate email validation
- Responsive customer forms

### Orders
- Create orders with multiple products
- Select customers
- Real-time stock validation
- Automatic stock deduction
- Pending, Confirmed, and Cancelled states
- Cancel pending orders
- Restore stock when a pending order is cancelled
- Prevent cancellation of confirmed orders
- Search, filtering, pagination, and order details
- Sales report export

### Dashboard
- Total products
- Total customers
- Total orders
- Confirmed revenue
- Low-stock alerts
- Recent orders
- Animated statistics
- Responsive dashboard

### UI / UX
- Modern responsive interface
- Dark mode
- Persistent theme preference
- Multiple accent color themes
- Loading states
- Toast notifications
- Confirmation dialogs
- Form validation
- Mobile-friendly layouts
- Smooth UI animations

---

## Business Rules

| Rule | Behaviour |
|------|-----------|
| Stock validation | Order is rejected if requested quantity exceeds available stock |
| Stock deduction | Product quantity decreases when an order is created |
| Order cancellation | Cancelling a pending order restores product quantities |
| Confirmed order lock | Confirmed orders cannot be cancelled |
| Revenue calculation | Dashboard revenue is calculated from confirmed orders |
| SKU uniqueness | Duplicate SKU is rejected |
| Email uniqueness | Duplicate customer email is rejected |
| Resource validation | Invalid resources return appropriate API errors |

---

## Technology Stack

### Frontend
- React 18
- React Router
- Axios
- Tailwind CSS
- Lucide React
- Headless UI
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Async SQLAlchemy
- asyncpg
- Pydantic
- Uvicorn

### Database
- PostgreSQL
- asyncpg

### Infrastructure
- AWS EC2
- Ubuntu
- Nginx
- systemd
- Let's Encrypt / Certbot
- HTTPS
- Vercel

### Development Tools
- Git
- GitHub
- VS Code
- npm
- Python virtual environment

---

## System Architecture

```text
                         Internet
                            │
                            │ HTTPS
                            ▼
                  ┌─────────────────────┐
                  │       Vercel        │
                  │   React Frontend    │
                  └──────────┬──────────┘
                             │
                             │ HTTPS API Requests
                             ▼
                  ┌─────────────────────┐
                  │      AWS EC2        │
                  │                     │
                  │       Nginx         │
                  │         │           │
                  │         ▼           │
                  │      FastAPI        │
                  │         │           │
                  │         ▼           │
                  │     PostgreSQL      │
                  │                     │
                  └─────────────────────┘
```

### Request Flow

```text
React Frontend
      │
      │ HTTPS
      ▼
Nginx :443
      │
      │ Reverse Proxy
      ▼
FastAPI :8000
      │
      │ Async SQLAlchemy
      ▼
PostgreSQL :5432
```

FastAPI and PostgreSQL are bound to localhost on the EC2 server.

- Port `8000` is not publicly exposed
- Port `5432` is not publicly exposed
- Public application traffic enters through Nginx
- HTTPS traffic uses port `443`

---

## API Reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | API health check |

### Products

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/products` | Create a product |
| `GET` | `/products` | List products |
| `GET` | `/products/{id}` | Get a product |
| `PUT` | `/products/{id}` | Update a product |
| `DELETE` | `/products/{id}` | Delete a product |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/customers` | Create a customer |
| `GET` | `/customers` | List customers |
| `GET` | `/customers/{id}` | Get a customer |
| `PUT` | `/customers/{id}` | Update a customer |
| `DELETE` | `/customers/{id}` | Delete a customer |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orders` | Create an order |
| `GET` | `/orders` | List orders |
| `GET` | `/orders/{id}` | Get order details |
| `PATCH` | `/orders/{id}/confirm` | Confirm a pending order |
| `DELETE` | `/orders/{id}` | Cancel a pending order |

---

## API Documentation

### Swagger UI

https://13-127-16-102.sslip.io/docs

### ReDoc

https://13-127-16-102.sslip.io/redoc

---

## Project Structure

```text
inventory-system/
│
├── backend/
│   ├── migrations/
│   │   └── init.sql
│   ├── routers/
│   │   ├── products.py
│   │   ├── customers.py
│   │   └── orders.py
│   ├── .dockerignore
│   ├── database.py
│   ├── Dockerfile
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   └── schemas.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   └── errors.js
│   │   ├── components/
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/
│   │   │   ├── CreateOrder.jsx
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   └── Products.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
│
├── _orchestrator/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js
- npm
- PostgreSQL
- Git

### Backend

```bash
cd backend
```

#### Windows

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### Linux / macOS

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Backend Environment

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql+asyncpg://inventory_user:YOUR_PASSWORD@127.0.0.1:5432/inventorydb
CORS_ORIGINS=http://localhost:3000
```

> Never commit `.env` files to GitHub.

### Database

Create the database:

```sql
CREATE DATABASE inventorydb;
```

Initialize schema and seed data:

```bash
psql -U postgres -d inventorydb -f backend/migrations/init.sql
```

### Start Backend

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Local environment:

```env
REACT_APP_API_URL=http://localhost:8000
```

Frontend:

```text
http://localhost:3000
```

---

## Production Deployment

```text
Frontend
    ↓
Vercel

Backend
    ↓
AWS EC2
    ↓
Nginx
    ↓
FastAPI

Database
    ↓
PostgreSQL on the same EC2 instance
```

### Frontend — Vercel

Root directory:

```text
frontend
```

Production API variable:

```env
REACT_APP_API_URL=https://13-127-16-102.sslip.io
```

Production frontend:

https://frontend-phi-orcin-94.vercel.app

### Backend — AWS EC2

```text
AWS EC2
├── Ubuntu
├── FastAPI
├── Uvicorn
├── Nginx
├── PostgreSQL
└── systemd
```

FastAPI runs internally on:

```text
127.0.0.1:8000
```

Nginx receives public traffic and forwards requests to FastAPI.

### HTTPS / SSL

HTTPS is enabled using Let's Encrypt and Certbot.

Production API:

```text
https://13-127-16-102.sslip.io
```

### Nginx Reverse Proxy

```text
Internet
   ↓ HTTPS :443
Nginx
   ↓
127.0.0.1:8000
   ↓
FastAPI
```

---

## AWS Security

| Port | Service | Access |
|------|---------|--------|
| `80` | HTTP | Public |
| `443` | HTTPS | Public |
| `22` | SSH | Restricted to trusted IP |
| `8000` | FastAPI | Not publicly exposed |
| `5432` | PostgreSQL | Not publicly exposed |

FastAPI and PostgreSQL listen only on:

```text
127.0.0.1:8000
127.0.0.1:5432
```

SSH access is restricted through the AWS Security Group.

---

## Service Management

The FastAPI backend runs as:

```text
inventory-backend.service
```

The following services are configured to start automatically:

```text
PostgreSQL
Nginx
Inventory Backend
```

The deployment has been tested after an EC2 reboot to verify service recovery.

---

## Production Verification

The deployed application has been verified with:

- [x] Frontend loading successfully
- [x] Backend health endpoint
- [x] Product API and PostgreSQL connectivity
- [x] Customer CRUD operations
- [x] Product CRUD operations
- [x] Order creation
- [x] Stock deduction
- [x] Order cancellation
- [x] Stock restoration
- [x] Order confirmation
- [x] Dashboard statistics
- [x] HTTPS communication
- [x] CORS configuration
- [x] Mobile responsive layout
- [x] Browser Network verification
- [x] EC2 reboot recovery
- [x] PostgreSQL automatic startup
- [x] FastAPI automatic startup
- [x] Nginx automatic startup
- [x] SSH security verification

---

## Error Handling

The backend provides structured API errors for:

- Invalid request data
- Missing required fields
- Duplicate SKU
- Duplicate customer email
- Insufficient stock
- Unknown product
- Unknown customer
- Unknown order
- Invalid order state transitions

The frontend converts API errors into user-friendly messages.

---

## Environment Variables

### Backend

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE
CORS_ORIGINS=http://localhost:3000
```

### Frontend

```env
REACT_APP_API_URL=http://localhost:8000
```

Production:

```env
REACT_APP_API_URL=https://13-127-16-102.sslip.io
```

> Never commit passwords, database credentials, API keys, or `.env` files to GitHub.

---

## Testing Checklist

### Products

- [x] Create product
- [x] View products
- [x] Search products
- [x] Update product
- [x] Delete product
- [x] Duplicate SKU validation
- [x] Stock quantity verification

### Customers

- [x] Create customer
- [x] View customers
- [x] Search customers
- [x] Update customer
- [x] Delete customer
- [x] Duplicate email validation
- [x] Customer form validation
- [x] Responsive form verification

### Orders

- [x] Create order
- [x] Select customer
- [x] Select products
- [x] Validate stock
- [x] Deduct stock
- [x] Calculate order total
- [x] Confirm order
- [x] Cancel pending order
- [x] Restore stock after cancellation
- [x] Prevent cancellation of confirmed orders
- [x] View order details

### Production

- [x] HTTPS
- [x] CORS
- [x] Nginx reverse proxy
- [x] EC2 deployment
- [x] PostgreSQL connectivity
- [x] Service auto-start
- [x] EC2 reboot test
- [x] Production API verification
- [x] Vercel deployment
- [x] Responsive UI verification
- [x] Browser Network verification
- [x] SSH security verification

---

## Future Improvements

- Authentication and role-based access control
- Admin and staff accounts
- JWT authentication
- Inventory audit history
- Supplier management
- Purchase orders
- Advanced analytics
- Low-stock notifications
- Automated database backups
- CI/CD pipeline
- Automated unit and integration tests
- Automated API testing
- Monitoring and alerting
- Custom domain for the production API
- Custom domain for the frontend

---

## Author

**Yash Yadav**

Full Stack Developer 

GitHub:

https://github.com/yash-yadav1804/Inventory-System

---

## License

This project is developed for educational, portfolio, and demonstration purposes.
