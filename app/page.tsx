import BottomTabs from "./components/BottomTabs";
import Header from "./components/Header";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-zinc-100 font-sans text-zinc-500">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-start gap-6 px-6 py-6 pb-24 sm:px-8">
        <h2 className="w-full text-center text-2xl font-semibold text-zinc-900">Welcome</h2>
      </main>

      <BottomTabs />
    </div>
  );
}
