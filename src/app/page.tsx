"use client";

import { useEffect, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";
import {
  Check,
  Loader2,
  X,
  Wallet,
  Shield,
  MessageSquare,
  Verified,
} from "lucide-react";
import { useSIWE } from "@/hooks/useSIWE";

interface Step {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
  icon: React.ReactNode;
}

export default function Home() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [shouldSignAfterNonce, setShouldSignAfterNonce] = useState(false);

  const {
    nonce,
    signature,
    verificationStatus,
    isLoading,
    usedFallback,
    fetchNonce,
    signMessage,
    verifySignature,
    reset,
    isConnected,
    address,
    chainId,
  } = useSIWE();

  const initializeSteps = (simulateMismatch: boolean) => {
    const baseSteps: Step[] = [
      {
        id: "connect",
        title: "Connect Wallet",
        description: "Connect your Ethereum wallet to get started",
        status: "pending",
        icon: <Wallet className="h-5 w-5" />,
      },
      {
        id: "generate-nonce",
        title: "Generate Nonce",
        description: usedFallback
          ? "Using fallback nonce (cosmic service unavailable)"
          : "Backend generates a cosmic nonce for security",
        status: "pending",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        id: "sign-message",
        title: "Sign Message",
        description: simulateMismatch
          ? "Sign message with mismatched nonce (for testing)"
          : "Sign the SIWE message with your wallet",
        status: "pending",
        icon: <MessageSquare className="h-5 w-5" />,
      },
      {
        id: "verify-signature",
        title: "Verify Signature",
        description: "Backend verifies your signature and nonce",
        status: "pending",
        icon: <Verified className="h-5 w-5" />,
      },
    ];

    setSteps(baseSteps);
  };

  const updateStepStatus = (stepId: string, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleSign = async (simulateMismatch = false) => {
    if (!isConnected || !address || !chainId) return;

    // Reset state
    reset();
    setShouldSignAfterNonce(false);

    // Initialize steps
    initializeSteps(simulateMismatch);

    // Mark connect step as completed
    updateStepStatus("connect", "completed");

    try {
      // Step 1: Generate Nonce
      updateStepStatus("generate-nonce", "loading");

      await fetchNonce();

      // Set flag to trigger signing after nonce is fetched
      setShouldSignAfterNonce(true);
    } catch (error) {
      console.error("Error fetching nonce:", error);
      updateStepStatus("generate-nonce", "error");
    }
  };

  const handleVerify = async () => {
    if (isLoading) return;

    updateStepStatus("verify-signature", "loading");

    try {
      await verifySignature();
      updateStepStatus("verify-signature", "completed");
    } catch (error) {
      console.error("Error verifying signature:", error);
      updateStepStatus("verify-signature", "error");
    }
  };

  useEffect(() => {
    const handleSignAfterNonce = async () => {
      if (!nonce) return;

      try {
        // Update step description if fallback was used
        if (usedFallback) {
          setSteps((prev) =>
            prev.map((step) =>
              step.id === "generate-nonce"
                ? {
                    ...step,
                    description:
                      "Using fallback nonce (cosmic service unavailable)",
                  }
                : step
            )
          );
        }
        updateStepStatus("generate-nonce", "completed");

        // Step 2: Sign Message
        updateStepStatus("sign-message", "loading");

        await signMessage();

        updateStepStatus("sign-message", "completed");
      } catch (error) {
        console.error("Error signing message:", error);
        updateStepStatus("sign-message", "error");
      }
    };

    if (shouldSignAfterNonce && nonce) {
      setShouldSignAfterNonce(false);
      handleSignAfterNonce();
    }
  }, [shouldSignAfterNonce, nonce, usedFallback, signMessage]);

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-500" />;
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-300 animate-spin" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <div className="text-gray-100">{step.icon}</div>;
    }
  };

  const getStepStatusColor = (step: Step) => {
    switch (step.status) {
      case "completed":
        return "text-green-300";
      case "loading":
        return "text-blue-300";
      case "error":
        return "text-red-300";
      default:
        return "text-gray-100";
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed"
    ).length;
    return steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      <div className="p-8 glass-card w-full max-w-2xl flex flex-col items-center gap-6">
        <ConnectKitButton />

        {isConnected && steps.length === 0 && (
          <div className="p-4 rounded-md w-full text-center glass-card">
            <p className="font-bold">Wallet Connected</p>
            <p className="text-sm truncate">Address: {address}</p>
          </div>
        )}

        {isConnected && steps.length === 0 && (
          <div className="flex gap-4">
            <Button
              onClick={() => handleSign()}
              className="bg-[#FCD501] text-black hover:bg-yellow-400"
            >
              Sign-In with Ethereum
            </Button>
            <Button
              onClick={() => handleSign(true)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Simulate Mismatch
            </Button>
          </div>
        )}

        {steps.length > 0 && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Sign-In with Ethereum Process
              </h2>
              <p className="text-gray-200">
                Follow the steps below to authenticate with your wallet
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                    step.status === "loading"
                      ? "bg-blue-50/20 border border-blue-200/30 shadow-lg"
                      : step.status === "completed"
                      ? "bg-green-50/20 border border-green-200/30 shadow-lg"
                      : step.status === "error"
                      ? "bg-red-50/20 border border-red-200/30 shadow-lg"
                      : "bg-gray-50/20 border border-gray-200/30"
                  }`}
                >
                  <div className="flex-shrink-0">{getStepIcon(step)}</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${getStepStatusColor(step)}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-200 mt-1">
                      {step.description}
                    </p>
                  </div>
                  {step.status === "loading" && (
                    <div className="flex-shrink-0">
                      <div className="animate-pulse text-blue-300 text-xs">
                        Processing...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {signature &&
              steps.some(
                (s) => s.id === "sign-message" && s.status === "completed"
              ) && (
                <div className="p-4 rounded-md w-full text-center glass-card border border-green-200/30">
                  <p className="font-bold text-green-300">
                    ✓ Signature Generated
                  </p>
                  <p className="text-sm text-gray-200 break-words mt-2 bg-gray-50/50 p-2 rounded">
                    {signature}
                  </p>
                  <Button
                    onClick={handleVerify}
                    className="mt-4 bg-[#FCD501] text-black hover:bg-yellow-400"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify Signature"}
                  </Button>
                </div>
              )}

            {verificationStatus && (
              <div
                className={`p-4 rounded-md w-full text-center glass-card ${
                  verificationStatus.includes("Success")
                    ? "border border-green-200/30"
                    : "border border-red-200/30"
                }`}
              >
                <p className="font-bold">Verification Status</p>
                <p
                  className={`text-sm ${
                    verificationStatus.includes("Success")
                      ? "text-green-300"
                      : "text-red-600"
                  }`}
                >
                  {verificationStatus}
                </p>
              </div>
            )}

            {steps.every((step) => step.status === "completed") && (
              <div className="text-center p-6 bg-green-50/20 border border-green-200/30 rounded-lg">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-300 mb-2">
                  Authentication Complete!
                </h3>
                <p className="text-gray-200 mb-4">
                  You have successfully signed in with Ethereum.
                </p>
                <Button
                  onClick={() => {
                    setSteps([]);
                    reset();
                  }}
                  className="bg-[#FCD501] text-black hover:bg-yellow-400"
                >
                  Start New Session
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
