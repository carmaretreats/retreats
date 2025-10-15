import { defineAction } from "astro:actions";
import { Resend } from "resend";
import SampleEmail from "../emails/sampleEmail";
import { render } from "@react-email/render";
import { z } from "astro:schema";

// const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const server = {
  send: defineAction({ 
    accept: "form",
    input: z.object({
        name: z.string().min(1, { message: "Bitte gib deinen Namen ein." }),
        email: z.string().email({ message: "Bitte gib eine gültige E‑Mail-Adresse ein." }),
        lead_message: z.string().min(5, { message: "Bitte schreibe eine Nachricht mit mindestens 5 Zeichen." }),
        retreat: z.string().optional(),
        accommodation: z.string().optional(),
    }),
    handler: async ({ name, email , lead_message, retreat, accommodation}) => {
    console.log("🌱 Form received:", name); // 👈🏽 esto
      // create the email
      const emailContent = SampleEmail({ name, email, lead_message, retreat, accommodation });
      const html = await render(emailContent);
      const text = await render(emailContent, {
        plainText: true,
      });

      // send an email
    //   const { data, error } = await resend.emails.send({
    //     from: "Carma Retreats Lead <retreats@carma-retreats.com>",
    //     to: ["carma.retreats.netlify@gmail.com"],
    //     subject: `New message from ${name}.`,
    //     html,
    //     text,
    //   });

      if (error) {
        throw error;
      }
    // return data;
    },
  }),
};