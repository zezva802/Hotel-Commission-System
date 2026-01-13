# Hotel Commission Management System

A NestJS-based commission management system for B2B event management, handling hotel commission agreements and automated commission calculations.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)

## Features

- ✅ Multiple commission types (percentage-based, flat fee)
- ✅ Preferred hotel status with bonus rates
- ✅ Tiered commission bonuses based on monthly booking volume
- ✅ Commission rate history tracking
- ✅ Automated commission calculation on booking completion
- ✅ Monthly commission reports and CSV exports
- ✅ Comprehensive validation and error handling
- ✅ Full test coverage (unit + integration tests)

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.x
- **Testing**: Jest
- **Validation**: class-validator + class-transformer
- **Containerization**: Docker Compose

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Docker** and **Docker Compose**: Latest stable versions
- **Git**: For cloning the repository

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hotel-commission-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
DATABASE_URL="postgresql://commission_user:commission_pass@localhost:5433/hotel_commission_db?schema=public"
PORT=3000
NODE_ENV=development
```

For testing, create `.env.test`:

```env
DATABASE_URL="postgresql://commission_user:commission_pass@localhost:5435/hotel_commission_test_db?schema=public"
```

## Database Setup

### 1. Start PostgreSQL with Docker Compose

```bash
docker-compose up -d
```

This starts two PostgreSQL instances:

- **Development DB**: `localhost:5433`
- **Test DB**: `localhost:5435`

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations for development database
npx prisma migrate dev --name init

# Run migrations for test database
dotenv -e .env.test -- npx prisma migrate deploy
```

### 3. (Optional) Seed the Database

You can manually create test data using the API endpoints or Prisma Studio:

```bash
npx prisma studio
```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

### Production Mode

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

## Testing

### Run All Unit Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Run Tests with Coverage

```bash
npm run test:cov
```

## API Documentation

Base URL: `http://localhost:3000/api`

### Hotels Endpoints

#### Create Hotel

```http
POST /api/hotels
Content-Type: application/json

{
  "name": "Grand Hotel Zurich",
  "status": "PREFERRED"
}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Grand Hotel Zurich",
  "status": "PREFERRED",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### Get All Hotels

```http
GET /api/hotels
```

#### Get Hotel by ID

```http
GET /api/hotels/:id
```

#### Create Commission Agreement

```http
POST /api/hotels/:id/commission-agreement
Content-Type: application/json

{
  "type": "PERCENTAGE",
  "baseRate": 0.10,
  "preferredBonus": 0.02,
  "validFrom": "2024-01-01",
  "tierRules": [
    {
      "minBookings": 5,
      "bonusRate": 0.01
    },
    {
      "minBookings": 10,
      "bonusRate": 0.015
    }
  ]
}
```

**Commission Types:**

- `PERCENTAGE`: Uses `baseRate` (e.g., 0.10 for 10%)
- `FLAT_FEE`: Uses `flatAmount` (e.g., 150 for CHF 150)

**Response:**

```json
{
  "id": "uuid",
  "hotelId": "uuid",
  "type": "PERCENTAGE",
  "baseRate": "0.1000",
  "preferredBonus": "0.0200",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": null,
  "isActive": true,
  "tierRules": [
    {
      "id": "uuid",
      "minBookings": 5,
      "bonusRate": "0.0100"
    }
  ]
}
```

#### Get Active Commission Agreement

```http
GET /api/hotels/:id/commission-agreement
```

#### Update Commission Agreement

```http
PATCH /api/hotels/:id/commission-agreement
Content-Type: application/json

{
  "baseRate": 0.12,
  "validFrom": "2024-03-01"
}
```

> **Note**: Updating creates a new agreement and deactivates the old one, preserving history.

### Bookings Endpoints

#### Create Booking

```http
POST /api/bookings
Content-Type: application/json

