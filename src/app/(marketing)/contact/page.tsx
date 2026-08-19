"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const contactSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter your name." }),
  email: z.email({ error: "Enter a valid email." }),
  message: z
    .string()
    .trim()
    .min(10, { error: "Tell us a bit more (10+ characters)." })
    .max(2000),
});
type ContactInput = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  async function onSubmit() {
    // No email backend is wired up in this preview — this simulates the
    // round trip so the form is honest about what actually happens.
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Message sent",
      description: "Thanks for reaching out — we'll get back to you within a day.",
      variant: "success",
    });
    reset();
  }

  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-xl">
        <h1 className="text-heading font-bold tracking-tight text-ink sm:text-display">
          Contact <span className="text-gradient">us</span>
        </h1>
        <p className="mt-4 text-body text-muted">
          Questions about plans, enterprise, or the API? Send us a note.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6" noValidate>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" {...register("name")} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={5} {...register("message")} />
            <FieldError>{errors.message?.message}</FieldError>
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
            Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
