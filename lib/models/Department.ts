import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IDepartment extends Document {
  name: string
  description: string
  users: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
)

export const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema)