{
  "hotelId": "uuid",
  "amount": 1000.00,
  "bookingDate": "2024-03-15"
}
```

**Response:**

```json
{
  "id": "uuid",
  "hotelId": "uuid",
  "amount": "1000.00",
  "status": "PENDING",
  "bookingDate": "2024-03-15T00:00:00.000Z",
  "completedAt": null,
  "hotel": {
    "id": "uuid",
    "name": "Grand Hotel Zurich",
    "status": "PREFERRED"
  }
}
```

#### Get All Bookings

```http
GET /api/bookings
```

#### Get Booking by ID

```http
GET /api/bookings/:id
```

#### Mark Booking as Completed

```http
PATCH /api/bookings/:id/complete
```

This endpoint:

1. Updates booking status to COMPLETED
2. Automatically calculates commission
3. Returns both booking and commission data

**Response:**

```json
{
  "booking": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2024-03-15T14:30:00.000Z"
  },
  "commission": {
    "id": "uuid",
    "bookingId": "uuid",
    "hotelId": "uuid",
    "baseAmount": "100.00",
    "baseRate": "0.1000",
    "preferredBonus": "20.00",
    "tierBonus": "10.00",
    "totalAmount": "130.00",
    "calculationDetails": {
      "monthlyBookingCount": 5,
      "appliedTierRule": {
        "minBookings": 5,
        "bonusRate": "0.01"
      }
    }
  }
}
```

#### Calculate Commission (Manual)

```http
POST /api/bookings/:id/calculate-commission
```

### Commissions Endpoints

#### Get Monthly Summary

```http
GET /api/commissions/summary?month=2024-03
```

**Response:**

```json
{
  "month": "2024-03",
  "period": {
    "start": "2024-03-01T00:00:00.000Z",
    "end": "2024-03-31T23:59:59.000Z"
  },
  "summary": [
    {
      "hotelId": "uuid",
      "hotelName": "Grand Hotel Zurich",
      "hotelStatus": "PREFERRED",
      "totalCommission": "1350.00",
      "bookingCount": 12,
      "calculations": [
        {
          "bookingId": "uuid",
          "bookingAmount": "1000.00",
          "commission": "130.00",
          "calculatedAt": "2024-03-15T10:00:00.000Z"
        }
      ]
    }
  ],
  "totals": {
    "totalHotels": 3,
    "totalBookings": 45,
    "grandTotalCommission": "4250.00"
  }
}
```

#### Export Monthly Summary (CSV)

```http
GET /api/commissions/export?month=2024-03
```

Returns a CSV file:

```csv
Hotel Name,Hotel Status,Total Bookings,Total Commission (CHF),Avg Commission (CHF)
"Grand Hotel Zurich",PREFERRED,12,1350.00,112.50
"Hotel Schweizerhof",STANDARD,8,680.00,85.00
"Park Hyatt",STANDARD,10,1500.00,150.00
TOTAL,,30,3530.00,
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   Hotel     │
├─────────────┤
│ id          │──┐
│ name        │  │
│ status      │  │
└─────────────┘  │
                 │
    ┌────────────┘
    │
    │   ┌───────────────────────┐
    ├──<│ CommissionAgreement   │
    │   ├───────────────────────┤
    │   │ id                    │──┐
    │   │ hotelId               │  │
    │   │ type                  │  │
    │   │ baseRate              │  │
    │   │ flatAmount            │  │
    │   │ preferredBonus        │  │
    │   │ validFrom             │  │
    │   │ validTo               │  │
    │   │ isActive              │  │
    │   └───────────────────────┘  │
    │                              │
    │        ┌─────────────────────┘
    │        │
    │        │   ┌──────────────────┐
    │        └──<│   TierRule       │
    │            ├──────────────────┤
    │            │ id               │
    │            │ agreementId      │
    │            │ minBookings      │
    │            │ bonusRate        │
    │            └──────────────────┘
    │
    │   ┌─────────────────┐
    ├──<│    Booking      │
    │   ├─────────────────┤
    │   │ id              │──┐
    │   │ hotelId         │  │
    │   │ amount          │  │
    │   │ status          │  │
    │   │ bookingDate     │  │
    │   │ completedAt     │  │
    │   └─────────────────┘  │
    │                        │
    │        ┌───────────────┘
    │        │
    │        │   ┌──────────────────────────┐
    └────────┼──<│ CommissionCalculation    │
             │   ├──────────────────────────┤
             │   │ id                       │
             └───│ bookingId                │
                 │ hotelId                  │
                 │ commissionAgreementId    │
                 │ baseAmount               │
                 │ baseRate                 │
                 │ preferredBonus           │
                 │ tierBonus                │
                 │ totalAmount              │
                 │ calculationDetails       │
                 │ calculatedAt             │
                 └──────────────────────────┘
