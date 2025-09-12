import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITemplate extends Document {
  templateName: string;
  image: Buffer;        // binary data
  contentType: string;    // image type (png, jpg etc.)
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    templateName: { type: String, required: true, unique: true },
    image: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    ownerId: { type: String, required: true },
  },
  { timestamps: true }
);

const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;