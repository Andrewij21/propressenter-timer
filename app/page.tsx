/** @format */

"use client";
import { useState, useEffect, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

interface TimerId {
  uuid: string;
  name: string;
  index: number;
}

interface Timer {
  id: TimerId;
  time: string; // format "HH:MM:SS"
  state: "running" | "stopped" | "overran" | "overrunning" | "complete";
}

export default function TimerDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<Timer[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PROPRESENTER_API_URL}/v1/timers/current?chunked=false`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // console.log({ data });
        setError(null);
        setTimers(data);
      } catch (err) {
        setError((err as Error).message);
        // console.error(err);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  const handleStartTimer = useCallback(async (timer: Timer) => {
    try {
      // Body sesuai contoh yang Anda berikan
      const body = {
        id: timer.id,
        allows_overrun: true,
        countdown: {
          duration: 300,
        },
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PROPRESENTER_API_URL}/v1/timer/${timer.id.index}/start`,
        {
          method: "PUT", // Diubah ke PUT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body), // Menambahkan body
        }
      );
      if (!res.ok) throw new Error("Failed to start timer");
    } catch (err) {
      console.error("Error starting timer:", err);
      setError((err as Error).message);
    }
  }, []);

  const handleStopTimer = useCallback(async (timer: Timer) => {
    try {
      // Body untuk stop disamakan dengan body start sesuai dokumentasi
      const body = {
        id: timer.id,
        allows_overrun: true,
        countdown: {
          duration: 300, // Nilai ini mungkin tidak relevan untuk stop, tapi kita ikuti format
        },
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PROPRESENTER_API_URL}/v1/timer/${timer.id.index}/stop`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body), // Mengirim body lengkap
        }
      );
      if (!res.ok) throw new Error("Failed to stop timer");
    } catch (err) {
      console.error("Error stopping timer:", err);
      setError((err as Error).message);
    }
  }, []);
  const getStateStyles = (state: string) => {
    switch (state) {
      case "running":
      case "complete":
        return {
          bgColor:
            "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
          textColor: "text-green-900 dark:text-green-100",
          badgeColor: "bg-green-500 text-white",
        };
      case "overrunning":
      case "overran":
        return {
          bgColor:
            "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
          textColor: "text-red-900 dark:text-red-100",
          badgeColor: "bg-red-500 text-white",
        };
      case "stopped":
        return {
          bgColor:
            "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
          textColor: "text-amber-900 dark:text-amber-100",
          badgeColor: "bg-amber-500 text-white",
        };
      default:
        return {
          bgColor:
            "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          textColor: "text-gray-900 dark:text-white",
          badgeColor: "bg-gray-500 text-white",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-end mb-6 sm:mb-8">
          {/* <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Timer GMS Lampung
          </h1> */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-2xl p-8 text-center max-w-md">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ProPresenter is not connected!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Please wait or contact the Multimedia volunteer
                </p>
              </div>
            </div>
          ) : (
            <>
              {timers.map((timer) => {
                const styles = getStateStyles(timer.state);
                // if (
                //   timer.state === "overran" ||
                //   timer.state === "stopped" ||
                //   timer.state === "complete"
                // )
                //   return;
                return (
                  <div
                    key={timer.id.uuid}
                    className={`${styles.bgColor} rounded-xl border-2 shadow-lg dark:shadow-2xl p-4 sm:p-6 transition-all duration-300`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                      <h2
                        className={`text-lg sm:text-xl font-semibold ${styles.textColor} text-center sm:text-left`}
                      >
                        {timer.id.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badgeColor} uppercase tracking-wide self-center sm:self-auto`}
                      >
                        {timer.state === "complete" ? "RUNNING" : timer.state}
                      </span>
                    </div>

                    <div className="text-center mb-4">
                      <div
                        className={`text-4xl font-mono font-bold ${styles.textColor} tracking-wider transition-all duration-300 transform hover:scale-105`}
                      >
                        {timer.time}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs">
                        Hours : Minutes : Seconds
                      </p>
                    </div>
                    <div className="mt-6 flex justify-center gap-4">
                      <button
                        onClick={() => handleStartTimer(timer)} // Mengirim seluruh objek timer
                        className="px-5 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        // disabled={
                        // timer.state === "running"
                        // timer.state === "overrunning" ||
                        // timer.state === "overran"
                        // }
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleStopTimer(timer)} // Mengirim seluruh objek timer
                        className="px-5 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        // disabled={
                        //   timer.state === "stopped" || timer.state === "overran"
                        // }
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
