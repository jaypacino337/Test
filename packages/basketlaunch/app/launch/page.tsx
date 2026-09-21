import { LaunchWizard } from "@/components/LaunchWizard";

export default function LaunchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <span className="chip">Launch flow</span>
        <h1 className="headline mt-5 text-4xl font-semibold text-mist-100 sm:text-5xl">
          Compose it, weight it, ship it.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mist-300 sm:text-base">
          A basket is one token backed by several sleeves. Set the weights, deploy the curve, and
          it shows up on explore next to everything else — no allowlist, no review queue.
        </p>
      </header>

      <div className="mt-10">
        <LaunchWizard />
      </div>
    </div>
  );
}
