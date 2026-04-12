const mongoose = require('mongoose');
const User = require('./src/models/User');
const Course = require('./src/models/Course');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-analytics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const courseData = [
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
    duration: 12,
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
    duration: 14,
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
];

async function seedCourses() {
  try {
    console.log('Starting course seeding...');

    
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    
    const trainers = await User.find({ role: 'trainer' });
    if (trainers.length === 0) {
      console.log('No trainers found. Please run the main seed script first.');
      return;
    }

    
    const createdCourses = [];
    for (let i = 0; i < courseData.length; i++) {
      const courseInfo = courseData[i];
      const trainer = trainers[i % trainers.length]; 
      
      const course = new Course({
        ...courseInfo,
        instructor: trainer._id
      });
      await course.save();
      createdCourses.push(course);
      console.log(`Created course: ${course.title} (Instructor: ${trainer.firstName} ${trainer.lastName})`);
    }

    
    const students = await User.find({ role: 'student' });
    
    for (const student of students) {
      
      const numCourses = Math.floor(Math.random() * 2) + 2; 
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

    
    for (const course of createdCourses) {
      await course.save();
    }

    console.log('\n=== Course Seeding Complete ===');
    console.log(`Created ${createdCourses.length} courses`);
    console.log(`Enrolled ${students.length} students in courses`);

  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedCourses();
