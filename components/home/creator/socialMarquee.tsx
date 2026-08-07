import React from "react";
import {
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function SocialMarquee() {
  return (
    <div className="overflow-hidden whitespace-nowrap py-6">
      <div className="flex w-100 animate-marquee items-center gap-12">
        {/* First set */}
        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaInstagram  className="text-pink-500"/>
          <span className="text-zinc-500 text-xl">Instagram</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaTiktok  className="text-black"/>
          <span className="text-zinc-500 text-xl">TikTok</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaYoutube className="text-red-600"/>
          <span className="text-zinc-500 text-xl">YouTube</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaXTwitter className="text-black" />
          <span className="text-zinc-500 text-xl">Twitter</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaLinkedin className="text-blue-500" />
          <span className="text-zinc-500 text-xl">LinkedIn</span>
        </div>

        {/* Duplicate for infinite loop */}
        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaInstagram  className="text-pink-500"/>
          <span className="text-zinc-500 text-xl">Instagram</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaTiktok  className="text-black"/>
          <span className="text-zinc-500 text-xl">TikTok</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaYoutube className="text-red-600"/>
          <span className="text-zinc-500 text-xl">YouTube</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaXTwitter className="text-black" />
          <span className="text-zinc-500 text-xl">Twitter</span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-semibold">
          <FaLinkedin className="text-blue-500" />
          <span className="text-zinc-500 text-xl">LinkedIn</span>
        </div>
      </div>
    </div>
  );
}