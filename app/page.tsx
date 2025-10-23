"use client";
import { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Edit2, X } from "lucide-react";

interface TimerId {
  uuid: string;
  name: string;
  index: number;
}
interface Timer {
  id: TimerId;
  time: string; // format "HH:MM:SS"
  state: "running" | "stopped" | "overran" | "overrunning" | "complete";
  allows_overrun: boolean;
}

const KNOWN_TIMERS = ["Countdown Ibadah", "PAW", "Khotbah", "Ministry Time"];
const parseHMSToSeconds = (timeString: string): number => {
  try {
    const parts = timeString.split(":");
    // Pastikan formatnya benar
    if (parts.length !== 3) {
      console.warn(`Format waktu salah: ${timeString}, pakai 300 detik.`);
      return 300; // default 5 menit jika format salah
    }

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  } catch (e) {
    console.error("Gagal parse time:", e);
    return 300; // default 5 menit jika ada error
  }
};
const getDefaultVisibility = () => {
  const defaultState: Record<string, boolean> = {};
  KNOWN_TIMERS.forEach((name) => {
    defaultState[name] = true;
  });
  return defaultState;
};

export default function TimerDashboard() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [visibleTimers, setVisibleTimers] = useState<Record<string, boolean>>(
    () => {
      if (typeof window === "undefined") {
        return getDefaultVisibility();
      }
      try {
        const stored = localStorage.getItem("visibleTimers");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error("Gagal parse filter dari localStorage", e);
      }
      return getDefaultVisibility();
    }
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<Timer | null>(null);
  const [newTime, setNewTime] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    try {
      localStorage.setItem("visibleTimers", JSON.stringify(visibleTimers));
    } catch (e) {
      console.error("Gagal menyimpan filter ke localStorage", e);
    }
  }, [visibleTimers]);

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
        setError(null);
        setTimers(data);
      } catch (err) {
        setError((err as Error).message);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleVisibilityToggle = (timerName: string) => {
    setVisibleTimers((prev) => ({
      ...prev,
      [timerName]: !prev[timerName],
    }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const openEditModal = (timer: Timer) => {
    setSelectedTimer(timer);
    const [h, m, s] = timer.time.split(":");
    setNewTime({ hours: h, minutes: m, seconds: s });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTimer(null);
    setNewTime({ hours: "00", minutes: "00", seconds: "00" });
  };

  const handleUpdateTimer = useCallback(async () => {
    if (!selectedTimer) return;
    try {
      const body = {
        id: selectedTimer.id,
        allows_overrun: true,
        countdown: {
          duration:
            Number.parseInt(newTime.hours) * 3600 +
            Number.parseInt(newTime.minutes) * 60 +
            Number.parseInt(newTime.seconds),
        },
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PROPRESENTER_API_URL}/v1/timer/${selectedTimer.id.index}/reset`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      console.log("Update response:", res);
      if (!res.ok) throw new Error("Failed to update timer");
      closeModal();
    } catch (err) {
      console.error("Error updating timer:", err);
      setError((err as Error).message);
    }
  }, [selectedTimer, newTime]);

  const handleStartTimer = useCallback(async (timer: Timer) => {
    const durationInSeconds = parseHMSToSeconds(timer.time);
    try {
      const body = {
        id: timer.id,
        allows_overrun: true,
        countdown: {
          duration: durationInSeconds,
        },
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PROPRESENTER_API_URL}/v1/timer/${timer.id.index}/start`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Failed to start timer");
    } catch (err) {
      console.error("Error starting timer:", err);
      setError((err as Error).message);
    }
  }, []);

  const handleStopTimer = useCallback(async (timer: Timer) => {
    const durationInSeconds = parseHMSToSeconds(timer.time);
    try {
      const body = {
        id: timer.id,
        allows_overrun: true,
        countdown: {
          duration: durationInSeconds,
        },
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PROPRESENTER_API_URL}/v1/timer/${timer.id.index}/stop`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
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
            "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-300 dark:border-green-700",
          textColor: "text-green-900 dark:text-green-100",
          badgeColor: "bg-green-500 text-white",
          accentColor: "text-green-600 dark:text-green-400",
        };
      case "overrunning":
      case "overran":
        return {
          bgColor:
            "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-300 dark:border-red-700",
          textColor: "text-red-900 dark:text-red-100",
          badgeColor: "bg-red-500 text-white",
          accentColor: "text-red-600 dark:text-red-400",
        };
      case "stopped":
        return {
          bgColor:
            "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-300 dark:border-amber-700",
          textColor: "text-amber-900 dark:text-amber-100",
          badgeColor: "bg-amber-500 text-white",
          accentColor: "text-amber-600 dark:text-amber-400",
        };
      default:
        return {
          bgColor:
            "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 border-gray-300 dark:border-gray-700",
          textColor: "text-gray-900 dark:text-white",
          badgeColor: "bg-gray-500 text-white",
          accentColor: "text-gray-600 dark:text-gray-400",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Timer Dashboard
          </h1>
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
            Tampilkan Timer
          </h3>
          <div className="flex flex-wrap gap-3">
            {KNOWN_TIMERS.map((name) => (
              <label
                key={name}
                className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500"
                  checked={visibleTimers[name] ?? true}
                  onChange={() => handleVisibilityToggle(name)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Timer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8 text-center max-w-md">
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
              {timers
                .filter((timer) => visibleTimers[timer.id.name] ?? true)
                .map((timer) => {
                  const styles = getStateStyles(timer.state);
                  return (
                    <div
                      key={timer.id.uuid}
                      className={`${styles.bgColor} rounded-2xl border-2 shadow-lg dark:shadow-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}
                    >
                      {/* Header dengan title dan badge */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h2
                            className={`text-xl font-bold ${styles.textColor} mb-2`}
                          >
                            {timer.id.name}
                          </h2>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${styles.badgeColor} uppercase tracking-widest`}
                          >
                            {timer.state === "complete"
                              ? "RUNNING"
                              : timer.state}
                          </span>
                        </div>
                        <button
                          onClick={() => openEditModal(timer)}
                          className={`p-2 rounded-lg ${styles.accentColor}  dark:bg-gray-700 bg-gray-100 dark:hover:bg-gray-600 hover:bg-gray-200 transition-all opacity-100`}
                          aria-label="Edit timer"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Timer Display */}
                      <div className="text-center mb-8">
                        <div
                          className={`text-5xl xl:text-6xl font-mono font-bold ${styles.textColor} tracking-wider transition-all duration-300 transform group-hover:scale-105 font-black`}
                        >
                          {timer.time}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-3 text-xs font-medium uppercase tracking-wide">
                          Hours : Minutes : Seconds
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStartTimer(timer)}
                          className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all shadow-md hover:shadow-lg"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => handleStopTimer(timer)}
                          className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all shadow-md hover:shadow-lg"
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
        <footer className="text-center mt-10 mb-6">
          <p className="text-sm text-gray-400 dark:text-gray-500 transition-all hover:text-gray-600 dark:hover:text-gray-400">
            Dashboard by Andre
          </p>
        </footer>
      </div>

      {isModalOpen && selectedTimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Waktu Timer
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
              {selectedTimer.id.name}
            </p>

            {/* Time Input */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-3">
                {/* Hours */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={newTime.hours}
                    onChange={(e) =>
                      setNewTime({
                        ...newTime,
                        hours: e.target.value.padStart(2, "0"),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Minutes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newTime.minutes}
                    onChange={(e) =>
                      setNewTime({
                        ...newTime,
                        minutes: e.target.value.padStart(2, "0"),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Seconds */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Seconds
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newTime.seconds}
                    onChange={(e) =>
                      setNewTime({
                        ...newTime,
                        seconds: e.target.value.padStart(2, "0"),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Preview
                </p>
                <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                  {newTime.hours}:{newTime.minutes}:{newTime.seconds}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTimer}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
