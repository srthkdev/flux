'use client';

import { SignUp } from "@clerk/nextjs";
import { BorderBeam } from "@/components/magicui/border-beam";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <BorderBeam
          className="opacity-70"
          size={250}
          delay={0.5}
          colorFrom="#3b82f6"
          colorTo="#8b5cf6"
        />
        <SignUp />
      </div>
    </div>
  );
} 