import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IMessage extends Document {
  from: mongoose.Types.ObjectId
  toUser?: mongoose.Types.ObjectId
  toDepartment?: mongoose.Types.ObjectId
  subject: string
  body: string
  read: boolean
  createdAt: Date
  parentMessage?: mongoose.Types.ObjectId
  rootMessage?: mongoose.Types.ObjectId
  replies: IMessage[]
}

const MessageSchema = new Schema<IMessage>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    toDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    rootMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  },
)

MessageSchema.virtual("replies", {
  ref: "Message",
  localField: "_id",
  foreignField: "parentMessage",
})

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
