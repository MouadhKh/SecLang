import { Box, Paper } from "@mui/material";

export const ExecutionResult = (props: { result: string }) => {
  return (
    <Box sx={{ overflow: "true", border: 2, borderColor: "#828A95" }}>
      <Paper
        variant={"outlined"}
        sx={{ backgroundColor: "", height: "calc(30vh - 64px)", padding: 2 }}
      >
        <div
          style={{
            color: props.result.includes("Error") ? "#FC5130" : "#1C0B19",
          }}
        >
          {props.result.split("\n").map((res, index) => (
            <div key={index}>{res}</div>
          ))}
        </div>
      </Paper>
    </Box>
  );
};
