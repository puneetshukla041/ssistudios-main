// app/models/Export.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IExport extends Document {
  userId: string;
  username: string;
  fileName: string;
  folder: string;
  mimeType: string;
  fileUrl: string;
  createdAt: Date;
}

const ExportSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    fileName: { type: String, required: true },
    folder: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const Export =
  mongoose.models.Export || mongoose.model<IExport>("Export", ExportSchema);
