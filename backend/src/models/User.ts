import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional: users who sign up via Google never set a password.
    passwordHash: { type: String, required: false },
    // Optional + sparse unique: only Google-authenticated users have this,
    // and multiple users without one shouldn't collide on `null`.
    googleId: { type: String, required: false, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    // Hash of the current reset token, not the raw token — same
    // principle as passwordHash: never store the secret itself.
    resetPasswordTokenHash: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
