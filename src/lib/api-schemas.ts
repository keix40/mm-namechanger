import { z } from "zod";

export const MAX_NAME_LENGTH = 120;
export const MAX_BATCH_SIZE = 200;

export const convertBodySchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
    names: z.array(z.string().trim().min(1).max(MAX_NAME_LENGTH)).max(MAX_BATCH_SIZE).optional(),
  })
  .refine((v) => v.name || (v.names && v.names.length > 0), {
    message: "Provide either \"name\" or a non-empty \"names\" array",
  });

export type ConvertBody = z.infer<typeof convertBodySchema>;
