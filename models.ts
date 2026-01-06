import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URL!);

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["teacher", "student"],
    required: true
  }
});

const ClassSchema = new mongoose.Schema({
  className: String,
  teacherId: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
    validate: {
      validator: async function (userId: mongoose.Types.ObjectId) {
        const user = await mongoose.model("Users").findById(userId);
        return user?.role === "teacher";
      },
      message: "Class can only be taught for users with role 'teacher'"
    }
  },
  studentIds: [{
    type: mongoose.Types.ObjectId,
    ref: "Users",
    validate: {
      validator: async function (userId: mongoose.Types.ObjectId) {
        const user = await mongoose.model("Users").findById(userId);
        return user?.role === "student";
      },
      message: "Attendance can only be marked for users with role 'student'"
    }
  }],
});
const AttendanceSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["present", "absent"]
  },
  classId: {
    type: mongoose.Types.ObjectId,
    ref: "Classes"
  },
  studentId: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
    validate: {
      validator: async function (userId: mongoose.Types.ObjectId) {
        const user = await mongoose.model("Users").findById(userId);
        return user?.role === "student";
      },
      message: "Attendance can only be marked for users with role 'student'"
    }
  }
});

export const UserModel = mongoose.model("Users", UserSchema);
export const ClassModel = mongoose.model("Classes", ClassSchema);
export const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);