import mongoose from "mongoose";

/**
 * Kallar Central Sports Club — free tuition programme.
 * There is deliberately no Payment model and no fee field anywhere: classes are free.
 */

const GRADES = [3, 4, 5];

/**
 * Two staff roles:
 * - 'admin'        — full access: the LMS (students/batches/attendance/marks/news)
 *                    AND club membership (review/approve/manage Member applications).
 * - 'lms_manager'  — the LMS only. No visibility into Member applications at all —
 *                    not just hidden in the UI, the /api/members* routes reject this
 *                    role server-side too (see lib/auth-guard.ts).
 */
export const USER_ROLES = ['admin', 'lms_manager'] as const;

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: 'lms_manager' },
  isActive: { type: Boolean, default: true },
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
 * Club membership — deliberately separate from Student. Student is the Grade 3-5
 * free tuition roster; Member is general Kallar Central Sports Club membership,
 * open to any age, submitted publicly from the club's landing page and reviewed
 * by an admin (not an lms_manager — see lib/auth-guard.ts).
 */
export const MEMBER_STATUSES = ['pending', 'approved', 'rejected'] as const;

const MemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  // Optional — many club members will be adults and won't have these.
  guardianName: { type: String },
  guardianPhone: { type: String },
  // Not schema-required — 3 members already exist in production from before this
  // field was added, and PATCH (approve/reject) runs with runValidators: true, so
  // a hard-required field here would break reviewing those. Required by the forms
  // and API validation for new submissions instead — see /api/public/members.
  nic: { type: String },
  photoUrl: { type: String },
  photoPublicId: { type: String },
  memberType: { type: String }, // Playing Member / Non-Playing Member / Junior Member / Coach-Staff
  // The card's "MEMBER ID" — generated once, when status first leaves 'pending'
  // for 'approved' (see PATCH /api/members/[id]). sparse: true because pending/
  // rejected applicants never get one.
  memberCode: { type: String, unique: true, sparse: true },
  interest: { type: String }, // free text: which sport/activity they want to join
  message: { type: String }, // whatever the applicant wrote on the public form
  status: { type: String, enum: MEMBER_STATUSES, default: 'pending', index: true },
  reviewNotes: { type: String }, // admin-only notes, e.g. reason for rejection
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });
export const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);

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
