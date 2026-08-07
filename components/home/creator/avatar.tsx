import React from "react";

export default function AvatarList() {
  return (
    <div className="flex -space-x-3">
      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white">
        <img
          src="/avatar/people1.jpg"
          alt="Person 1"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white">
        <img
          src="/avatar/people2.jpg"
          alt="Person 2"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white">
        <img
          src="/avatar/people3.jpg"
          alt="Person 3"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white">
        <img
          src="/avatar/people4.jpg"
          alt="Person 4"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}