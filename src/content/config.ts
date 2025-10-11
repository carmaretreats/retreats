// src/content/config.ts
import { defineCollection, z } from 'astro:content';

// Define schemas for each section type
const heroSchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  left_image: z.string().optional(), // These will be paths to images in /public/uploads
  right_image: z.string().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
});

const retreatLeftSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
});

const contactSectionSchema = z.object({
  main_text: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
});

const roomAccordionItemSchema = z.object({
  heading: z.string(),
  content: z.string(), // Markdown will come in as string
  image: z.string().optional(),
});

const roomAccordionSchema = z.object({
  title: z.string().optional(),
  items: z.array(roomAccordionItemSchema),
});

const carouselImageSchema = z.object({
  image: z.string(),
  caption: z.string().optional(),
});

const carouselSchema = z.object({
  title: z.string().optional(),
  images: z.array(carouselImageSchema),
});

// Main sections collection schema
const sections = defineCollection({
  type: 'data', // Use 'data' for JSON/YAML/frontmatter-only content
  schema: z.object({
    title: z.string(), // Internal CMS title
    is_visible: z.boolean().default(true),
    section_type: z.enum(["Hero", "RetreatLeft", "ContactSection", "RoomAccordion", "Carousel"]),
    data: z.object({
      hero_content: heroSchema.optional(),
      retreat_left_content: retreatLeftSchema.optional(),
      contact_section_content: contactSectionSchema.optional(),
      room_accordion_content: roomAccordionSchema.optional(),
      carousel_content: carouselSchema.optional(),
      // Add other section schemas here
    }),
  }),
});

export const collections = { sections };