const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

async function migrateIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/language-school');
    console.log('Connected to MongoDB');

    // Migrate Students
    console.log('\n📚 Migrating Students...');
    const students = await Student.find({ studentId: { $exists: false } });
    console.log(`Found ${students.length} students without IDs`);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      student.studentId = `STU-${String(i + 1).padStart(4, '0')}`;
      await student.save();
      console.log(`  ✓ ${student.firstName} ${student.lastName} → ${student.studentId}`);
    }

    // Migrate Teachers
    console.log('\n👨‍🏫 Migrating Teachers...');
    const teachers = await Teacher.find({ staffId: { $exists: false } });
    console.log(`Found ${teachers.length} teachers without IDs`);

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      teacher.staffId = `STF-${String(i + 1).padStart(4, '0')}`;
      await teacher.save();
      console.log(`  ✓ ${teacher.firstName} ${teacher.lastName} → ${teacher.staffId}`);
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrateIds();
