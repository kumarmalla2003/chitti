// frontend/src/components/ui/ErrorBoundary.jsx

import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background-primary px-4">
                    <div className="text-center max-w-md">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-error-bg rounded-full">
                                <AlertTriangle className="w-16 h-16 text-error-accent" />
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                            Something went wrong
                        </h1>

                        <p className="text-text-secondary mb-6">
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors duration-200 font-medium"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>

                            <button
                                onClick={() => window.location.href = "/"}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-background-secondary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors duration-200 font-medium border border-border"
                            >
                                Go Home
                            </button>
                        </div>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mt-8 text-left p-4 bg-background-secondary rounded-lg border border-border">
                                <summary className="cursor-pointer text-text-secondary font-medium">
                                    Error Details
                                </summary>
                                <pre className="mt-2 text-sm text-error-accent overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
