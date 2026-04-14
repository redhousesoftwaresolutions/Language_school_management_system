const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Student      = require('./models/Student');
const Teacher      = require('./models/Teacher');
const Course       = require('./models/Course');
const Accommodation = require('./models/Accommodation');
const Invoice      = require('./models/Invoice');
const Payment      = require('./models/Payment');
const Income       = require('./models/Income');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data (keep admins)
  await Promise.all([
    Student.deleteMany({}),
    Teacher.deleteMany({}),
    Course.deleteMany({}),
    Accommodation.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    Income.deleteMany({})
  ]);
  console.log('Cleared old seed data');

  const hash = await bcrypt.hash('Password123', 10);

  // ── TEACHERS ────────────────────────────────────────────────────────────────
  const teacherData = [
    { firstName: 'Sarah',   lastName: 'Johnson',  email: 'sarah.johnson@school.com',  phone: '07700900001', specialization: 'General English' },
    { firstName: 'Michael', lastName: 'Brown',    email: 'michael.brown@school.com',  phone: '07700900002', specialization: 'Business English' },
    { firstName: 'Emily',   lastName: 'Davis',    email: 'emily.davis@school.com',    phone: '07700900003', specialization: 'IELTS Preparation' },
    { firstName: 'James',   lastName: 'Wilson',   email: 'james.wilson@school.com',   phone: '07700900004', specialization: 'TOEFL Preparation' },
    { firstName: 'Laura',   lastName: 'Martinez', email: 'laura.martinez@school.com', phone: '07700900005', specialization: 'Conversation Skills' },
    { firstName: 'Robert',  lastName: 'Anderson', email: 'robert.anderson@school.com',phone: '07700900006', specialization: 'Academic Writing' },
    { firstName: 'Jessica', lastName: 'Taylor',   email: 'jessica.taylor@school.com', phone: '07700900007', specialization: 'Grammar & Vocabulary' },
    { firstName: 'David',   lastName: 'Thomas',   email: 'david.thomas@school.com',   phone: '07700900008', specialization: 'Pronunciation' },
    { firstName: 'Rachel',  lastName: 'Moore',    email: 'rachel.moore@school.com',   phone: '07700900009', specialization: 'Young Learners' },
    { firstName: 'Chris',   lastName: 'Jackson',  email: 'chris.jackson@school.com',  phone: '07700900010', specialization: 'Cambridge Exam Prep' },
  ];
  const teachers = await Teacher.insertMany(teacherData.map(t => ({ ...t, password: hash })));
  console.log(`Created ${teachers.length} teachers`);

  // ── COURSES ─────────────────────────────────────────────────────────────────
  const courseData = [
    { name: 'General English Beginner',   code: 'GEB01', level: 'Beginner',     teacher: teachers[0]._id, days: ['Monday','Wednesday','Friday'], startTime: '09:00', endTime: '11:00', price: 800,  maxStudents: 12, startDate: new Date('2025-01-06'), endDate: new Date('2025-03-28') },
    { name: 'General English Pre-Int',    code: 'GEP01', level: 'Pre-Intermediate', teacher: teachers[0]._id, days: ['Tuesday','Thursday'], startTime: '09:00', endTime: '11:30', price: 900,  maxStudents: 12, startDate: new Date('2025-01-06'), endDate: new Date('2025-03-28') },
    { name: 'Business English',           code: 'BE01',  level: 'Intermediate', teacher: teachers[1]._id, days: ['Monday','Wednesday'], startTime: '14:00', endTime: '16:00', price: 1200, maxStudents: 10, startDate: new Date('2025-01-06'), endDate: new Date('2025-06-27') },
    { name: 'IELTS Preparation',          code: 'IEL01', level: 'Upper-Intermediate', teacher: teachers[2]._id, days: ['Monday','Tuesday','Wednesday','Thursday'], startTime: '09:00', endTime: '12:00', price: 1500, maxStudents: 8, startDate: new Date('2025-02-03'), endDate: new Date('2025-04-25') },
    { name: 'TOEFL Preparation',          code: 'TOE01', level: 'Upper-Intermediate', teacher: teachers[3]._id, days: ['Tuesday','Thursday','Friday'], startTime: '13:00', endTime: '15:30', price: 1500, maxStudents: 8, startDate: new Date('2025-02-03'), endDate: new Date('2025-04-25') },
    { name: 'Conversation Club',          code: 'CON01', level: 'Intermediate', teacher: teachers[4]._id, days: ['Wednesday','Friday'], startTime: '11:00', endTime: '12:30', price: 600,  maxStudents: 15, startDate: new Date('2025-01-06'), endDate: new Date('2025-12-19') },
    { name: 'Academic Writing',           code: 'AW01',  level: 'Advanced',     teacher: teachers[5]._id, days: ['Monday','Thursday'], startTime: '14:00', endTime: '16:00', price: 1100, maxStudents: 10, startDate: new Date('2025-03-03'), endDate: new Date('2025-05-23') },
    { name: 'Grammar & Vocabulary',       code: 'GV01',  level: 'Beginner',     teacher: teachers[6]._id, days: ['Tuesday','Friday'], startTime: '10:00', endTime: '12:00', price: 750,  maxStudents: 12, startDate: new Date('2025-01-06'), endDate: new Date('2025-03-28') },
    { name: 'Young Learners English',     code: 'YLE01', level: 'Beginner',     teacher: teachers[8]._id, days: ['Saturday'], startTime: '09:00', endTime: '12:00', price: 500,  maxStudents: 10, startDate: new Date('2025-01-11'), endDate: new Date('2025-06-28') },
    { name: 'Cambridge B2 First',         code: 'CAM01', level: 'Upper-Intermediate', teacher: teachers[9]._id, days: ['Monday','Wednesday','Friday'], startTime: '13:00', endTime: '15:30', price: 1800, maxStudents: 8, startDate: new Date('2025-02-03'), endDate: new Date('2025-05-23') },
  ];
  const courses = await Course.insertMany(courseData);
  console.log(`Created ${courses.length} courses`);

  // ── STUDENTS ─────────────────────────────────────────────────────────────────
  const studentData = [
    { firstName: 'Luca',      lastName: 'Rossi',      email: 'luca.rossi@email.com',      phone: '07800000001', dateOfBirth: new Date('1998-03-15'), enrolledCourses: [courses[0]._id], address: { street: '12 Oak Street', city: 'London', postcode: 'E1 6RF', country: 'Italy' },          emergencyContact: { name: 'Marco Rossi',     relationship: 'Father', phone: '+39 02 1234567' }, permissions: { photographicPermission: true,  mediaPermission: true,  dataProcessingConsent: true  } },
    { firstName: 'Sofia',     lastName: 'Garcia',     email: 'sofia.garcia@email.com',     phone: '07800000002', dateOfBirth: new Date('2000-07-22'), enrolledCourses: [courses[3]._id], address: { street: '45 Maple Ave',  city: 'London', postcode: 'N1 9GU', country: 'Spain' },          emergencyContact: { name: 'Elena Garcia',    relationship: 'Mother', phone: '+34 91 1234567' }, permissions: { photographicPermission: true,  mediaPermission: false, dataProcessingConsent: true  } },
    { firstName: 'Ahmed',     lastName: 'Hassan',     email: 'ahmed.hassan@email.com',     phone: '07800000003', dateOfBirth: new Date('1995-11-08'), enrolledCourses: [courses[2]._id], address: { street: '8 Pine Road',   city: 'London', postcode: 'SE1 7PB', country: 'Egypt' },         emergencyContact: { name: 'Fatima Hassan',   relationship: 'Sister', phone: '+20 2 1234567'  }, permissions: { photographicPermission: false, mediaPermission: false, dataProcessingConsent: true  } },
    { firstName: 'Yuki',      lastName: 'Tanaka',     email: 'yuki.tanaka@email.com',      phone: '07800000004', dateOfBirth: new Date('2001-05-30'), enrolledCourses: [courses[4]._id], address: { street: '33 Cedar Lane', city: 'London', postcode: 'W2 3RY', country: 'Japan' },          emergencyContact: { name: 'Kenji Tanaka',    relationship: 'Father', phone: '+81 3 1234567'  }, permissions: { photographicPermission: true,  mediaPermission: true,  dataProcessingConsent: true  } },
    { firstName: 'Marie',     lastName: 'Dupont',     email: 'marie.dupont@email.com',     phone: '07800000005', dateOfBirth: new Date('1999-09-14'), enrolledCourses: [courses[5]._id], address: { street: '19 Elm Street',  city: 'London', postcode: 'SW3 4TZ', country: 'France' },        emergencyContact: { name: 'Pierre Dupont',   relationship: 'Father', phone: '+33 1 1234567'  }, permissions: { photographicPermission: true,  mediaPermission: true,  dataProcessingConsent: true  } },
    { firstName: 'Carlos',    lastName: 'Silva',      email: 'carlos.silva@email.com',     phone: '07800000006', dateOfBirth: new Date('1997-02-19'), enrolledCourses: [courses[6]._id], address: { street: '7 Birch Close',  city: 'London', postcode: 'EC2 5HN', country: 'Brazil' },        emergencyContact: { name: 'Ana Silva',       relationship: 'Mother', phone: '+55 11 1234567' }, permissions: { photographicPermission: false, mediaPermission: false, dataProcessingConsent: true  } },
    { firstName: 'Fatima',    lastName: 'Al-Rashid',  email: 'fatima.alrashid@email.com',  phone: '07800000007', dateOfBirth: new Date('2002-12-03'), enrolledCourses: [courses[1]._id], address: { street: '55 Walnut Way',  city: 'London', postcode: 'NW1 6XE', country: 'Saudi Arabia' },   emergencyContact: { name: 'Omar Al-Rashid',  relationship: 'Brother',phone: '+966 1 1234567'}, permissions: { photographicPermission: false, mediaPermission: false, dataProcessingConsent: true  } },
    { firstName: 'Hans',      lastName: 'Muller',     email: 'hans.muller@email.com',      phone: '07800000008', dateOfBirth: new Date('1993-06-27'), enrolledCourses: [courses[7]._id], address: { street: '22 Ash Grove',   city: 'London', postcode: 'SE5 8QA', country: 'Germany' },        emergencyContact: { name: 'Greta Muller',    relationship: 'Wife',   phone: '+49 30 1234567' }, permissions: { photographicPermission: true,  mediaPermission: true,  dataProcessingConsent: true  } },
    { firstName: 'Priya',     lastName: 'Patel',      email: 'priya.patel@email.com',      phone: '07800000009', dateOfBirth: new Date('2003-04-11'), enrolledCourses: [courses[8]._id], address: { street: '3 Chestnut Rd',  city: 'London', postcode: 'W4 2NP', country: 'India' },          emergencyContact: { name: 'Raj Patel',       relationship: 'Father', phone: '+91 22 1234567' }, permissions: { photographicPermission: true,  mediaPermission: true,  dataProcessingConsent: true  } },
    { firstName: 'Nguyen',    lastName: 'Van Minh',   email: 'nguyen.vanminh@email.com',   phone: '07800000010', dateOfBirth: new Date('1996-08-25'), enrolledCourses: [courses[9]._id], address: { street: '68 Poplar Street',city: 'London', postcode: 'E3 4LR', country: 'Vietnam' },        emergencyContact: { name: 'Nguyen Thi Lan',  relationship: 'Mother', phone: '+84 28 1234567' }, permissions: { photographicPermission: true,  mediaPermission: false, dataProcessingConsent: true  } },
  ];
  const students = await Student.insertMany(studentData.map(s => ({ ...s, password: hash })));
  console.log(`Created ${students.length} students`);

  // ── ACCOMMODATIONS ────────────────────────────────────────────────────────────
  const accommodationData = [
    { propertyName: 'Sunrise Homestay',      address: '14 Sunrise Road',     city: 'London', postcode: 'E2 8HN',  country: 'UK', roomType: 'Single',        capacity: 1, pricePerWeek: 180, availableFrom: new Date('2025-01-01'), landlordName: 'Mrs. Smith',     landlordPhone: '07900100001', landlordEmail: 'smith@homestay.com',     available: false, student: students[0]._id, amenities: 'WiFi, Breakfast included' },
    { propertyName: 'Central City Rooms',    address: '5 City Square',        city: 'London', postcode: 'EC1 2AB', country: 'UK', roomType: 'Single',        capacity: 1, pricePerWeek: 210, availableFrom: new Date('2025-01-01'), landlordName: 'Mr. Patel',      landlordPhone: '07900100002', landlordEmail: 'patel@cityrooms.com',    available: false, student: students[1]._id, amenities: 'WiFi, Kitchen access' },
    { propertyName: 'Green Park Residence',  address: '88 Green Park Lane',   city: 'London', postcode: 'W1J 7AZ', country: 'UK', roomType: 'Double',        capacity: 2, pricePerWeek: 250, availableFrom: new Date('2025-02-01'), landlordName: 'Ms. Brown',      landlordPhone: '07900100003', landlordEmail: 'brown@greenpark.com',    available: true,  student: null,           amenities: 'WiFi, En-suite, Breakfast' },
    { propertyName: 'East End Hostel',       address: '30 Whitechapel Road',  city: 'London', postcode: 'E1 1DY',  country: 'UK', roomType: 'Shared Room',   capacity: 4, pricePerWeek: 120, availableFrom: new Date('2025-01-01'), landlordName: 'Mr. Ali',        landlordPhone: '07900100004', landlordEmail: 'ali@eastend.com',        available: false, student: students[2]._id, amenities: 'WiFi, Shared Kitchen' },
    { propertyName: 'Victoria Homestay',     address: '21 Victoria Street',   city: 'London', postcode: 'SW1E 5ND',country: 'UK', roomType: 'Single',        capacity: 1, pricePerWeek: 200, availableFrom: new Date('2025-03-01'), landlordName: 'Mrs. Jones',     landlordPhone: '07900100005', landlordEmail: 'jones@victoriahome.com', available: true,  student: null,           amenities: 'WiFi, All meals included' },
    { propertyName: 'Camden Student House',  address: '67 Camden High Street', city: 'London', postcode: 'NW1 7JL', country: 'UK', roomType: 'Single',        capacity: 1, pricePerWeek: 175, availableFrom: new Date('2025-01-01'), landlordName: 'Mr. O\'Brien',   landlordPhone: '07900100006', landlordEmail: 'obrien@camden.com',      available: false, student: students[3]._id, amenities: 'WiFi, Kitchen access' },
    { propertyName: 'Kensington Flat Share', address: '9 Kensington Gardens', city: 'London', postcode: 'W8 4PT',  country: 'UK', roomType: 'Double',        capacity: 2, pricePerWeek: 270, availableFrom: new Date('2025-02-15'), landlordName: 'Ms. Clarke',     landlordPhone: '07900100007', landlordEmail: 'clarke@kensington.com',  available: true,  student: null,           amenities: 'WiFi, En-suite, Gym access' },
    { propertyName: 'Brixton Budget Rooms',  address: '42 Brixton Road',      city: 'London', postcode: 'SW9 7AA',  country: 'UK', roomType: 'Shared Room',   capacity: 3, pricePerWeek: 110, availableFrom: new Date('2025-01-01'), landlordName: 'Mr. Williams',   landlordPhone: '07900100008', landlordEmail: 'williams@brixton.com',   available: false, student: students[4]._id, amenities: 'WiFi, Shared bathroom' },
    { propertyName: 'Islington Guesthouse',  address: '15 Upper Street',      city: 'London', postcode: 'N1 0PQ',  country: 'UK', roomType: 'Single',        capacity: 1, pricePerWeek: 190, availableFrom: new Date('2025-04-01'), landlordName: 'Mrs. Lee',       landlordPhone: '07900100009', landlordEmail: 'lee@islington.com',      available: true,  student: null,           amenities: 'WiFi, Breakfast, Study room' },
    { propertyName: 'Shoreditch Studio',     address: '101 Shoreditch Ave',   city: 'London', postcode: 'E2 7RH',  country: 'UK', roomType: 'Studio',        capacity: 1, pricePerWeek: 300, availableFrom: new Date('2025-01-01'), landlordName: 'Mr. Khan',       landlordPhone: '07900100010', landlordEmail: 'khan@shoreditch.com',    available: false, student: students[5]._id, amenities: 'WiFi, Private kitchen & bath' },
  ];
  const accommodations = await Accommodation.insertMany(accommodationData);
  console.log(`Created ${accommodations.length} accommodations`);

  // ── INVOICES ──────────────────────────────────────────────────────────────────
  const invoiceData = [
    { invoiceNumber: 'INV-001', student: students[0]._id, course: courses[0]._id, amount: 800,  issuedDate: new Date('2025-01-02'), dueDate: new Date('2025-01-16'), status: 'Paid'    },
    { invoiceNumber: 'INV-002', student: students[1]._id, course: courses[3]._id, amount: 1500, issuedDate: new Date('2025-01-05'), dueDate: new Date('2025-01-19'), status: 'Paid'    },
    { invoiceNumber: 'INV-003', student: students[2]._id, course: courses[2]._id, amount: 1200, issuedDate: new Date('2025-01-06'), dueDate: new Date('2025-01-20'), status: 'Paid'    },
    { invoiceNumber: 'INV-004', student: students[3]._id, course: courses[4]._id, amount: 1500, issuedDate: new Date('2025-01-08'), dueDate: new Date('2025-01-22'), status: 'Pending' },
    { invoiceNumber: 'INV-005', student: students[4]._id, course: courses[5]._id, amount: 600,  issuedDate: new Date('2025-01-10'), dueDate: new Date('2025-01-24'), status: 'Paid'    },
    { invoiceNumber: 'INV-006', student: students[5]._id, course: courses[6]._id, amount: 1100, issuedDate: new Date('2025-02-01'), dueDate: new Date('2025-02-15'), status: 'Overdue' },
    { invoiceNumber: 'INV-007', student: students[6]._id, course: courses[1]._id, amount: 900,  issuedDate: new Date('2025-02-03'), dueDate: new Date('2025-02-17'), status: 'Paid'    },
    { invoiceNumber: 'INV-008', student: students[7]._id, course: courses[7]._id, amount: 750,  issuedDate: new Date('2025-02-05'), dueDate: new Date('2025-02-19'), status: 'Pending' },
    { invoiceNumber: 'INV-009', student: students[8]._id, course: courses[8]._id, amount: 500,  issuedDate: new Date('2025-02-10'), dueDate: new Date('2025-02-24'), status: 'Paid'    },
    { invoiceNumber: 'INV-010', student: students[9]._id, course: courses[9]._id, amount: 1800, issuedDate: new Date('2025-02-12'), dueDate: new Date('2025-02-26'), status: 'Pending' },
  ];
  const invoices = await Invoice.insertMany(invoiceData);
  console.log(`Created ${invoices.length} invoices`);

  // ── PAYMENTS ──────────────────────────────────────────────────────────────────
  const paymentData = [
    { paymentRef: 'PAY-001', student: students[0]._id, invoice: invoices[0]._id, amount: 800,  date: new Date('2025-01-10'), method: 'Bank Transfer', status: 'Completed' },
    { paymentRef: 'PAY-002', student: students[1]._id, invoice: invoices[1]._id, amount: 1500, date: new Date('2025-01-14'), method: 'Card',          status: 'Completed' },
    { paymentRef: 'PAY-003', student: students[2]._id, invoice: invoices[2]._id, amount: 1200, date: new Date('2025-01-15'), method: 'Bank Transfer', status: 'Completed' },
    { paymentRef: 'PAY-004', student: students[4]._id, invoice: invoices[4]._id, amount: 600,  date: new Date('2025-01-18'), method: 'Cash',          status: 'Completed' },
    { paymentRef: 'PAY-005', student: students[6]._id, invoice: invoices[6]._id, amount: 900,  date: new Date('2025-02-10'), method: 'Card',          status: 'Completed' },
    { paymentRef: 'PAY-006', student: students[8]._id, invoice: invoices[8]._id, amount: 500,  date: new Date('2025-02-15'), method: 'Bank Transfer', status: 'Completed' },
    { paymentRef: 'PAY-007', student: students[3]._id, invoice: invoices[3]._id, amount: 750,  date: new Date('2025-03-01'), method: 'Card',          status: 'Pending'   },
    { paymentRef: 'PAY-008', student: students[7]._id, invoice: invoices[7]._id, amount: 375,  date: new Date('2025-03-05'), method: 'Bank Transfer', status: 'Pending'   },
    { paymentRef: 'PAY-009', student: students[9]._id, invoice: invoices[9]._id, amount: 900,  date: new Date('2025-03-10'), method: 'Card',          status: 'Completed' },
    { paymentRef: 'PAY-010', student: students[5]._id, invoice: invoices[5]._id, amount: 550,  date: new Date('2025-03-12'), method: 'Bank Transfer', status: 'Failed'    },
  ];
  await Payment.insertMany(paymentData);
  console.log(`Created ${paymentData.length} payments`);

  // ── INCOME ────────────────────────────────────────────────────────────────────
  const incomeData = [
    { reference: 'INC-001', source: 'Luca Rossi - GEB01',          category: 'Tuition',       amount: 800,  date: new Date('2025-01-10'), method: 'Bank Transfer', notes: 'Full payment received' },
    { reference: 'INC-002', source: 'Sofia Garcia - IEL01',         category: 'Tuition',       amount: 1500, date: new Date('2025-01-14'), method: 'Card',          notes: 'Full payment received' },
    { reference: 'INC-003', source: 'Ahmed Hassan - BE01',          category: 'Tuition',       amount: 1200, date: new Date('2025-01-15'), method: 'Bank Transfer', notes: 'Full payment received' },
    { reference: 'INC-004', source: 'Sunrise Homestay - Jan',       category: 'Accommodation', amount: 720,  date: new Date('2025-01-01'), method: 'Bank Transfer', notes: 'Jan accommodation fee x4 weeks' },
    { reference: 'INC-005', source: 'Central City Rooms - Jan',     category: 'Accommodation', amount: 840,  date: new Date('2025-01-01'), method: 'Bank Transfer', notes: 'Jan accommodation fee x4 weeks' },
    { reference: 'INC-006', source: 'Marie Dupont - CON01',         category: 'Tuition',       amount: 600,  date: new Date('2025-01-18'), method: 'Cash',          notes: 'Full payment received' },
    { reference: 'INC-007', source: 'Fatima Al-Rashid - GEP01',     category: 'Tuition',       amount: 900,  date: new Date('2025-02-10'), method: 'Card',          notes: 'Full payment received' },
    { reference: 'INC-008', source: 'Priya Patel - YLE01',          category: 'Tuition',       amount: 500,  date: new Date('2025-02-15'), method: 'Bank Transfer', notes: 'Full payment received' },
    { reference: 'INC-009', source: 'Enrolment Admin Fees - Feb',   category: 'Admin Fee',     amount: 350,  date: new Date('2025-02-01'), method: 'Card',          notes: 'Admin fees 7 students x £50' },
    { reference: 'INC-010', source: 'Nguyen Van Minh - CAM01 part', category: 'Tuition',       amount: 900,  date: new Date('2025-03-10'), method: 'Card',          notes: 'Partial payment - £900 of £1800' },
  ];
  await Income.insertMany(incomeData);
  console.log(`Created ${incomeData.length} income records`);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('Admin login:   admin@school.com / Admin1234');
  console.log('Teacher login: sarah.johnson@school.com / Password123');
  console.log('Student login: luca.rossi@email.com / Password123');
  console.log('─────────────────────────────────────────');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
