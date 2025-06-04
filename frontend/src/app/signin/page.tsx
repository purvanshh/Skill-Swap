"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import { useRouter } from "next/navigation";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
      router.push("/dashboard"); 
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-[#121212] p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Sign in</h2>
        <p className="text-sm text-gray-400 mb-6">
          Enter your credentials to access your account
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

          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="form-checkbox text-white bg-black border-gray-600"
            />
            <label htmlFor="rememberMe">Remember me</label>
          </div>

          <button
            onClick={handleSignIn}
            className="w-full bg-white text-black py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Sign in
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
          Don&apos;t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-white hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signin;
