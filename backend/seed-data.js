const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Assessment = require('./src/models/Assessment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleData = {
  users: [
    // Admin Users
    {
      firstName: 'John',
      lastName: 'Administrator',
      email: 'admin@school.edu',
      password: 'Admin123',
      role: 'admin',
      phone: '+1234567890',
      dateOfBirth: new Date('1980-05-15')
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.admin@school.edu',
      password: 'Admin123',
      role: 'admin',
      phone: '+1234567891',
      dateOfBirth: new Date('1985-08-22')
    },

    // Trainer Users
    {
      firstName: 'Michael',
      lastName: 'Wilson',
      email: 'michael.wilson@school.edu',
      password: 'Trainer123',
      role: 'trainer',
      phone: '+1234567892',
      dateOfBirth: new Date('1978-03-10')
    },
    {
      firstName: 'Emily',
      lastName: 'Brown',
      email: 'emily.brown@school.edu',
      password: 'Trainer123',
      role: 'trainer',
      phone: '+1234567893',
      dateOfBirth: new Date('1982-11-28')
    },
    {
      firstName: 'David',
      lastName: 'Lee',
      email: 'david.lee@school.edu',
      password: 'Trainer123',
      role: 'trainer',
      phone: '+1234567894',
      dateOfBirth: new Date('1979-07-14')
    },

    // Student Users
    {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024001',
      phone: '+1234567895',
      dateOfBirth: new Date('2004-02-15'),
      academicInfo: {
        section: 'A',
        year: 3,
        semester: '5',
        batch: '2024'
      },
      attendance: {
        totalSessions: 45,
        attendedSessions: 42,
        attendanceRate: 93.3
      }
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024002',
      phone: '+1234567896',
      dateOfBirth: new Date('2004-05-22'),
      academicInfo: {
        section: 'B',
        year: 2,
        semester: '3',
        batch: '2024'
      },
      attendance: {
        totalSessions: 40,
        attendedSessions: 35,
        attendanceRate: 87.5
      }
    },
    {
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol.williams@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024003',
      phone: '+1234567897',
      dateOfBirth: new Date('2003-09-10'),
      academicInfo: {
        section: 'A',
        year: 4,
        semester: '7',
        batch: '2023'
      },
      attendance: {
        totalSessions: 50,
        attendedSessions: 48,
        attendanceRate: 96.0
      }
    },
    {
      firstName: 'Daniel',
      lastName: 'Davis',
      email: 'daniel.davis@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024004',
      phone: '+1234567898',
      dateOfBirth: new Date('2004-01-08'),
      academicInfo: {
        section: 'C',
        year: 1,
        semester: '1',
        batch: '2024'
      },
      attendance: {
        totalSessions: 30,
        attendedSessions: 25,
        attendanceRate: 83.3
      }
    },
    {
      firstName: 'Emma',
      lastName: 'Miller',
      email: 'emma.miller@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024005',
      phone: '+1234567899',
      dateOfBirth: new Date('2003-12-03'),
      academicInfo: {
        section: 'B',
        year: 3,
        semester: '5',
        batch: '2023'
      },
      attendance: {
        totalSessions: 45,
        attendedSessions: 44,
        attendanceRate: 97.8
      }
    },
    {
      firstName: 'Frank',
      lastName: 'Garcia',
      email: 'frank.garcia@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024006',
      phone: '+1234567800',
      dateOfBirth: new Date('2004-06-18'),
      academicInfo: {
        section: 'A',
        year: 2,
        semester: '3',
        batch: '2024'
      },
      attendance: {
        totalSessions: 38,
        attendedSessions: 30,
        attendanceRate: 78.9
      }
    },
    {
      firstName: 'Grace',
      lastName: 'Martinez',
      email: 'grace.martinez@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024007',
      phone: '+1234567801',
      dateOfBirth: new Date('2003-10-25'),
      academicInfo: {
        section: 'C',
        year: 4,
        semester: '7',
        batch: '2023'
      },
      attendance: {
        totalSessions: 48,
        attendedSessions: 46,
        attendanceRate: 95.8
      }
    },
    {
      firstName: 'Henry',
      lastName: 'Anderson',
      email: 'henry.anderson@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024008',
      phone: '+1234567802',
      dateOfBirth: new Date('2004-04-12'),
      academicInfo: {
        section: 'B',
        year: 1,
        semester: '1',
        batch: '2024'
      },
      attendance: {
        totalSessions: 32,
        attendedSessions: 28,
        attendanceRate: 87.5
      }
    },
    {
      firstName: 'Isabella',
      lastName: 'Taylor',
      email: 'isabella.taylor@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024009',
      phone: '+1234567803',
      dateOfBirth: new Date('2003-08-07'),
      academicInfo: {
        section: 'A',
        year: 3,
        semester: '6',
        batch: '2023'
      },
      attendance: {
        totalSessions: 42,
        attendedSessions: 40,
        attendanceRate: 95.2
      }
    },
    {
      firstName: 'James',
      lastName: 'Thomas',
      email: 'james.thomas@school.edu',
      password: 'Student123',
      role: 'student',
      studentId: 'ST2024010',
      phone: '+1234567804',
      dateOfBirth: new Date('2004-03-20'),
      academicInfo: {
        section: 'C',
        year: 2,
        semester: '4',
        batch: '2024'
      },
      attendance: {
        totalSessions: 36,
        attendedSessions: 33,
        attendanceRate: 91.7
      }
    }
  ],

  courses: [
    {
      title: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'Fundamental concepts of computer science and programming',
      category: 'Computer Science',
      level: 'Beginner',
      credits: 3,
      duration: 16,
      maxStudents: 30,
      schedule: {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '10:00 AM - 11:30 AM'
      }
    },
    {
      title: 'Data Structures and Algorithms',
      code: 'CS201',
      description: 'Advanced data structures and algorithm analysis',
      category: 'Computer Science',
      level: 'Intermediate',
      credits: 4,
      duration: 16,
      maxStudents: 25,
      schedule: {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        days: ['Tuesday', 'Thursday'],
        time: '2:00 PM - 3:30 PM'
      }
    },
    {
      title: 'Web Development Fundamentals',
      code: 'WD101',
      description: 'HTML, CSS, and JavaScript basics',
      category: 'Web Development',
      level: 'Beginner',
      credits: 3,
      duration: '12 weeks',
      maxStudents: 35,
      schedule: {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        days: ['Monday', 'Wednesday'],
        time: '3:00 PM - 4:30 PM'
      }
    },
    {
      title: 'Database Management Systems',
      code: 'DB301',
      description: 'Relational database design and SQL',
      category: 'Database',
      level: 'Intermediate',
      credits: 3,
      duration: '14 weeks',
      maxStudents: 28,
      schedule: {
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-05-10'),
        days: ['Tuesday', 'Thursday', 'Friday'],
        time: '11:00 AM - 12:30 PM'
      }
    },
    {
      title: 'Mathematics for Computing',
      code: 'MATH101',
      description: 'Mathematical foundations for computer science',
      category: 'Mathematics',
      level: 'Beginner',
      credits: 4,
      duration: 16,
      maxStudents: 40,
      schedule: {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        time: '9:00 AM - 10:00 AM'
      }
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assessment.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleData.users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.firstName} ${user.lastName} (${user.role})`);
    }

    // Create courses
    const createdCourses = [];
    const trainers = createdUsers.filter(u => u.role === 'trainer');
    
    for (let i = 0; i < sampleData.courses.length; i++) {
      const courseData = sampleData.courses[i];
      const trainer = trainers[i % trainers.length]; // Assign trainers round-robin
      
      const course = new Course({
        ...courseData,
        instructor: trainer._id
      });
      await course.save();
      createdCourses.push(course);
      console.log(`Created course: ${course.title} (Instructor: ${trainer.firstName} ${trainer.lastName})`);
    }

    // Enroll students in courses
    const students = createdUsers.filter(u => u.role === 'student');
    
    for (const student of students) {
      // Enroll each student in 2-3 random courses
      const numCourses = Math.floor(Math.random() * 2) + 2; // 2-3 courses
      const availableCourses = createdCourses.slice();
      
      for (let i = 0; i < numCourses && availableCourses.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableCourses.length);
        const course = availableCourses.splice(randomIndex, 1)[0];
        
        course.enrolledStudents.push(student._id);
        student.enrolledCourses.push(course._id);
        
        console.log(`Enrolled ${student.firstName} ${student.lastName} in ${course.title}`);
      }
      
      await student.save();
    }

    // Save courses with enrolled students
    for (const course of createdCourses) {
      await course.save();
    }

    console.log('\n=== Database Seeding Complete ===');
    console.log(`Created ${createdUsers.length} users:`);
    console.log(`- ${createdUsers.filter(u => u.role === 'admin').length} admins`);
    console.log(`- ${createdUsers.filter(u => u.role === 'trainer').length} trainers`);
    console.log(`- ${createdUsers.filter(u => u.role === 'student').length} students`);
    console.log(`Created ${createdCourses.length} courses`);
    
    console.log('\n=== Login Credentials ===');
    console.log('Admin Accounts:');
    console.log('  Email: admin@school.edu, Password: Admin123');
    console.log('  Email: sarah.admin@school.edu, Password: Admin123');
    console.log('\nTrainer Accounts:');
    console.log('  Email: michael.wilson@school.edu, Password: Trainer123');
    console.log('  Email: emily.brown@school.edu, Password: Trainer123');
    console.log('  Email: david.lee@school.edu, Password: Trainer123');
    console.log('\nStudent Accounts (Sample):');
    console.log('  Email: alice.smith@school.edu, Password: Student123');
    console.log('  Email: bob.johnson@school.edu, Password: Student123');
    console.log('  (All students use password: Student123)');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the seeding function
seedDatabase();
