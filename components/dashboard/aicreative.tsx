"use client";

import React from "react";
import { Wrench, AlertTriangle } from "lucide-react";

export default function AICreative() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
        <Wrench className="text-gray-700" size={22} />
        Creative AI
      </h2>

      <div className="p-8 rounded-xl bg-gray-100 border border-gray-300 shadow-xl text-center">
        <div className="flex flex-col items-center">
          <AlertTriangle className="text-yellow-600 mb-4" size={48} />
          <h3 className="text-2xl font-bold mb-2 text-gray-900">
            Feature Under Maintenance
          </h3>
          <p className="text-gray-600 max-w-md">
            Our Creative AI generator is currently being improved.  
            Please check back soon for new and exciting updates!
          </p>
        </div>
      </div>
    </section>
  );
}
