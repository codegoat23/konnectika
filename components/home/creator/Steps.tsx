import {
  Award,
  BadgeCheck,
  Phone,
  FileText,
  ShieldCheck,
  Compass,
  Camera,
  Wallet,
} from "lucide-react";
import { Reveal } from "../Reveal";

const trustItems = [
  {
    number: "01",
    title: "Discover",
    description:
      "Find campaigns matching your skills and audience.",
    color: "bg-orange-50",
    pin: "bg-orange-500",
    icon: <Compass className="w-6 h-6" />,
    rotate: "-rotate-6",
    side: "left",
  },
  {
    number: "02",
    title: "Create",
    description:
      "Submit authentic content for brands.",
    color: "bg-blue-50",
    pin: "bg-blue-500",
    icon: <Camera className="w-6 h-6" />,
    rotate: "rotate-6",
    side: "right",
  },
  {
    number: "03",
    title: "Reward",
    description:
      "Earn money from successful collaborations",
    color: "bg-violet-50",
    pin: "bg-violet-500",
    icon: <Wallet className="w-6 h-6" />,
    rotate: "-rotate-6",
    side: "left",
  },
  {
    number: "04",
    title: "Case Studies",
    description:
      "Explain how you've solved real problems and highlight measurable results.",
    color: "bg-orange-50",
    pin: "bg-orange-500",
    icon: <FileText className="w-6 h-6" />,
    rotate: "rotate-6",
    side: "right",
  },

];

export default function CreatorSteps() {
  return (
    <section className="relative overflow-hidden bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-24 text-center">
          <span className="rounded-full border border-zinc-200/50 bg-zinc-100/30 px-4 py-2 text-sm font-semibold text-black">
            How it works
          </span>

          <h2 className="mt-6 text-5xl font-black tracking-tight text-black sm:text-6xl">
            Four
steps
from
<br/>
brief
to
content<br/>
that &nbsp;
<span className="bg-orange-500 text-white px-6 rounded-full">converts</span>

          
          </h2>
        </div>

        <div className="relative  p-10">

<Reveal> {trustItems.map((item) => (
            <div
              key={item.number}
              className={`flex ${
                item.side === "left"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`relative w-[340px] rounded-[36px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] ${item.rotate}`}
              >
                {/* Pin */}
                <div
                  className={`absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full ${item.pin} shadow-lg`}
                />

                {/* Card */}
                <div className={`rounded-3xl p-6 ${item.color}`}>
                  <p className="text-3xl font-light text-zinc-500">
                    {item.number}
                  </p>

                  <div className="my-5 text-black">{item.icon}</div>

                  <h3 className="text-3xl font-bold text-black">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-zinc-600 leading-7">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}</Reveal>       
         
        </div>
      </div>
    </section>
  );
}