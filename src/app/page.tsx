"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [signature, setSignature] = useState("");
  const [message, setMessage] = useState<SiweMessage | null>(null);
  const [verificationStatus, setVerificationStatus] = useState("");
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleSign = async (simulateMismatch = false) => {
    if (!isConnected || !address || !chainId) return;
    setVerificationStatus("");
    setSignature("");
    setMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/api/nonce`
      );
      const { nonce: fetchedNonce } = await response.json();

      let nonce = fetchedNonce;
      if (simulateMismatch) {
        nonce = "mismatched-nonce";
      }

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
    } catch (error) {
      console.error("Error signing message:", error);
    }
  };

  const handleVerify = async () => {
    if (!message || !signature) return;

    setVerificationStatus("Verifying...");

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

      if (data.ok) {
        setVerificationStatus("Success!");
      } else {
        setVerificationStatus(`Failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      setVerificationStatus("Failed to verify signature.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      <div className="p-8 glass-card w-full max-w-lg flex flex-col items-center gap-6">
        <ConnectKitButton />

        {isConnected && (
          <div className="p-4 rounded-md w-full text-center glass-card">
            <p className="font-bold">Wallet Connected</p>
            <p className="text-sm truncate">Address: {address}</p>
          </div>
        )}

        {isConnected && (
          <div className="flex gap-4">
            <Button
              onClick={() => handleSign()}
              className="bg-[#FCD501] text-black hover:bg-yellow-400"
            >
              Sign-In with Ethereum
            </Button>
            <Button onClick={() => handleSign(true)} variant="destructive">
              Simulate Mismatch
            </Button>
          </div>
        )}

        {signature && (
          <div className="p-4 rounded-md w-full text-center glass-card">
            <p className="font-bold">Signature</p>
            <p className="text-sm break-words">{signature}</p>
            <Button onClick={handleVerify} className="mt-4">
              Verify Signature
            </Button>
          </div>
        )}

        {verificationStatus && (
          <div className="p-4 rounded-md w-full text-center glass-card">
            <p className="font-bold">Verification Status</p>
            <p className="text-sm">{verificationStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}
