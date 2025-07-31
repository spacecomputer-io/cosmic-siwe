"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
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

interface Step {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
  icon: React.ReactNode;
}

export default function Home() {
  const [signature, setSignature] = useState("");
  const [message, setMessage] = useState<SiweMessage | null>(null);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

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
        description: "Backend generates a unique nonce for security",
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
    setCurrentStepIndex(0);
  };

  const updateStepStatus = (stepId: string, status: Step["status"]) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const moveToNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSign = async (simulateMismatch = false) => {
    if (!isConnected || !address || !chainId) return;

    // Reset state
    setVerificationStatus("");
    setSignature("");
    setMessage(null);
    setIsVerifying(false);

    // Initialize steps
    initializeSteps(simulateMismatch);

    // Mark connect step as completed
    updateStepStatus("connect", "completed");
    moveToNextStep();

    try {
      // Step 1: Generate Nonce
      updateStepStatus("generate-nonce", "loading");
      moveToNextStep();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/api/nonce`
      );
      const { nonce: fetchedNonce } = await response.json();

      let nonce = fetchedNonce;
      if (simulateMismatch) {
        nonce = "mismatchednonce";
      }

      updateStepStatus("generate-nonce", "completed");
      moveToNextStep();

      // Step 2: Sign Message
      updateStepStatus("sign-message", "loading");
      moveToNextStep();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      setSignature(signature);
      setMessage(message);
      updateStepStatus("sign-message", "completed");
      moveToNextStep();

      // Add a small delay to ensure session is properly established
      if (simulateMismatch) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error signing message:", error);
      updateStepStatus("sign-message", "error");
    }
  };

  const handleVerify = async () => {
    if (!message || !signature || isVerifying) return;

    setIsVerifying(true);
    setVerificationStatus("Verifying...");
    updateStepStatus("verify-signature", "loading");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/api/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, signature }),
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        setVerificationStatus("Success!");
        updateStepStatus("verify-signature", "completed");
      } else {
        setVerificationStatus(`Failed: ${data.message || "Unknown error"}`);
        updateStepStatus("verify-signature", "error");
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      setVerificationStatus("Failed to verify signature.");
      updateStepStatus("verify-signature", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-500" />;
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <div className="text-gray-400">{step.icon}</div>;
    }
  };

  const getStepStatusColor = (step: Step) => {
    switch (step.status) {
      case "completed":
        return "text-green-600";
      case "loading":
        return "text-blue-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-500";
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
              <p className="text-gray-600">
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
              {steps.map((step, index) => (
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
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                  {step.status === "loading" && (
                    <div className="flex-shrink-0">
                      <div className="animate-pulse text-blue-500 text-xs">
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
                  <p className="font-bold text-green-600">
                    ✓ Signature Generated
                  </p>
                  <p className="text-sm break-words mt-2 bg-gray-50/50 p-2 rounded">
                    {signature}
                  </p>
                  <Button
                    onClick={handleVerify}
                    className="mt-4 bg-[#FCD501] text-black hover:bg-yellow-400"
                    disabled={isVerifying}
                  >
                    {isVerifying ? "Verifying..." : "Verify Signature"}
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
                      ? "text-green-600"
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
                <h3 className="text-xl font-bold text-green-600 mb-2">
                  Authentication Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  You have successfully signed in with Ethereum.
                </p>
                <Button
                  onClick={() => {
                    setSteps([]);
                    setCurrentStepIndex(0);
                    setSignature("");
                    setMessage(null);
                    setVerificationStatus("");
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
