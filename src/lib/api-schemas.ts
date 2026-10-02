import { z } from "zod";
import { MAX_BATCH_SIZE, MAX_NAME_LENGTH } from "./limits";

export { MAX_BATCH_SIZE, MAX_NAME_LENGTH };

export const convertBodySchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
    names: z.array(z.string().trim().min(1).max(MAX_NAME_LENGTH)).max(MAX_BATCH_SIZE).optional(),
  })
  .refine((v) => v.name || (v.names && v.names.length > 0), {
    message: "Provide either \"name\" or a non-empty \"names\" array",
  });

export type ConvertBody = z.infer<typeof convertBodySchema>;
