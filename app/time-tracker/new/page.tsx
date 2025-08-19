"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewSession() {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    const start = new Date();
    setStartTime(start);

    fetch("/api/time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: start }),
    }).then((res) => {
      if (!res.ok) {
        console.error("Failed to start session");
      }
    });
  }, []);

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="shadow-plate border-border">
        <CardHeader>
          <CardTitle>⏱️ Tracking Time...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium">Session Started</p>
            <p className="text-sm text-muted-foreground">
              {startTime?.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={async () => {
                await fetch("/api/time/stop", { method: "PATCH" });
                router.push("/time-tracker");
              }}
              variant="destructive"
              size="lg"
            >
              Stop Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
