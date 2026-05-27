import Image from "next/image";
import BottomTabs from "./components/BottomTabs";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-zinc-100 font-sans text-zinc-500">
      <header className="w-full">
        <div className="flex h-12 items-center justify-between bg-slate-900 px-6 text-white">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <Image
              src="/iitp-logo.png"
              alt="IIT Patna logo"
              width={1080}
              height={1080}
              className="h-10 w-10"
            />
            IITP Unofficial
          </div>

          <div className="flex items-center gap-1">
            <button aria-label="Notifications" className="flex h-10 w-10 items-center justify-center text-sm text-white">
              <img src="/notification_bell.png" alt="Notifications" className="h-6 w-6 object-contain" />
            </button>

            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold transition hover:bg-white/20">
              Me
            </button>
          </div>
        </div>
        <div className="h-6 bg-sky-900" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-start gap-6 px-6 py-6 pb-24 sm:px-8">
        <h2 className="w-full text-center text-2xl font-semibold text-zinc-900">Welcome</h2>
      </main>

      <BottomTabs />
    </div>
  );
}
