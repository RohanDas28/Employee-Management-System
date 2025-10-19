import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IAttendance extends Document {
  user: mongoose.Types.ObjectId
  checkIn: Date
  checkOut?: Date
  totalHours?: number
  createdAt: Date
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOut: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Calculate total hours when checking out
AttendanceSchema.pre("save", function (next) {
  if (this.checkOut && this.checkIn) {
    const diff = this.checkOut.getTime() - this.checkIn.getTime()
    this.totalHours = Number((diff / (1000 * 60 * 60)).toFixed(2))
  }
  next()
})

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema)
