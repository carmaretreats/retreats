import { defineAction } from "astro:actions";
import { Resend } from "resend";
import SampleEmail from "../emails/sampleEmail";
import { render } from "@react-email/render";
import { z } from "astro:schema";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const server = {
  send: defineAction({ 
    accept: "form",
    input: z.object({
        name: z.string().min(1, { message: "Bitte gib deinen Namen ein." }),
        email: z.string().email({ message: "Bitte gib eine gültige E‑Mail-Adresse ein." }),
        lead_message: z.string().min(1, { message: "Bitte gib eine Nachricht ein." }),
        retreat: z.string().optional(),
        accommodation: z.string().optional(),
        // 1. Added schema validation (optional)
        whatsapp: z.string().optional(),
    }),
    // 2. Added whatsapp to the destructuring arguments
    handler: async ({ name, email , lead_message, retreat, accommodation, whatsapp }) => {
      // create the email
      // 3. Passed whatsapp to the email template component
      const emailContent = SampleEmail({ name, email, lead_message, retreat, accommodation, whatsapp });
      const html = await render(emailContent);
      const text = await render(emailContent, {
        plainText: true,
      });

    
      // send an email
      const { data, error } = await resend.emails.send({
        from: "Carma Retreats Lead <retreats@carma-retreats.com>",
        to: ["kontakt@carma-retreats.com"],
        subject: `New message from ${name}.`,
        html,
        text,
      });

      if (error) {
        throw {
            message: "Error sending email",
            issues: [], 
            // 4. Added whatsapp here so the value persists if submission fails
            fields: { name, email, lead_message, retreat, accommodation, whatsapp }
        };
      }
    return data;   
    },
  }),
};