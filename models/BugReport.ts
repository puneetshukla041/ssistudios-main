// models/BugReport.ts
import mongoose, { Schema, Document } from 'mongoose';
import Counter, { ICounter } from './Counter'; // Assuming you'll create a Counter model for auto-incrementing

export interface IBugReport extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  username: string;
  description: string;
  ticketNumber: number;
  status: 'Open' | 'InProgress' | 'Closed';
  createdAt: Date;
}

const BugReportSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Reference to your User model
  },
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  ticketNumber: {
    type: Number,
    unique: true,
  },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'],
    default: 'Open',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to auto-increment the ticket number
BugReportSchema.pre<IBugReport>('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'bugTicket' },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
      );
      this.ticketNumber = 200 + counter.sequenceValue;
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

const BugReport = mongoose.models.BugReport || mongoose.model<IBugReport>('BugReport', BugReportSchema);

export default BugReport;