```

### Key Design Features

1. **Historical Rate Tracking**: Commission agreements use `validFrom`/`validTo` dates, ensuring past calculations remain accurate
2. **Indexed Queries**: Strategic indexes on frequently queried fields (hotelId, calculatedAt, status)
3. **Cascading Deletes**: Tier rules are automatically deleted when their parent agreement is removed
4. **Audit Trail**: All entities track creation timestamps; calculations store metadata in JSON

## Project Structure

```
hotel-commission-system/
├── src/
│   ├── app.module.ts                    # Root module
│   ├── main.ts                          # Application entry point
│   ├── common/
│   │   └── prisma/
│   │       ├── prisma.module.ts         # Global Prisma module
│   │       └── prisma.service.ts        # Database connection service
│   └── modules/
│       ├── hotels/
│       │   ├── hotels.module.ts
│       │   ├── hotels.controller.ts     # Hotel & agreement endpoints
│       │   ├── hotels.service.ts        # Business logic
│       │   ├── hotels.repository.ts     # Data access layer
│       │   └── dto/
│       │       ├── create-hotel.dto.ts
│       │       ├── create-commission-agreement.dto.ts
│       │       └── update-commission-agreement.dto.ts
│       ├── bookings/
│       │   ├── bookings.module.ts
│       │   ├── bookings.controller.ts   # Booking endpoints
│       │   ├── bookings.service.ts      # Booking business logic
│       │   ├── bookings.repository.ts   # Booking data access
│       │   └── dto/
│       │       └── create-booking.dto.ts
│       └── commissions/
│           ├── commissions.module.ts
│           ├── commissions.controller.ts    # Commission reports
│           ├── commissions.service.ts       # Commission orchestration
│           ├── commissions.repository.ts    # Commission data access
│           ├── commission.calculator.ts     # Pure calculation logic
│           ├── commission.calculator.spec.ts # Calculator unit tests
│           └── dto/
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── migrations/                      # Migration history
├── test/
│   ├── calculate-commission.e2e-spec.ts # Integration tests
│   └── jest-e2e.json                    # E2E test configuration
├── docker-compose.yml                   # PostgreSQL containers
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
└── README.md
```

## Business Logic Examples

### Example 1: Grand Hotel Zurich (Preferred Status with Tier)

**Setup:**

- Hotel Status: PREFERRED
- Base Rate: 10%
- Preferred Bonus: +2%
- Tier Rule: 5+ bookings/month = +1%

**Booking #5 (before tier threshold):**

```
Booking Amount: CHF 1,000
Base Commission: CHF 1,000 × 10% = CHF 100
Preferred Bonus: CHF 1,000 × 2% = CHF 20
Tier Bonus: CHF 0 (only 4 completed bookings)
Total: CHF 120
```

**Booking #6 (tier threshold met):**

```
Booking Amount: CHF 1,000
Base Commission: CHF 1,000 × 10% = CHF 100
Preferred Bonus: CHF 1,000 × 2% = CHF 20
Tier Bonus: CHF 1,000 × 1% = CHF 10 (now 5 completed)
Total: CHF 130
```

### Example 2: Hotel Schweizerhof (Standard with Tier)

**Setup:**

- Hotel Status: STANDARD
- Base Rate: 8%
- Tier Rule: 10+ bookings/month = +0.5%

**Booking #10:**

```
Booking Amount: CHF 1,000
Base Commission: CHF 1,000 × 8% = CHF 80
Preferred Bonus: CHF 0 (standard status)
Tier Bonus: CHF 1,000 × 0.5% = CHF 5
Total: CHF 85
```

### Example 3: Park Hyatt (Flat Fee)

**Setup:**

- Hotel Status: STANDARD
- Commission: CHF 150 flat fee

**Any Booking:**

```
Booking Amount: CHF 5,000
Flat Fee: CHF 150
Total: CHF 150
```

**Note**: If Park Hyatt had PREFERRED status with a 2% bonus:

```
Booking Amount: CHF 5,000
Flat Fee: CHF 150
Preferred Bonus: CHF 5,000 × 2% = CHF 100
Total: CHF 250
```

## Architecture Highlights

### Separation of Concerns

1. **Controllers**: Handle HTTP requests/responses only
2. **Services**: Contain business logic and orchestration
3. **Repositories**: Encapsulate all database operations
4. **Calculator**: Pure calculation logic (no dependencies)
5. **DTOs**: Input validation and type safety

### Design Patterns

- **Repository Pattern**: Abstracts data access
- **Dependency Injection**: Loose coupling between modules
- **Strategy Pattern**: Different commission calculation strategies
- **Single Responsibility**: Each class has one clear purpose

### Error Handling

- Input validation via class-validator decorators
- Business rule violations throw appropriate HTTP exceptions
- Database errors are caught and logged
- Graceful degradation (booking completion succeeds even if commission calc fails)

## Common Workflows

### Creating a Complete Setup

```bash
# 1. Create hotel
curl -X POST http://localhost:3000/api/hotels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Hotel",
    "status": "PREFERRED"
  }'

# 2. Create commission agreement
curl -X POST http://localhost:3000/api/hotels/{hotelId}/commission-agreement \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PERCENTAGE",
    "baseRate": 0.10,
    "preferredBonus": 0.02,
    "validFrom": "2024-01-01",
    "tierRules": [{"minBookings": 5, "bonusRate": 0.01}]
  }'

# 3. Create and complete booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "{hotelId}",
    "amount": 1000,
    "bookingDate": "2024-03-15"
  }'

curl -X PATCH http://localhost:3000/api/bookings/{bookingId}/complete

# 4. View monthly summary
curl http://localhost:3000/api/commissions/summary?month=2024-03
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if containers are running
docker ps

# Restart containers
docker-compose down
docker-compose up -d

# Check logs
docker logs hotel-commission-db
```

### Prisma Issues

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

### Test Database Issues

```bash
# Ensure test database is running
docker ps | grep hotel-commission-test-db

# Run migrations on test database
dotenv -e .env.test -- npx prisma migrate deploy
```

## Future Enhancements

Potential improvements for production deployment:

1. **Authentication & Authorization**: Add JWT-based auth
2. **Rate Limiting**: Protect APIs from abuse
3. **Caching**: Redis for frequently accessed data
4. **Monitoring**: Prometheus metrics + Grafana dashboards
5. **Audit Logging**: Track all commission calculations
6. **Email Notifications**: Alert on commission calculations
7. **Webhooks**: Notify external systems of events
8. **GraphQL API**: Alternative to REST
9. **Multi-currency Support**: Handle different currencies
10. **Batch Processing**: Handle bulk commission calculations

## Author

Zezva Kobaidze
Backend Developer Assessment Submission
