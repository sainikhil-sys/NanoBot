import { z } from "zod";

export const TaskInputSchema = z.object({
  prompt: z
    .string()
    .min(1, "Task description cannot be empty")
    .max(10000, "Task description exceeds maximum length of 10,000 characters"),
  preferredBot: z.string().optional().nullable(),
  file: z
    .object({
      name: z.string(),
      mimeType: z.string(),
      size: z.number().max(25 * 1024 * 1024, "File size cannot exceed 25MB"),
      content: z.string().optional(),
      base64Data: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

export function validateTaskInput(input: unknown): TaskInput {
  return TaskInputSchema.parse(input);
}
