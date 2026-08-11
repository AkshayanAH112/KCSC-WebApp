import mongoose from "mongoose";

/**
 * Kallar Central Sports Club — free tuition programme.
 * There is deliberately no Payment model and no fee field anywhere: classes are free.
 */

const GRADES = [3, 4, 5];

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });
export const User = mongoose.models.User || mongoose.model("User", UserSchema);

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  guardianName: { type: String, required: true },
  guardianPhone: { type: String, required: true },
  grade: { type: Number, required: true, enum: GRADES },
  dateOfBirth: { type: Date, required: true },
  photoUrl: { type: String },
  qrCode: { type: String, required: true, unique: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
export const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  grades: [{ type: Number, enum: GRADES }]
}, { timestamps: true });
export const Batch = mongoose.models.Batch || mongoose.model("Batch", BatchSchema);

const ClassSessionSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  grade: { type: Number, required: true, enum: GRADES },
  date: { type: Date, required: true },
  time: { type: String },
  subject: { type: String },
}, { timestamps: true });
export const ClassSession = mongoose.models.ClassSession || mongoose.model("ClassSession", ClassSessionSchema);

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
  present: { type: Boolean, default: false },
  date: { type: Date, required: true },
}, { timestamps: true });
AttendanceSchema.index({ studentId: 1, classId: 1 }, { unique: true });
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

const MarksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  examName: { type: String },
  examDate: { type: Date, required: true },
  marks: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  grade: { type: Number, required: true, enum: GRADES },
}, { timestamps: true });
export const Marks = mongoose.models.Marks || mongoose.model("Marks", MarksSchema);

/**
 * Blog / news posts surfaced on the public landing page (built separately).
 * Images live in Cloudinary; only the secure URL and the public_id are stored here —
 * the public_id is what lets a delete actually remove the asset from Cloudinary too.
 */
export const POST_CATEGORIES = ['news', 'blog', 'event', 'achievement'] as const;

const PostImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  caption: { type: String },
}, { _id: false });

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: { type: String },
  content: { type: String, required: true },
  coverImageUrl: { type: String },
  coverImagePublicId: { type: String },
  images: { type: [PostImageSchema], default: [] },
  category: { type: String, enum: POST_CATEGORIES, default: 'news' },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  author: { type: String, default: 'KCSC' },
  publishedAt: { type: Date },
}, { timestamps: true });
export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
