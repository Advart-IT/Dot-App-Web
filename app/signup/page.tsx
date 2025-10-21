"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/custom-ui/toast-provider";
import { signupUser } from "@/lib/auth-api";
import { completeInviteRegistration } from "@/lib/registration/register";
import { Button } from "@/components/custom-ui/button";
import SmartInputBox from "@/components/custom-ui/input-box";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInviteSignup, setIsInviteSignup] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check for invite parameters on component mount
  useEffect(() => {
    const token = searchParams.get('token');
    const employee_id = searchParams.get('employee_id');
    
    console.log('URL parameters:', { token, employee_id });
    
    if (token && employee_id) {
      setIsInviteSignup(true);
      setInviteToken(token);
      setEmployeeId(employee_id);
      console.log('Invite signup mode enabled');
    } else {
      setIsInviteSignup(false);
      console.log('Regular signup mode');
    }
  }, [searchParams]);

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setIsSubmitting(true);

    try {
      if (isInviteSignup) {
        // Handle invite-based registration
        await completeInviteRegistration(inviteToken, username, password);
        toast({
          title: "Registration Completed!",
          description: "Your account has been successfully created from the invitation.",
        });
      } else {
        // Handle regular signup
        await signupUser(username, password);
        toast({
          title: "Account Created!",
          description: "Your account has been successfully created.",
        });
      }
      router.push("/login");
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: isInviteSignup ? "Registration Failed" : "Signup Failed",
        description: error instanceof Error ? error.message : "An error occurred while creating your account. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-xl shadow-lg bg-white">
        {/* Left: Signup Form */}
        <div className="w-full sm:w-1/2">
          <Card className="h-full rounded-none border-none shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
    Create an account
              </CardTitle>
              <CardDescription>
                Enter your information to create an account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <SmartInputBox
                    value={username}
                    onChange={setUsername}
                    required
                    inputClassName="w-full p-2 text-md text-gray-900 border border-gray-300 rounded-md text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <SmartInputBox
                    value={password}
                    onChange={setPassword}
                    required
                    inputClassName="w-full p-2 text-md text-gray-900 border border-gray-300 rounded-md text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <SmartInputBox
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    required
                    inputClassName="w-full p-2 text-md text-gray-900 border border-gray-300 rounded-md text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isInviteSignup ? "Completing registration..." : "Creating account..."}
                    </>
                  ) : (
                    isInviteSignup ? "Complete Registration" : "Create account"
                  )}
                </Button>

                {/* Show login link only for regular signup */}
                {!isInviteSignup && (
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </div>
                )}
                
                {/* Show info for invite signup */}
                {isInviteSignup && (
                  <div className="text-center text-sm text-gray-600">
                    <p className="mt-1">
                      Already have an account?{" "}
                      <Link href="/login" className="text-primary hover:underline">
                        Sign in instead
                      </Link>
                    </p>
                  </div>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right: Image */}
        <div className="hidden sm:flex w-1/2 items-center justify-center">
          <Image
            src="/bulb.png"
            alt="Signup Illustration"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
