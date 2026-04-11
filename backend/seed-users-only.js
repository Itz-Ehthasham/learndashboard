const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userData = [
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
      attendedSessions: 42
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
      attendedSessions: 35
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
      attendedSessions: 48
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
      attendedSessions: 25
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
      attendedSessions: 44
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
      attendedSessions: 30
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
      attendedSessions: 46
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
      attendedSessions: 28
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
      attendedSessions: 40
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
      attendedSessions: 33
    }
  }
];

async function seedUsers() {
  try {
    console.log('Starting user data seeding...');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create users
    const createdUsers = [];
    for (const userInfo of userData) {
      const user = new User(userInfo);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.firstName} ${user.lastName} (${user.role})`);
    }

    console.log('\n=== User Data Seeding Complete ===');
    console.log(`Created ${createdUsers.length} users:`);
    console.log(`- ${createdUsers.filter(u => u.role === 'admin').length} admins`);
    console.log(`- ${createdUsers.filter(u => u.role === 'trainer').length} trainers`);
    console.log(`- ${createdUsers.filter(u => u.role === 'student').length} students`);
    
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
    console.error('Error seeding users:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the seeding function
seedUsers();
