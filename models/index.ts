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
  school: { type: String },
  address: { type: String },
  guardianName: { type: String, required: true },
  guardianPhone: { type: String, required: true },
  grade: { type: Number, required: true, enum: GRADES },
  photoUrl: { type: String },
  qrCode: { type: String, required: true, unique: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  isActive: { type: Boolean, default: true },
  // "KCSC/{batch year}/{0001..}" — human-readable registration ID, distinct from
  // qrCode (the physical-card scan identifier, already printed, never changes).
  // sparse: true because students created before this field existed have none
  // until backfilled (see /api/students/backfill-registration-numbers).
  registrationNumber: { type: String, unique: true, sparse: true },
  // The mid-batch-registration cutoff: a student is only eligible for classes
  // dated on/after this. sparse-by-absence — legacy students with no value are
  // grandfathered (no eligibility gate applied) rather than retroactively
  // excluded from every class that predates this field's existence.
  registrationDate: { type: Date },
  // Lifetime leave count — never resets, ever, even across deactivation/reactivation.
  totalLeaves: { type: Number, default: 0 },
  // Resets to 0 only when a deactivated student is reactivated. Drives the
  // 2-leave/3-leave notification thresholds (see POST /api/attendance).
  currentLeaveCycle: { type: Number, default: 0 },
  // Increments once per reactivation. Scopes Notification uniqueness so the
  // same 2/3-leave warning can legitimately fire again in a new cycle instead
  // of being permanently deduped by the {studentId,type} pair alone.
  cycleGeneration: { type: Number, default: 0 },
}, { timestamps: true });
export const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);

/** Atomic per-year sequence generator for Student.registrationNumber (_id e.g. "regno-2026"). */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
export const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

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
  // Source of truth for "has this specific row already contributed to
  // Student.totalLeaves/currentLeaveCycle" — makes the counter math a pure
  // function of the present->absent transition, so re-toggling the same
  // class back and forth (correcting a mistake) never double- or under-counts.
  countedAsLeave: { type: Boolean, default: false },
  // Snapshot of Student.currentLeaveCycle right after this row first became a
  // leave. Set once, never touched by a later correction — this is what makes
  // the row a true "what the cycle was at the time" permanent ledger entry.
  leaveCycleAtRecord: { type: Number },
  remarks: { type: String },
}, { timestamps: true });
AttendanceSchema.index({ studentId: 1, classId: 1 }, { unique: true });
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

/**
 * Parent-warning (2 leaves) / admin-critical (3 leaves) alerts. Uniqueness is
 * scoped to {studentId, type, cycleGeneration} so the same warning can never
 * fire twice within one leave cycle, but legitimately fires again after a
 * deactivate/reactivate bumps cycleGeneration and the cycle recrosses 2 or 3.
 */
export const NOTIFICATION_TYPES = ['parent_warning', 'admin_critical'] as const;
export const NOTIFICATION_STATUSES = ['pending', 'acknowledged', 'resolved'] as const;

const NotificationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  // Denormalized at creation so the alert list never needs a populate.
  registrationNumber: { type: String },
  studentName: { type: String },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  cycleGeneration: { type: Number, required: true },
  leaveCount: { type: Number, required: true }, // 2 or 3
  leaveDates: [{ type: Date }],
  status: { type: String, enum: NOTIFICATION_STATUSES, default: 'pending' },
}, { timestamps: true });
NotificationSchema.index({ studentId: 1, type: 1, cycleGeneration: 1 }, { unique: true });
export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

/**
 * A scheduled exam — subject/grade/batch/date/max-marks, created up front as its
 * own record so staff can click into it any time afterward to add or correct
 * individual students' marks (POST /api/exams/[id]/marks), rather than marks only
 * ever existing as a side effect of a one-shot bulk upload.
 */
const ExamSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  grade: { type: Number, required: true, enum: GRADES },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  examDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  name: { type: String }, // optional friendly label, e.g. "Mid-term"
}, { timestamps: true });
export const Exam = mongoose.models.Exam || mongoose.model("Exam", ExamSchema);

const MarksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  examName: { type: String },
  examDate: { type: Date, required: true },
  // Not required when isAbsent is true — an absent student has no score to
  // record; stored as 0 in that case so every consumer that reads marks as a
  // number keeps working, with isAbsent as the actual signal to exclude them
  // from averages (see the reduce loops in students/[id], analysis, and exams).
  marks: { type: Number, required: function (this: { isAbsent?: boolean }) { return !this.isAbsent; }, default: 0 },
  isAbsent: { type: Boolean, default: false },
  maxMarks: { type: Number, required: true },
  grade: { type: Number, required: true, enum: GRADES },
  // Not required — existing Marks documents predate this field, and POST
  // /api/marks upserts by {studentId, subject, examDate}, so a hard-required
  // field would break re-saving old records (same reasoning as Member.nic).
  // A grade can have more than one active batch at once (e.g. a new intake
  // starting while an older one is still running), so grade alone doesn't
  // uniquely scope an exam's roster — this does.
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  // Not required — same reasoning as batchId above: rows predating the Exam
  // model (see /api/exams/backfill) have no exam to point at. Every mark
  // written through /api/exams/[id]/marks always sets this and denormalizes
  // subject/examDate/maxMarks/grade/batchId from the parent Exam, so nothing
  // that already queries those flat fields (analysis, dashboard stats, the
  // student profile page) needs to change.
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
}, { timestamps: true });
// sparse: only documents that HAVE examId participate in this uniqueness check,
// so pre-migration rows (no examId) never collide with it or with each other.
MarksSchema.index({ examId: 1, studentId: 1 }, { unique: true, sparse: true });
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
  age: { type: Number },
  gender: { type: String },
  whatsapp: { type: String },
  dateOfJoining: { type: Date },
  previousClub: { type: String },
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
  // Not required at the schema level — under-16 applicants don't need one
  // (see lib/membership.ts's isNicRequired), enforced by the forms/API instead.
  nic: { type: String },
  // Spaces asset — photoPublicId is what lets a delete actually remove it from
  // the bucket too (same url/publicId pairing Post uses for its images).
  photoUrl: { type: String },
  photoPublicId: { type: String },
  memberType: { type: String }, // Playing Member / Non-Playing Member / Junior Member / Coach-Staff
  // Occupation category, drives the annual fee (lib/membership.ts) — 'job' is
  // the resolved display text (the category label, or the free-typed value
  // when jobCategory is 'other'); jobCategory is what the fee is computed from.
  job: { type: String },
  jobCategory: { type: String },
  annualFee: { type: Number },
  // Proof of the bank transfer for the current membership period.
  paymentSlipUrl: { type: String },
  paymentSlipPublicId: { type: String },
  // The current membership period — set (and reset, on renewal) to one year
  // from whenever an application or renewal is approved (lib/membership.ts).
  validFrom: { type: Date },
  validUntil: { type: Date },
  // A renewal request sits here, separate from the fields above, so an
  // existing membership stays untouched while a renewal awaits verification.
  renewalStatus: { type: String, enum: ['none', 'pending'], default: 'none' },
  renewalJob: { type: String },
  renewalJobCategory: { type: String },
  renewalAnnualFee: { type: Number },
  renewalPaymentSlipUrl: { type: String },
  renewalPaymentSlipPublicId: { type: String },
  renewalSubmittedAt: { type: Date },
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

/**
 * Standalone club gallery — deliberately separate from Post.images.
 * Organized into Folders (Albums) which contain multiple images.
 */
export const GalleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  caption: { type: String },
}, { timestamps: true });

const GalleryFolderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  coverImageUrl: { type: String },
  coverImagePublicId: { type: String },
  images: { type: [GalleryImageSchema], default: [] },
}, { timestamps: true });

// Keeping GalleryImage model around so we can migrate legacy images
export const GalleryImage = mongoose.models.GalleryImage || mongoose.model("GalleryImage", GalleryImageSchema);
export const GalleryFolder = mongoose.models.GalleryFolder || mongoose.model("GalleryFolder", GalleryFolderSchema);
