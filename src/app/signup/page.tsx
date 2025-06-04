"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("User Created Successfully!");
      router.push("/signin");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-[#121212] p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Create an account</h2>
        <p className="text-sm text-gray-400 mb-6">
          Join SkillSwap to start exchanging knowledge with peers
        </p>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full px-4 py-2 rounded-md bg-black border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-white"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm flex justify-between">
              Password
              <span className="text-gray-400 text-xs cursor-pointer hover:underline">
                Forgot password?
              </span>
            </label>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 rounded-md bg-black border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-white"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 rounded-md bg-black border border-gray-700 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-white"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleSignUp}
            className="w-full bg-white text-black py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-700" />
          <span className="mx-4 text-gray-500 text-sm">OR CONTINUE WITH</span>
          <hr className="flex-grow border-gray-700" />
        </div>

        <div className="flex gap-4">
          <button className="flex-1 flex items-center justify-center border border-gray-700 rounded-md py-2 hover:bg-white hover:text-black transition">
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
            Google
          </button>
          <button className="flex-1 flex items-center justify-center border border-gray-700 rounded-md py-2 hover:bg-white hover:text-black transition">
            <img src="/facebook-icon.svg" alt="Facebook" className="w-5 h-5 mr-2" />
            Facebook
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/signin")}
            className="text-white hover:underline cursor-pointer"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
