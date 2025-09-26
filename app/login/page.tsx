"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/custom-ui/button"
import SmartInputBox from "@/components/custom-ui/input-box"
import { loginUser } from "@/lib/auth-api"
import { useToast } from "@/components/custom-ui/toast-provider"
import { useUser } from "@/hooks/usercontext"

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("userCredentials");
    if (savedCredentials) {
      try {
        const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
        setUsername(savedUsername || "");
        setPassword(savedPassword || "");
      } catch (error) {
        console.error("Failed to parse saved credentials:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log("✅ User is already authenticated. Redirecting to dashboard...");
      window.location.href = "/dashboard";
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 Form submitted. Username:", username, "Password: [HIDDEN]");

    setIsSubmitting(true);
    console.log("⏳ Starting login process...");
    try {
      console.log("🔐 Sending login request for username:", username);
      const success = await loginUser(username, password);
      if (success) {
        // Automatically save credentials to localStorage
        localStorage.setItem("userCredentials", JSON.stringify({ username, password }));

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } else {
        console.log("❌ Login failed. Invalid username or password.");
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("❌ Error during login:", error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      console.log("🔚 Login process completed. Resetting submission state.");
      setIsSubmitting(false);
    }
  };

  // Prevent pasting in password field
  const handlePasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    // toast({
    //   title: "Paste Disabled",
    //   description: "Pasting is not allowed in the password field.",
    //   type: "default",
    // });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-xl shadow-lg bg-white">
        <div className="hidden sm:flex w-1/2 items-center justify-center">
          <Image
            src="/snail.png"
            alt="Login Illustration"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>

        {/* Login Form */}
        <div className="w-full sm:w-1/2 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-sm text-gray-500">Enter your credentials to sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full p-2 text-md text-gray-900 border border-gray-300 rounded-md text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                required
              />
            </div>
            
            {/* Password Input with Toggle */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onPaste={handlePasswordPaste} // Prevent pasting
                  placeholder="Enter your password"
                  className="w-full p-2 text-md text-gray-900 border border-gray-300 rounded-md text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Image src="/hide.png" alt="Hide password" width={20} height={20} />
                  ) : (
                    <Image src="/view.png" alt="Show password" width={20} height={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-zinc-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l4-4-4-4v4a12 12 0 100 24v-4l-4 4 4 4v-4a8 8 0 01-8-8z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}