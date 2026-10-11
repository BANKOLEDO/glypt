import { Component, type ErrorInfo, type ReactNode } from "react";
import { Icon } from "@iconify/react";

type Props = { children: ReactNode };
type State = { crashed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the technical details out of the UI — they go to the console for us.
    console.error("[glypt] render error", error, info.componentStack);
  }

  private reset = () => this.setState({ crashed: false });

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-paper px-5 py-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-tang text-white shadow-[4px_4px_0_0_var(--color-ink)]">
            <Icon icon="ph:warning-octagon-fill" className="size-7" aria-hidden />
          </span>
          <h1 className="h-display mt-5 text-2xl">
            SOMETHING SNAGGED<span className="text-tang">.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            That one's on us, not you. Give it another go, or head home and pick
            up where you left off.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={this.reset} className="btn-primary">
              <Icon icon="ph:arrows-clockwise-bold" className="size-4" aria-hidden />
              Try again
            </button>
            <a href="/" className="btn-ghost">
              <Icon icon="ph:house-bold" className="size-4" aria-hidden />
              Back home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
