import { useState, useEffect } from "react";
import { CircularProgress, Typography, Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import { loadingPageStyle } from "../styles";
import MainPage from "./MainPage";

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const textVariations = [
  "We're getting things ready for you.",
  "Initializing the code editor just for you.",
  "Almost there! Just a moment.",
];

const LoadingPage = () => {
  const [loading, setLoading] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setSessionId(crypto.randomUUID());
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % textVariations.length);
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={loadingPageStyle}>
      {loading ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <CircularProgress
            style={{ color: "#197278" }}
            size={70}
            sx={{ animation: `${rotateAnimation} 2s linear infinite` }}
          />
          <Typography variant="h6" sx={{ marginTop: 2 }}>
            {textVariations[textIndex]}
          </Typography>
        </Box>
      ) : (
        <MainPage sessionId={sessionId} />
      )}
    </div>
  );
};

export default LoadingPage;
