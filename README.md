# Nail FPT Server

Backend server for Nail FPT application - A platform connecting nail artists with customers.

## Features

- User authentication (Register/Login)
- Nail artist management
- Review system
- Location-based search
- Admin dashboard

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma (SQLite)
- JWT Authentication

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nail-fpt-server.git
cd nail-fpt-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## API Documentation

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login

### Nail Artists
- GET `/api/nail-artists/search` - Search nail artists (with location)
- GET `/api/nail-artists/:id` - Get nail artist details
- POST `/api/nail-artists/register` - Register as nail artist

### Reviews
- POST `/api/reviews` - Create review
- GET `/api/reviews/nail-artist/:nailArtistId` - Get reviews by nail artist

### Admin
- GET `/api/admin/nail-artists` - Get all nail artists
- PUT `/api/admin/nail-artists/:id/approve` - Approve nail artist
- DELETE `/api/admin/nail-artists/:id` - Delete nail artist

## Testing

Run the test script:
```bash
./test-api.sh
```

## License

MIT 