"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [status, setStatus] = useState("Checking Supabase connection...");

  useEffect(() => {
    const testConnection = async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("connection_test")
        .select("*")
        .limit(1);

      if (error) {
        setStatus(`Supabase connected, but test table is not ready yet.`);
        console.log("Supabase response:", error);
      } else {
        setStatus("✅ Supabase connection successful!");
      }
    };

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          C.T. Model School
        </h1>

        <p className="mt-4 text-lg">
          {status}
        </p>
      </div>
    </main>
  );
}