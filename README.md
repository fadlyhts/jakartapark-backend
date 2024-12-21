# Park Management System API Documentation

A comprehensive API for managing public parks, including park information, damage reports, repairs, and reviews.

## Table of Contents
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
```bash
git clone https://github.com/fadlyhts/backend.git
cd backend
```

2. Install dependencies:
```bash 
npm install
```

### Environment Setup
1. Create a .env file in the root directory:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=park_management

# JWT Configuration
JWT_SECRET=your_jwt_secret
```

### Database Setup
1. Create a MySQL database:
```bash
CREATE DATABASE park_management;
```

2. Run migrations:
```bash
npm run migrate
```

### API Documentation
#### Authentication Endpoints
##### Register Admin
- ``` POST /api/auth/register-admin ```
- Requires admin privileges

##### Register User
- ``` POST /api/auth/register ```
- Public access

##### Login
- ``` POST /api/auth/login ```
- Public access

#### Parks Endpoints
##### Create Park
- ``` POST /api/parks ```
- Requires admin access
- Accepts multipart/form-data

##### Get All Parks
- ``` GET /api/parks ```
- Public access

#### DAMAGED PARKS ENDPOINTS
##### Report Damage
- ``` POST /api/damaged-parks ```
- Requires authentication
- Accepts multipart/form-data
##### Get Damage Reports
- ``` GET /api/damaged-parks ```
- Requires admin access
##### Get Damage Reports
- ``` GET /api/damaged-parks ```
- Requires admin access

#### REPAIRS ENDPOINTS
##### Add Repair Record
- ``` POST /api/repairs ```
- Requires admin access
- Accepts multipart/form-data

##### Get Repair Records
- ``` GET /api/repairs ```
- Requires admin access

#### REVIEWS ENDPOINTS
##### Add Review
- ``` POST /api/reviews ```
- Requires authentication

##### Get Park Reviews
- ``` GET /api/reviews/park/:parkId ```
- Public access


