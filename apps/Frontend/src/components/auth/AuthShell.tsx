import type { ReactNode } from "react";
import { Link } from "react-router";

export default function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  footer,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
  footer: ReactNode;
}) {
  return (
    <div className="stud-bg min-h-screen font-body text-neutral-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-5 sm:px-6">
        <Link to="/signin" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg border-2 border-black bg-red-600 font-block text-lg text-white shadow-[3px_3px_0_#000]">
            B
          </span>
          <span className="font-block text-base tracking-wide text-white">
            BLOCK<span className="text-red-500">BOARD</span>
          </span>
        </Link>
        <span className="rounded-md border-2 border-white/20 bg-white/10 px-2.5 py-1 font-block text-[11px] tracking-wider text-white">
          TRELLO-STYLE BOARDS
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <section className="hidden lg:block">
          <h2 className="max-w-md font-block text-4xl leading-[1.1] text-white xl:text-5xl">
            ORGANIZE WORK, <span className="text-red-500">BLOCK BY BLOCK.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm font-semibold leading-relaxed text-neutral-300">
            Plan projects, track tasks and collaborate with your team —
            all on one simple board.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm font-bold text-neutral-200">
            {["Boards, lists and cards", "Drag-and-drop workflow", "Team workspaces"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-[3px] border border-black bg-red-500" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border-[3px] border-black bg-[#f7f4ec] shadow-[6px_6px_0_#000]">
          <div className="h-2 bg-red-600" />
          <div className="p-6 sm:p-8">
            {eyebrow && (
              <p className="font-block text-[11px] tracking-widest text-red-600">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1.5 font-block text-2xl leading-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm font-bold text-neutral-600">{subtitle}</p>

            <div className="mt-6">{children}</div>

            <div className="mt-6 border-t-2 border-dashed border-neutral-300 pt-4 text-center text-sm font-bold text-neutral-600">
              {footer}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
