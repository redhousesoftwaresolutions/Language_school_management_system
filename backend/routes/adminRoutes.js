const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

const {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  uploadStudentImage,
  uploadStudentDoc, deleteStudentDoc,
} = require('../controllers/studentController');

const {
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher,
  uploadTeacherImage,
  uploadTeacherDoc, deleteTeacherDoc,
} = require('../controllers/teacherController');

const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

const {
  getAccommodations, getAccommodation, createAccommodation, updateAccommodation, deleteAccommodation,
  uploadAccommodationImage, deleteAccommodationImage,
} = require('../controllers/accommodationController');

const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');

const {
  getEntries, createEntry, updateEntry, deleteEntry,
  getHolidays, createHoliday, deleteHoliday,
} = require('../controllers/timetableController');

const {
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getPayments, createPayment, updatePayment, deletePayment,
  getIncomes,  createIncome,  updateIncome,  deleteIncome,
  getExpenses, createExpense, updateExpense, deleteExpense,
  uploadExpenseDoc, deleteExpenseDoc,
} = require('../controllers/financeController');
const createUpload = require('../middleware/upload');
const { image: createImageUpload } = require('../middleware/upload');

const { getSchool, updateSchool } = require('../controllers/schoolController');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/calendarController');

const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Invoice = require('../models/Invoice');

// All admin routes require login + admin role
router.use(protect, adminOnly);

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const [studentCount, staffCount, courseCount, invoices] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Course.countDocuments(),
      Invoice.find()
    ]);

    const invoiceTotal = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidTotal = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingTotal = invoices
      .filter((inv) => inv.status === 'Pending')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    res.json({
      students: studentCount,
      staff: staffCount,
      courses: courseCount,
      invoices: {
        count: invoices.length,
        total: invoiceTotal,
        paid: paidTotal,
        pending: pendingTotal
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Students ─────────────────────────────────────────────────────────────────

router.route('/students')
  .get(getStudents)
  .post(createStudent);

router.route('/students/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

router.post('/students/:id/image', createImageUpload('profiles/students').single('file'), uploadStudentImage);
router.post('/students/:id/documents', createUpload('students').single('file'), uploadStudentDoc);
router.delete('/students/:id/documents/:docId', deleteStudentDoc);

// ─── Staff (Teachers) ─────────────────────────────────────────────────────────

router.route('/staff')
  .get(getTeachers)
  .post(createTeacher);

router.route('/staff/:id')
  .get(getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.post('/staff/:id/image', createImageUpload('profiles/teachers').single('file'), uploadTeacherImage);
router.post('/staff/:id/documents', createUpload('teachers').single('file'), uploadTeacherDoc);
router.delete('/staff/:id/documents/:docId', deleteTeacherDoc);

// ─── Courses ──────────────────────────────────────────────────────────────────

router.route('/courses')
  .get(getCourses)
  .post(createCourse);

router.route('/courses/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

// ─── Finance: Invoices ────────────────────────────────────────────────────────

router.route('/finance/invoices')
  .get(getInvoices)
  .post(createInvoice);

router.route('/finance/invoices/:id')
  .put(updateInvoice)
  .delete(deleteInvoice);

// ─── Finance: Payments ────────────────────────────────────────────────────────

router.route('/finance/payments')
  .get(getPayments)
  .post(createPayment);

router.route('/finance/payments/:id')
  .put(updatePayment)
  .delete(deletePayment);

// ─── Finance: Income ──────────────────────────────────────────────────────────

router.route('/finance/income')
  .get(getIncomes)
  .post(createIncome);

router.route('/finance/income/:id')
  .put(updateIncome)
  .delete(deleteIncome);

// ─── Finance: Expenses ────────────────────────────────────────────────────────

router.route('/finance/expenses')
  .get(getExpenses)
  .post(createExpense);

router.route('/finance/expenses/:id')
  .put(updateExpense)
  .delete(deleteExpense);

router.post('/finance/expenses/:id/documents', createUpload('expenses').single('file'), uploadExpenseDoc);
router.delete('/finance/expenses/:id/documents/:docId', deleteExpenseDoc);

// ─── Accommodation ────────────────────────────────────────────────────────────

router.route('/accommodation')
  .get(getAccommodations)
  .post(createAccommodation);

router.route('/accommodation/:id')
  .get(getAccommodation)
  .put(updateAccommodation)
  .delete(deleteAccommodation);

router.post('/accommodation/:id/images', createImageUpload('accommodation').single('file'), uploadAccommodationImage);
router.delete('/accommodation/:id/images/:imgId', deleteAccommodationImage);

// ─── Rooms ────────────────────────────────────────────────────────────────────

router.route('/rooms')
  .get(getRooms)
  .post(createRoom);

router.route('/rooms/:id')
  .put(updateRoom)
  .delete(deleteRoom);

// ─── Timetable Entries ────────────────────────────────────────────────────────

router.route('/timetable')
  .get(getEntries)
  .post(createEntry);

router.route('/timetable/:id')
  .put(updateEntry)
  .delete(deleteEntry);

// ─── Holidays ─────────────────────────────────────────────────────────────────

router.route('/holidays')
  .get(getHolidays)
  .post(createHoliday);

router.route('/holidays/:id')
  .delete(deleteHoliday);

// ─── School Details ────────────────────────────────────────────────────────────

router.route('/school')
  .get(getSchool)
  .put(updateSchool);

// ─── Calendar Events ───────────────────────────────────────────────────────────

router.route('/calendar')
  .get(getEvents)
  .post(createEvent);

router.route('/calendar/:id')
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router;
