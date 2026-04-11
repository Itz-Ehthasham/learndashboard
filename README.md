# Learning Analytics Dashboard (LAD)

A full-stack web application for collecting, processing, analyzing, and visualizing student learning data.

## 🏗️ Project Structure

```
learning-analytics-dashboard/
├── backend/                 # Node.js + Express.js API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── server.js
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── utils/         # Helper functions
│   ├── package.json
│   └── public/
└── README.md
```

## 🚀 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React.js** - UI framework
- **Axios** - HTTP client
- **Chart.js/Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **React Router** - Navigation

## 📋 Features

### Core Features
- ✅ User Registration & Login
- ✅ Role-Based Access Control (Admin, Trainer, Student)
- ✅ Dashboard with real-time analytics
- ✅ Course Management
- ✅ Assessment Tracking
- ✅ Report Generation

### Analytics Features
- 📊 Average score calculation
- 📈 Attendance tracking
- 📉 Performance trends
- 🔍 Comparative analysis
- 👥 Engagement tracking

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning-analytics-dashboard
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # Backend .env
   MONGODB_URI=mongodb://localhost:27017/learning-analytics
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

5. **Start the application**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend (new terminal)
   cd frontend
   npm start
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Assessments
- `GET /api/assessments` - Get all assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/:id` - Get assessment by ID
- `PUT /api/assessments/:id` - Update assessment

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/performance/:userId` - User performance
- `GET /api/analytics/course/:courseId` - Course analytics
- `GET /api/analytics/reports` - Generate reports

## 🎯 User Roles

### Admin
- Manage users and roles
- Access all analytics
- System configuration
- Generate reports

### Trainer/Instructor
- Monitor student performance
- Manage courses and assessments
- View class analytics
- Generate student reports

### Student
- View personal progress
- Access course materials
- Track performance trends
- View personal analytics

## 🔐 Security Features

- JWT-based authentication
- Role-based authorization
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting

## 📈 Performance Metrics

- Response time < 2 seconds
- Real-time data updates
- Scalable architecture
- Optimized database queries
- Efficient data visualization

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy build/ folder to hosting service
```

## 📝 Development Guidelines

- Follow REST API conventions
- Use semantic versioning
- Write comprehensive tests
- Maintain code documentation
- Follow security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and queries, please contact the development team.
