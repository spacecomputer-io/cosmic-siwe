import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

interface SIWEState {
  nonce: string | null;
  message: SiweMessage | null;
  signature: string | null;
  verificationStatus: string;
  isLoading: boolean;
  usedFallback: boolean;
}

export function useSIWE() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [state, setState] = useState<SIWEState>({
    nonce: null,
    message: null,
    signature: null,
    verificationStatus: "",
    isLoading: false,
    usedFallback: false,
  });

  const fetchNonce = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/api/nonce`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch nonce");
      }
      const data = await response.json();
      setState((prev) => ({
        ...prev,
        nonce: data.nonce,
        usedFallback: data.usedFallback || false,
      }));
      return data;
    } catch (error) {
      console.error("Error fetching nonce:", error);
      throw error;
    }
  }, []);

  const signMessage = useCallback(async () => {
    if (!isConnected || !address || !chainId || !state.nonce) {
      console.log({
        isConnected,
        address,
        chainId,
        state,
      });
      throw new Error("Missing required data for signing");
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement:
          "Sign in with Ethereum using cosmic randomness for enhanced security.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: state.nonce,
      });

      const preparedMessage = message.prepareMessage();
      const signature = await signMessageAsync({ message: preparedMessage });

      setState((prev) => ({
        ...prev,
        message,
        signature,
        isLoading: false,
      }));

      return { message: preparedMessage, signature };
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      console.error("Error signing message:", error);
      throw error;
    }
  }, [isConnected, address, chainId, state, signMessageAsync]);

  const signMessageWithCustomNonce = useCallback(
    async (customNonce: string) => {
      if (!isConnected || !address || !chainId) {
        throw new Error("Missing required data for signing");
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const message = new SiweMessage({
          domain: window.location.host,
          address,
          statement:
            "Sign in with Ethereum using cosmic randomness for enhanced security.",
          uri: window.location.origin,
          version: "1",
          chainId,
          nonce: customNonce,
        });

        const preparedMessage = message.prepareMessage();
        const signature = await signMessageAsync({ message: preparedMessage });

        setState((prev) => ({
          ...prev,
          message,
          signature,
          isLoading: false,
        }));

        return { message: preparedMessage, signature };
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        console.error("Error signing message:", error);
        throw error;
      }
    },
    [isConnected, address, chainId, signMessageAsync]
  );

  const verifySignature = useCallback(async () => {
    if (!state.message || !state.signature) {
      throw new Error("No message or signature to verify");
    }

    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        verificationStatus: "Verifying...",
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/api/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: state.message.prepareMessage(),
            signature: state.signature,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.ok) {
        setState((prev) => ({
          ...prev,
          verificationStatus: "Success!",
          isLoading: false,
        }));
        return true;
      } else {
        const errorMessage = data.message || "Verification failed";
        setState((prev) => ({
          ...prev,
          verificationStatus: `Failed: ${errorMessage}`,
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setState((prev) => ({
        ...prev,
        verificationStatus: `Failed: ${errorMessage}`,
        isLoading: false,
      }));
      throw error;
    }
  }, [state.message, state.signature]);

  const reset = useCallback(() => {
    setState({
      nonce: null,
      message: null,
      signature: null,
      verificationStatus: "",
      isLoading: false,
      usedFallback: false,
    });
  }, []);

  return {
    ...state,
    fetchNonce,
    signMessage,
    signMessageWithCustomNonce,
    verifySignature,
    reset,
    isConnected,
    address,
    chainId,
  };
}
